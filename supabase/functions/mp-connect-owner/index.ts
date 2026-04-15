// ============================================================
// Edge Function: mp-connect-owner
// Genera la URL de autorización OAuth de MercadoPago para que
// el owner conecte su cuenta y MatchPro pueda cobrar en su nombre.
//
// Flujo:
//   1. App llama a esta función (autenticado como owner)
//   2. Retorna la URL de autorización MP
//   3. App abre esa URL en WebBrowser
//   4. Owner autoriza → MP redirige a mp-oauth-callback con code + state
//
// Secrets requeridos:
//   MP_CLIENT_ID     → ID de la aplicación MP (del panel de developers)
//   APP_URL          → https://elpiqueapp.com
//
// Deploy: supabase functions deploy mp-connect-owner
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const MP_CLIENT_ID = Deno.env.get('MP_CLIENT_ID')
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
  const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!MP_CLIENT_ID) {
    return Response.json({ error: 'MP_CLIENT_ID no configurado' }, { status: 503, headers: corsHeaders })
  }

  // Obtener el owner autenticado
  const authHeader = req.headers.get('Authorization') ?? ''
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

  if (authErr || !user) {
    return Response.json({ error: 'No autorizado' }, { status: 401, headers: corsHeaders })
  }

  // Verificar que sea owner
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') {
    return Response.json({ error: 'Solo los dueños pueden conectar MercadoPago' }, { status: 403, headers: corsHeaders })
  }

  // URL de callback (Edge Function que maneja el intercambio de token)
  const redirectUri = `${SUPABASE_URL}/functions/v1/mp-oauth-callback`

  // state = owner_id (para identificar al owner cuando MP redirige)
  const state = user.id

  // URL de autorización MP
  const authUrl = new URL('https://auth.mercadopago.com.ar/authorization')
  authUrl.searchParams.set('client_id', MP_CLIENT_ID)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('platform_id', 'mp')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)

  return Response.json(
    { auth_url: authUrl.toString(), redirect_uri: redirectUri },
    { headers: corsHeaders }
  )
})
