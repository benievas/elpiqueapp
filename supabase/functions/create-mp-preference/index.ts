// ============================================================
// Supabase Edge Function: create-mp-preference
// Crea una preferencia de pago en MercadoPago (server-side)
//
// Deploy: supabase functions deploy create-mp-preference
// Secrets: supabase secrets set MP_ACCESS_TOKEN=<tu_token>
//          supabase secrets set APP_URL=https://tu-app.com
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_BASE = 'https://api.mercadopago.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const MP_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
  if (!MP_TOKEN) {
    return Response.json(
      { error: 'MP not configured — agregá MP_ACCESS_TOKEN en los secrets de Supabase' },
      { status: 503, headers: corsHeaders }
    )
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders })
  }

  const { booking_id, type, user_id, title, amount } = body

  if (!type || !user_id || !title || amount === undefined || amount === null) {
    return Response.json({ error: 'Faltan parámetros: type, user_id, title, amount' }, { status: 400, headers: corsHeaders })
  }

  const numericAmount = Number(amount)

  if (isNaN(numericAmount) || numericAmount <= 0) {
    return Response.json(
      { error: 'El parámetro `amount` debe ser un número positivo.' },
      { status: 400, headers: corsHeaders }
    )
  }

  const externalRef = booking_id
    ? `booking_${booking_id}`
    : `${type}_${user_id}_${Date.now()}`

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
  const APP_URL = Deno.env.get('APP_URL') ?? 'https://elpiqueapp.com'
  const FEE_RATE = 0.05 // 5% MatchPro

  // Para reservas de cancha: obtener el token MP del owner para split automático
  let ownerMpToken: string | null = null
  let ownerMpUserId: string | null = null
  let marketplaceFee: number | null = null

  if (type === 'booking' && booking_id) {
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )
    // Buscar el owner del slot → court → complex → owner
    const { data: slot } = await supabaseAdmin
      .from('court_availability')
      .select('courts(complexes(owner_id))')
      .eq('id', booking_id)
      .single()

    const ownerId = (slot as any)?.courts?.complexes?.owner_id
    if (ownerId) {
      const { data: ownerProfile } = await supabaseAdmin
        .from('profiles')
        .select('mp_access_token, mp_user_id')
        .eq('id', ownerId)
        .single()

      if (ownerProfile?.mp_access_token) {
        ownerMpToken = ownerProfile.mp_access_token
        ownerMpUserId = ownerProfile.mp_user_id
        marketplaceFee = Math.ceil(numericAmount * FEE_RATE)
      }
    }
  }

  // Usar token del owner si está conectado, si no usar el de MatchPro
  const activeToken = ownerMpToken ?? MP_TOKEN

  const preference: any = {
    items: [{
      id: externalRef,
      title,
      quantity: 1,
      unit_price: numericAmount,
      currency_id: 'ARS',
    }],
    external_reference: externalRef,
    payer: { email: body.payer_email ?? '' },
    back_urls: {
      success: `${APP_URL}/checkout/success`,
      failure: `${APP_URL}/checkout/failure`,
      pending: `${APP_URL}/checkout/pending`,
    },
    notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
    auto_return: 'approved',
    statement_descriptor: 'ELPIQUE',
  }

  // Agregar marketplace_fee si el owner está conectado
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

    // Registrar el pago en la tabla payments
    const supabase = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    await supabase.from('payments').insert({
      user_id,
      booking_id: booking_id ?? null,
      type,
      amount: numericAmount,
      mp_preference_id: data.id,
      mp_external_ref: externalRef,
      status: 'pending',
    })

    return Response.json(
      {
        id: data.id,
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point,
      },
      { headers: corsHeaders }
    )
  } catch (e: any) {
    console.error('Error creating MP preference:', e)
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders })
  }
})
