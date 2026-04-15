// ============================================================
// Edge Function: cancel-party-payments
// Cancela holds de un partido (todos o de un jugador específico).
// Llamada por triggers SQL al:
//   - Cancelar un partido
//   - Eliminar un jugador de party_members
//
// Body: { party_id: string, player_id?: string }
// Si player_id está presente, solo cancela el hold de ese jugador.
// Si no, cancela todos los holds del partido.
//
// Deploy: supabase functions deploy cancel-party-payments
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

  // Armar query: todos o solo un jugador
  let query = supabase
    .from('party_payments')
    .select('id, player_id, mp_payment_id, mp_status')
    .eq('party_id', party_id)
    .in('mp_status', ['pending', 'authorized'])

  if (player_id) {
    query = query.eq('player_id', player_id)
  }

  const { data: payments, error: payErr } = await query

  if (payErr) {
    return Response.json({ error: payErr.message }, { status: 500, headers: corsHeaders })
  }

  if (!payments || payments.length === 0) {
    return Response.json({ message: 'No hay pagos activos para cancelar', cancelled: 0 }, { headers: corsHeaders })
  }

  const results: any[] = []

  for (const payment of payments) {
    // Si ya no tiene mp_payment_id (nunca completó el checkout), solo marcar en DB
    if (!payment.mp_payment_id) {
      await supabase
        .from('party_payments')
        .update({ mp_status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', payment.id)
      results.push({ player_id: payment.player_id, status: 'cancelled_local' })
      continue
    }

    try {
      // Cancelar en MP (libera el hold sin cobrar)
      const mpRes = await fetch(`${MP_BASE}/v1/payments/${payment.mp_payment_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${MP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      })

      const mpData = await mpRes.json()

      if (!mpRes.ok) {
        // Si MP dice que ya estaba cancelado, igual actualizar DB
        const alreadyCancelled = mpData?.error === 'bad_request' || mpData?.status === 'cancelled'
        if (!alreadyCancelled) {
          console.error(`Error cancelando ${payment.mp_payment_id}:`, mpData)
          results.push({ player_id: payment.player_id, status: 'error', error: mpData })
          continue
        }
      }

      await supabase
        .from('party_payments')
        .update({ mp_status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', payment.id)

      results.push({ player_id: payment.player_id, status: 'cancelled', mp_payment_id: payment.mp_payment_id })

    } catch (e: any) {
      console.error(`Excepción cancelando ${payment.mp_payment_id}:`, e)
      results.push({ player_id: payment.player_id, status: 'exception', error: e.message })
    }
  }

  // Si es cancelación de todo el partido, actualizar payment_status
  if (!player_id) {
    await supabase
      .from('parties')
      .update({ payment_status: 'refunded' })
      .eq('id', party_id)
  }

  return Response.json(
    { cancelled: results.filter(r => ['cancelled', 'cancelled_local'].includes(r.status)).length, results },
    { headers: corsHeaders }
  )
})
