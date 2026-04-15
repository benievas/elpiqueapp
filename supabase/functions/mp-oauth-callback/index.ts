// ============================================================
// Edge Function: mp-oauth-callback
// Recibe el código de autorización de MercadoPago y lo intercambia
// por el access_token del owner. Luego redirige al owner a la app.
//
// MercadoPago redirige aquí con: ?code=TG-xxx&state=owner_id
//
// Secrets requeridos:
//   MP_CLIENT_ID, MP_CLIENT_SECRET, APP_URL
//
// Deploy: supabase functions deploy mp-oauth-callback
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_BASE = 'https://api.mercadopago.com'

serve(async (req) => {
  const MP_CLIENT_ID     = Deno.env.get('MP_CLIENT_ID') ?? ''
  const MP_CLIENT_SECRET = Deno.env.get('MP_CLIENT_SECRET') ?? ''
  const SUPABASE_URL     = Deno.env.get('SUPABASE_URL') ?? ''
  const SERVICE_KEY      = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const APP_URL          = Deno.env.get('APP_URL') ?? 'https://elpiqueapp.com'

  const url     = new URL(req.url)
  const code    = url.searchParams.get('code')
  const ownerId = url.searchParams.get('state')
  const error   = url.searchParams.get('error')

  // Si el owner denegó el permiso
  if (error || !code || !ownerId) {
    console.error('MP OAuth error:', error, { code, ownerId })
    return Response.redirect(`${APP_URL}/(owner)/perfil?mp_error=access_denied`, 302)
  }

  const redirectUri = `${SUPABASE_URL}/functions/v1/mp-oauth-callback`

  try {
    // Intercambiar code por access_token
    const tokenRes = await fetch(`${MP_BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: MP_CLIENT_ID,
        client_secret: MP_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenRes.json()

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Token exchange failed:', tokenData)
      return Response.redirect(`${APP_URL}/(owner)/perfil?mp_error=token_failed`, 302)
    }

    const { access_token, refresh_token, user_id } = tokenData

    // Guardar tokens en el perfil del owner
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
    const { error: dbErr } = await supabase
      .from('profiles')
      .update({
        mp_access_token:  access_token,
        mp_refresh_token: refresh_token ?? null,
        mp_user_id:       String(user_id),
        mp_connected_at:  new Date().toISOString(),
      })
      .eq('id', ownerId)

    if (dbErr) {
      console.error('DB error saving MP token:', dbErr)
      return Response.redirect(`${APP_URL}/(owner)/perfil?mp_error=db_error`, 302)
    }

    console.log(`MP conectado para owner ${ownerId}, mp_user_id: ${user_id}`)

    // Redirigir al owner de vuelta a la app con éxito
    return Response.redirect(`${APP_URL}/(owner)/perfil?mp_connected=1`, 302)

  } catch (e: any) {
    console.error('mp-oauth-callback exception:', e)
    return Response.redirect(`${APP_URL}/(owner)/perfil?mp_error=exception`, 302)
  }
})
