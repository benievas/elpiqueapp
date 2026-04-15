// ============================================================
// Edge Function: capture-party-payments
// Captura todos los holds autorizados de un partido.
// Se llama automáticamente cuando payment_status → 'funded'.
// También hace el split MP al dueño de la cancha (Marketplace).
//
// Deploy: supabase functions deploy capture-party-payments
// Secrets: MP_ACCESS_TOKEN, MP_PLATFORM_FEE_PCT (default 5)
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

  const MP_TOKEN    = Deno.env.get('MP_ACCESS_TOKEN')
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
  const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const FEE_PCT      = Number(Deno.env.get('MP_PLATFORM_FEE_PCT') ?? '5') / 100

  if (!MP_TOKEN) {
    return Response.json({ error: 'MP_ACCESS_TOKEN no configurado' }, { status: 503, headers: corsHeaders })
  }

  let body: any
  try { body = await req.json() }
  catch { return Response.json({ error: 'JSON inválido' }, { status: 400, headers: corsHeaders }) }

  const { party_id } = body
  if (!party_id) {
    return Response.json({ error: 'Falta party_id' }, { status: 400, headers: corsHeaders })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

  // Obtener payments autorizados del partido
  const { data: payments, error: payErr } = await supabase
    .from('party_payments')
    .select('id, player_id, amount, mp_payment_id')
    .eq('party_id', party_id)
    .eq('mp_status', 'authorized')

  if (payErr) {
    return Response.json({ error: payErr.message }, { status: 500, headers: corsHeaders })
  }

  if (!payments || payments.length === 0) {
    return Response.json({ message: 'No hay pagos autorizados para capturar', captured: 0 }, { headers: corsHeaders })
  }

  const results: any[] = []

  for (const payment of payments) {
    if (!payment.mp_payment_id) {
      results.push({ player_id: payment.player_id, status: 'skipped', reason: 'sin mp_payment_id' })
      continue
    }

    try {
      // Capturar el pago en MP
      const mpRes = await fetch(`${MP_BASE}/v1/payments/${payment.mp_payment_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${MP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ capture: true }),
      })

      const mpData = await mpRes.json()

      if (!mpRes.ok) {
        console.error(`Error capturando ${payment.mp_payment_id}:`, mpData)
        results.push({ player_id: payment.player_id, status: 'error', error: mpData })
        continue
      }

      // Actualizar estado en DB
      await supabase
        .from('party_payments')
        .update({ mp_status: 'captured', captured_at: new Date().toISOString() })
        .eq('id', payment.id)

      results.push({ player_id: payment.player_id, status: 'captured', mp_payment_id: payment.mp_payment_id })

    } catch (e: any) {
      console.error(`Excepción capturando ${payment.mp_payment_id}:`, e)
      results.push({ player_id: payment.player_id, status: 'exception', error: e.message })
    }
  }

  // Actualizar payment_status del partido a 'released'
  const allCaptured = results.every(r => r.status === 'captured')
  if (allCaptured) {
    await supabase
      .from('parties')
      .update({ payment_status: 'released' })
      .eq('id', party_id)
  }

  return Response.json({ captured: results.filter(r => r.status === 'captured').length, results }, { headers: corsHeaders })
})
