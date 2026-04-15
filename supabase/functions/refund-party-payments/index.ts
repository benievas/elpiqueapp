// ============================================================
// Edge Function: refund-party-payments
// Reembolsa pagos de un partido (todos o de un jugador).
// Se llama cuando:
//   - Un jugador se baja ANTES de que el partido esté funded
//   - El partido se cancela antes de llegar a la meta
//   - cancel-expired-parties detecta un timeout
//
// Body: { party_id: string, player_id?: string }
// Deploy: supabase functions deploy refund-party-payments
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_BASE = 'https://api.mercadopago.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const MP_TOKEN     = Deno.env.get('MP_ACCESS_TOKEN')
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
  const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!MP_TOKEN) {
    return Response.json({ error: 'MP_ACCESS_TOKEN no configurado' }, { status: 503, headers: corsHeaders })
  }

  let body: any
  try { body = await req.json() }
  catch { return Response.json({ error: 'JSON inválido' }, { status: 400, headers: corsHeaders }) }

  const { party_id, player_id } = body
  if (!party_id) {
    return Response.json({ error: 'Falta party_id' }, { status: 400, headers: corsHeaders })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

  // Verificar que el partido NO esté funded/released (regla de negocio)
  const { data: party } = await supabase
    .from('parties')
    .select('payment_status')
    .eq('id', party_id)
    .single()

  if (party && ['funded', 'released'].includes(party.payment_status)) {
    return Response.json(
      { error: 'No se puede reembolsar: el partido ya está confirmado y el dinero fue enviado al establecimiento.' },
      { status: 409, headers: corsHeaders }
    )
  }

  // Obtener pagos capturados (los únicos que se pueden reembolsar)
  let query = supabase
    .from('party_payments')
    .select('id, player_id, mp_payment_id, mp_status, amount')
    .eq('party_id', party_id)
    .in('mp_status', ['captured', 'authorized'])

  if (player_id) query = query.eq('player_id', player_id)

  const { data: payments, error: payErr } = await query
  if (payErr) return Response.json({ error: payErr.message }, { status: 500, headers: corsHeaders })

  if (!payments || payments.length === 0) {
    // Nada que reembolsar — cancelar pagos pendientes (sin cobrar)
    let cancelQuery = supabase
      .from('party_payments')
      .update({ mp_status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('party_id', party_id)
      .eq('mp_status', 'pending')
    if (player_id) cancelQuery = cancelQuery.eq('player_id', player_id)
    await cancelQuery
    return Response.json({ message: 'Sin pagos capturados. Pagos pendientes cancelados.', refunded: 0 }, { headers: corsHeaders })
  }

  const results: any[] = []

  for (const payment of payments) {
    if (!payment.mp_payment_id) {
      await supabase.from('party_payments')
        .update({ mp_status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', payment.id)
      results.push({ player_id: payment.player_id, status: 'cancelled_local' })
      continue
    }

    try {
      // Reembolso total via MP API
      const mpRes = await fetch(`${MP_BASE}/v1/payments/${payment.mp_payment_id}/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // body vacío = reembolso total
      })

      const mpData = await mpRes.json()

      if (!mpRes.ok) {
        console.error(`Error reembolsando ${payment.mp_payment_id}:`, mpData)
        results.push({ player_id: payment.player_id, status: 'error', error: mpData })
        continue
      }

      await supabase.from('party_payments')
        .update({ mp_status: 'refunded', cancelled_at: new Date().toISOString() })
        .eq('id', payment.id)

      // Notificar al jugador
      await supabase.from('notifications').insert({
        user_id: payment.player_id,
        title: '💸 Reembolso procesado',
        body: `Tu pago de $${payment.amount.toLocaleString('es-AR')} fue reembolsado. El dinero vuelve a tu cuenta en 2-10 días hábiles según tu banco.`,
        type: 'payment_refunded',
      })

      results.push({ player_id: payment.player_id, status: 'refunded', mp_refund_id: mpData.id })

    } catch (e: any) {
      console.error(`Excepción reembolsando ${payment.mp_payment_id}:`, e)
      results.push({ player_id: payment.player_id, status: 'exception', error: e.message })
    }
  }

  return Response.json(
    { refunded: results.filter(r => r.status === 'refunded').length, results },
    { headers: corsHeaders }
  )
})
