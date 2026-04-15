// ============================================================
// Supabase Edge Function: mp-webhook
// Recibe notificaciones de MercadoPago y confirma pagos en DB
//
// Deploy: supabase functions deploy mp-webhook
// URL del webhook a configurar en MP:
//   https://<SUPABASE_PROJECT>.supabase.co/functions/v1/mp-webhook
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_BASE = 'https://api.mercadopago.com'

// Verifica la firma HMAC-SHA256 que MP envía en x-signature
async function verifyMpSignature(req: Request, rawBody: string, secret: string): Promise<boolean> {
  const xSignature  = req.headers.get('x-signature') ?? ''
  const xRequestId  = req.headers.get('x-request-id') ?? ''

  // Extraer ts y v1 del header  "ts=1234,v1=abcdef..."
  const parts: Record<string, string> = {}
  for (const part of xSignature.split(',')) {
    const [k, v] = part.split('=')
    if (k && v) parts[k.trim()] = v.trim()
  }
  const ts = parts['ts']; const v1 = parts['v1']
  if (!ts || !v1) return false

  // Extraer el id del pago del body para construir el mensaje
  let paymentId = ''
  try { paymentId = String(JSON.parse(rawBody)?.data?.id ?? '') } catch { /* ignore */ }

  // Mensaje canónico de MP: "id:<paymentId>;request-id:<xRequestId>;ts:<ts>"
  const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts}`

  const key  = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig  = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest))
  const hex  = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')

  return hex === v1
}

serve(async (req) => {
  // MP solo manda POST y GET (para verificación inicial)
  if (req.method === 'GET') {
    return new Response('MP Webhook OK', { status: 200 })
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const MP_TOKEN      = Deno.env.get('MP_ACCESS_TOKEN')
  const MP_WEBHOOK_SECRET = Deno.env.get('MP_WEBHOOK_SECRET')
  const SUPABASE_URL  = Deno.env.get('SUPABASE_URL') ?? ''
  const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false }
  })

  // Leer y parsear el body
  let rawBody: string
  try { rawBody = await req.text() } catch {
    return new Response('Invalid body', { status: 400 })
  }

  let body: any
  try {
    body = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  console.log('MP Webhook received:', JSON.stringify(body))

  // El dashboard de pruebas de MP envía live_mode: false con IDs falsos — ignorar
  if (body.live_mode === false) {
    console.log('MP Webhook: test ping (live_mode=false), ignoring')
    return new Response('OK', { status: 200 })
  }

  // Verificar firma MP en notificaciones reales (live_mode: true)
  const hasSignature = req.headers.has('x-signature')
  if (MP_WEBHOOK_SECRET && hasSignature) {
    const valid = await verifyMpSignature(req, rawBody, MP_WEBHOOK_SECRET)
    if (!valid) {
      console.warn('MP Webhook: invalid signature — request rejected')
      return new Response('Unauthorized', { status: 401 })
    }
  }

  // MP envía type=payment o type=subscription_preapproval
  const { type, data } = body

  if (type !== 'payment') {
    // Ignorar otros tipos por ahora
    return new Response('OK', { status: 200 })
  }

  const paymentId = data?.id
  if (!paymentId || !MP_TOKEN) {
    return new Response('Missing data', { status: 400 })
  }

  // Obtener detalles del pago desde MP API
  const mpRes = await fetch(`${MP_BASE}/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${MP_TOKEN}` },
  })

  if (!mpRes.ok) {
    console.error('Failed to fetch MP payment:', mpRes.status)
    return new Response('MP fetch failed', { status: 500 })
  }

  const payment = await mpRes.json()
  console.log('Payment status:', payment.status, '| External ref:', payment.external_reference)

  const externalRef: string = payment.external_reference ?? ''
  const mpStatus = payment.status // 'approved' | 'rejected' | 'pending' | etc.

  // Mapear status de MP a nuestro status
  const dbStatus =
    mpStatus === 'approved' ? 'approved' :
    mpStatus === 'rejected' ? 'rejected' :
    mpStatus === 'cancelled' ? 'cancelled' :
    'pending'

  // ── Partido fraccionado (pre-auth) ────────────────────────
  // externalRef: party_<party_id>_player_<player_id>_<ts>
  if (externalRef.startsWith('party_')) {
    const parts = externalRef.split('_')
    // formato: party_<uuid>_player_<uuid>_<ts>  → idx 0=party, 1=partyId, 2=player, 3=playerId
    const partyId  = parts[1]
    const playerId = parts[3]

    if (partyId && playerId) {
      // Mapear status MP → nuestro mp_status
      const partyMpStatus =
        mpStatus === 'authorized'                    ? 'authorized' :
        mpStatus === 'approved'                      ? 'captured'   :
        mpStatus === 'cancelled'                     ? 'cancelled'  :
        mpStatus === 'rejected'                      ? 'cancelled'  : 'pending'

      await supabase
        .from('party_payments')
        .update({
          mp_payment_id: String(paymentId),
          mp_status: partyMpStatus,
          paid_at: ['authorized','captured'].includes(partyMpStatus) ? new Date().toISOString() : null,
        })
        .eq('party_id', partyId)
        .eq('player_id', playerId)

      // Notificar al organizador si se autorizó el pago
      if (partyMpStatus === 'authorized' || partyMpStatus === 'captured') {
        const { data: partyData } = await supabase
          .from('parties')
          .select('creator_id, court_name, collected_amount, seña_amount')
          .eq('id', partyId)
          .single()

        if (partyData?.creator_id) {
          await supabase.from('notifications').insert({
            user_id: partyData.creator_id,
            title: '💳 Nuevo pago recibido',
            body: `Un jugador pagó su parte para ${partyData.court_name ?? 'el partido'}. Total: $${(partyData.collected_amount ?? 0).toLocaleString('es-AR')} / $${(partyData.seña_amount ?? 0).toLocaleString('es-AR')}`,
            type: 'party_payment',
          })
        }
      }
    }

    return new Response('OK', { status: 200 })
  }

  // Actualizar payments table (flujo legacy: booking, suscripciones)
  await supabase
    .from('payments')
    .update({ mp_payment_id: String(paymentId), status: dbStatus, updated_at: new Date().toISOString() })
    .eq('mp_external_ref', externalRef)

  if (dbStatus !== 'approved') {
    return new Response('OK', { status: 200 })
  }

  // ── Acciones post-aprobación ───────────────────────────────

  if (externalRef.startsWith('booking_')) {
    // Confirmar reserva
    const bookingId = externalRef.replace('booking_', '')
    await supabase
      .from('court_availability')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)

    // Notificar al dueño (insertar notificación)
    const { data: slot } = await supabase
      .from('court_availability')
      .select('courts(owner_id, name)')
      .eq('id', bookingId)
      .single()

    const ownerId = (slot as any)?.courts?.owner_id
    const courtName = (slot as any)?.courts?.name ?? 'Cancha'

    if (ownerId) {
      await supabase.from('notifications').insert({
        user_id: ownerId,
        title: '💳 Reserva confirmada',
        body: `Nueva reserva confirmada en ${courtName} — el jugador ya pagó la seña.`,
        type: 'booking_confirmed',
      })
    }
  } else if (externalRef.startsWith('pro_player_')) {
    // Activar membresía PRO jugador
    const userId = externalRef.replace('pro_player_', '').split('_')[0]
    const now = new Date().toISOString()
    const endsAt = new Date()
    endsAt.setMonth(endsAt.getMonth() + 1)

    // Actualizar trial/pending existente → si no hay, insertar nuevo
    const { data: updated } = await supabase
      .from('subscriptions')
      .update({ status: 'active', mp_payment_id: String(paymentId), amount: 1000, is_trial: false, starts_at: now, ends_at: endsAt.toISOString() })
      .eq('user_id', userId)
      .eq('plan', 'pro_player')
      .in('status', ['pending', 'trial'])
      .select('id')

    if (!updated || updated.length === 0) {
      await supabase.from('subscriptions').insert({
        user_id: userId, plan: 'pro_player', status: 'active',
        amount: 1000, mp_payment_id: String(paymentId), is_trial: false,
        starts_at: now, ends_at: endsAt.toISOString(),
      })
    }

    // Actualizar plan en players table
    await supabase.from('players').update({ plan: 'pro' }).eq('profile_id', userId)

  } else if (externalRef.startsWith('owner_sub_annual_')) {
    // Activar suscripción dueño — plan ANUAL ($100.000 ARS / 1 año)
    const userId = externalRef.replace('owner_sub_annual_', '').split('_')[0]
    const now = new Date().toISOString()
    const endsAt = new Date()
    endsAt.setFullYear(endsAt.getFullYear() + 1)

    const { data: updated } = await supabase
      .from('subscriptions')
      .update({ status: 'active', mp_payment_id: String(paymentId), amount: 100000, is_trial: false, starts_at: now, ends_at: endsAt.toISOString() })
      .eq('user_id', userId)
      .eq('plan', 'owner')
      .in('status', ['pending', 'trial'])
      .select('id')

    if (!updated || updated.length === 0) {
      await supabase.from('subscriptions').insert({
        user_id: userId, plan: 'owner', status: 'active',
        amount: 100000, mp_payment_id: String(paymentId), is_trial: false,
        starts_at: now, ends_at: endsAt.toISOString(),
      })
    }

  } else if (externalRef.startsWith('owner_sub_')) {
    // Activar suscripción dueño — plan MENSUAL ($10.000 ARS / 1 mes)
    const userId = externalRef.replace('owner_sub_', '').split('_')[0]
    const now = new Date().toISOString()
    const endsAt = new Date()
    endsAt.setMonth(endsAt.getMonth() + 1)

    // Actualizar trial/pending existente → si no hay, insertar nuevo
    const { data: updated } = await supabase
      .from('subscriptions')
      .update({ status: 'active', mp_payment_id: String(paymentId), amount: 15000, is_trial: false, starts_at: now, ends_at: endsAt.toISOString() })
      .eq('user_id', userId)
      .eq('plan', 'owner')
      .in('status', ['pending', 'trial'])
      .select('id')

    if (!updated || updated.length === 0) {
      await supabase.from('subscriptions').insert({
        user_id: userId, plan: 'owner', status: 'active',
        amount: 15000, mp_payment_id: String(paymentId), is_trial: false,
        starts_at: now, ends_at: endsAt.toISOString(),
      })
    }
  }

  return new Response('OK', { status: 200 })
})
