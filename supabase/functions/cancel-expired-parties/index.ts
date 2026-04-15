// ============================================================
// Edge Function: cancel-expired-parties
// Cancela partidos cuyo payment_deadline venció sin llegar a la meta.
// Reembolsa automáticamente a cada jugador que pagó.
//
// Se ejecuta de dos formas:
//   1. Deno.cron: cada hora automáticamente (sin necesidad de pg_cron)
//   2. HTTP POST: invocación manual o desde otro proceso
//
// Deploy: supabase functions deploy cancel-expired-parties
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_BASE = 'https://api.mercadopago.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function processExpiredParties() {
  const MP_TOKEN     = Deno.env.get('MP_ACCESS_TOKEN')
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
  const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!MP_TOKEN || !SUPABASE_URL || !SERVICE_KEY) {
    console.error('cancel-expired-parties: faltan variables de entorno')
    return { processed: 0, error: 'Config incompleta' }
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

  const { data: expired, error } = await supabase
    .from('parties')
    .select('id, court_name, payment_status, collected_amount, seña_amount')
    .lt('payment_deadline', new Date().toISOString())
    .in('payment_status', ['pending', 'partial'])
    .neq('status', 'cancelled')

  if (error) { console.error('Error buscando expirados:', error); return { error: error.message } }
  if (!expired || expired.length === 0) return { processed: 0, message: 'Sin partidos expirados' }

  console.log(`Procesando ${expired.length} partidos expirados...`)
  const results: any[] = []

  for (const party of expired) {
    try {
      // Obtener pagos capturados de este partido
      const { data: payments } = await supabase
        .from('party_payments')
        .select('id, player_id, mp_payment_id, mp_status, amount')
        .eq('party_id', party.id)
        .in('mp_status', ['captured', 'authorized', 'pending'])

      let refundedCount = 0

      for (const payment of (payments ?? [])) {
        if (['captured', 'authorized'].includes(payment.mp_status) && payment.mp_payment_id) {
          // Reembolsar via MP
          const mpRes = await fetch(`${MP_BASE}/v1/payments/${payment.mp_payment_id}/refunds`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${MP_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          })
          if (mpRes.ok) {
            refundedCount++
            await supabase.from('party_payments')
              .update({ mp_status: 'refunded', cancelled_at: new Date().toISOString() })
              .eq('id', payment.id)
            await supabase.from('notifications').insert({
              user_id: payment.player_id,
              title: '💸 Reembolso automático',
              body: `El partido no llegó a cubrir la seña a tiempo. Tu pago de $${payment.amount.toLocaleString('es-AR')} fue reembolsado.`,
              type: 'payment_refunded',
            })
          }
        } else {
          // Pago pendiente (nunca completó el checkout) → solo cancelar en DB
          await supabase.from('party_payments')
            .update({ mp_status: 'cancelled', cancelled_at: new Date().toISOString() })
            .eq('id', payment.id)
        }
      }

      // Cancelar el partido y liberar el slot
      await supabase.from('parties').update({ status: 'cancelled', payment_status: 'refunded' }).eq('id', party.id)
      await supabase.from('court_availability').update({ status: 'rejected' }).eq('party_id', party.id).eq('status', 'pending')

      // Notificar al organizador
      const { data: creator } = await supabase.from('parties').select('creator_id').eq('id', party.id).single()
      if (creator?.creator_id) {
        await supabase.from('notifications').insert({
          user_id: creator.creator_id,
          title: '⏰ Partido cancelado por timeout',
          body: `El partido en ${party.court_name ?? 'la cancha'} fue cancelado porque no se completó el pago antes del límite.`,
          type: 'party_cancelled',
        })
      }

      results.push({ party_id: party.id, result: 'cancelled', refunded: refundedCount })
      console.log(`Partido ${party.id} cancelado. Reembolsos: ${refundedCount}`)

    } catch (e: any) {
      console.error(`Error procesando ${party.id}:`, e)
      results.push({ party_id: party.id, result: 'error', error: e.message })
    }
  }

  return { processed: results.length, cancelled: results.filter(r => r.result === 'cancelled').length, results }
}

// Cron automático: se ejecuta cada hora sin necesidad de pg_cron
Deno.cron('cancel-expired-parties', '0 * * * *', async () => {
  console.log('Cron cancel-expired-parties ejecutándose...')
  const result = await processExpiredParties()
  console.log('Resultado:', JSON.stringify(result))
})

// HTTP handler: para invocación manual o testing
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  const result = await processExpiredParties()
  return Response.json(result, { headers: corsHeaders })
})
