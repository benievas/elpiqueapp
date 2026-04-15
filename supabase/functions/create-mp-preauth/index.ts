// ============================================================
// Edge Function: create-mp-preauth
// Crea una preferencia MP con capture=false (pre-autorización)
// El dinero queda retenido hasta que se capture o cancele.
//
// Deploy: supabase functions deploy create-mp-preauth
// Secrets: MP_ACCESS_TOKEN, APP_URL
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
  const APP_URL      = Deno.env.get('APP_URL') ?? 'https://elpiqueapp.com'
  const FEE_RATE     = 0.05

  if (!MP_TOKEN) {
    return Response.json({ error: 'MP_ACCESS_TOKEN no configurado' }, { status: 503, headers: corsHeaders })
  }

  let body: any
  try { body = await req.json() }
  catch { return Response.json({ error: 'JSON inválido' }, { status: 400, headers: corsHeaders }) }

  const { party_id, player_id, amount, payer_email, court_name } = body

  if (!party_id || !player_id || !amount || !payer_email) {
    return Response.json(
      { error: 'Faltan parámetros: party_id, player_id, amount, payer_email' },
      { status: 400, headers: corsHeaders }
    )
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

  // Verificar que el jugador es miembro del partido
  const { data: member } = await supabase
    .from('party_members')
    .select('id')
    .eq('party_id', party_id)
    .eq('player_id', player_id)
    .single()

  if (!member) {
    return Response.json({ error: 'El jugador no es miembro del partido' }, { status: 403, headers: corsHeaders })
  }

  // Verificar que no haya un pago previo activo
  const { data: existing } = await supabase
    .from('party_payments')
    .select('id, mp_status')
    .eq('party_id', party_id)
    .eq('player_id', player_id)
    .single()

  if (existing && ['authorized', 'captured'].includes(existing.mp_status)) {
    return Response.json({ error: 'Ya existe un pago activo para este jugador en este partido' }, { status: 409, headers: corsHeaders })
  }

  // Obtener token MP del owner del partido (para split automático)
  let ownerMpToken: string | null = null
  let marketplaceFee: number | null = null

  const { data: partySlot } = await supabase
    .from('court_availability')
    .select('courts(complexes(owner_id))')
    .eq('party_id', party_id)
    .single()

  const ownerId = (partySlot as any)?.courts?.complexes?.owner_id
  if (ownerId) {
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('mp_access_token')
      .eq('id', ownerId)
      .single()
    if (ownerProfile?.mp_access_token) {
      ownerMpToken   = ownerProfile.mp_access_token
      marketplaceFee = Math.ceil(Number(amount) * FEE_RATE)
    }
  }

  const activeToken = ownerMpToken ?? MP_TOKEN
  const externalRef = `party_${party_id}_player_${player_id}_${Date.now()}`

  // Crear preferencia (con marketplace_fee si el owner está conectado)
  const preference: any = {
    items: [{
      id: `slot_${party_id}`,
      title: court_name ? `Reserva: ${court_name}` : 'Reserva de cancha — El Pique',
      quantity: 1,
      unit_price: Number(amount),
      currency_id: 'ARS',
    }],
    payer: { email: payer_email },
    external_reference: externalRef,
    // capture: false → pre-autorización (el dinero se retiene, no se acredita)
    // Nota: MP soporta esto via Payment API, no via Preferences.
    // La preferencia se usa para el checkout; el capture=false se setea al crear el payment.
    // Ver: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/two-step-payments
    payment_methods: {
      excluded_payment_types: [{ id: 'ticket' }, { id: 'bank_transfer' }],
    },
    back_urls: {
      success: `${APP_URL}/checkout/success?party=${party_id}`,
      failure: `${APP_URL}/checkout/failure?party=${party_id}`,
      pending: `${APP_URL}/checkout/pending?party=${party_id}`,
    },
    notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
    auto_return: 'approved',
    statement_descriptor: 'ELPIQUE',
    metadata: { party_id, player_id, type: 'party_payment' },
  }

  if (marketplaceFee !== null) {
    preference.marketplace_fee = marketplaceFee
  }

  try {
    const mpRes = await fetch(`${MP_BASE}/checkout/preferences`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${activeToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    })

    const data = await mpRes.json()

    if (!mpRes.ok) {
      console.error('MP API error:', data)
      return Response.json({ error: data }, { status: mpRes.status, headers: corsHeaders })
    }

    // Registrar o actualizar en party_payments
    const paymentRow = {
      party_id,
      player_id,
      amount: Number(amount),
      mp_preference_id: data.id,
      mp_status: 'pending',
    }

    if (existing) {
      await supabase.from('party_payments').update(paymentRow).eq('id', existing.id)
    } else {
      await supabase.from('party_payments').insert(paymentRow)
    }

    return Response.json(
      {
        preference_id: data.id,
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point,
      },
      { headers: corsHeaders }
    )
  } catch (e: any) {
    console.error('Error create-mp-preauth:', e)
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders })
  }
})
