import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function buildRedirect(path: string, requestUrl: string, headers?: Headers): URL {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return new URL(path, process.env.NEXT_PUBLIC_SITE_URL);
  }
  const forwardedHost = headers?.get('x-forwarded-host');
  const forwardedProto = headers?.get('x-forwarded-proto') ?? 'https';
  if (forwardedHost) {
    return new URL(path, `${forwardedProto}://${forwardedHost}`);
  }
  const url = new URL(requestUrl);
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    url.protocol = 'http:';
  }
  return new URL(path, url.origin);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const fromOwner = searchParams.get('from') === 'owner';

  const h = request.headers;

  if (!code) {
    return NextResponse.redirect(buildRedirect('/login?error=no_code', request.url, h));
  }

  const response = NextResponse.redirect(buildRedirect('/explorar', request.url, h));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          const cookieHeader = request.headers.get('cookie') ?? '';
          if (!cookieHeader) return [];
          return cookieHeader.split(';').map((c) => {
            const eqIdx = c.indexOf('=');
            if (eqIdx === -1) return null;
            return { name: c.slice(0, eqIdx).trim(), value: c.slice(eqIdx + 1).trim() };
          }).filter(Boolean) as { name: string; value: string }[];
        },
        setAll: (cookiesToSet: Array<{ name: string; value: string; [key: string]: unknown }>) => {
          cookiesToSet.forEach(({ name, value, ...options }) => {
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth callback error:', error.message);
    return NextResponse.redirect(buildRedirect(`/login?error=${encodeURIComponent(error.message)}`, request.url, h));
  }

  if (data.session) {
    const userId = data.session.user.id;
    const userEmail = data.session.user.email ?? '';
    const userMeta = data.session.user.user_metadata ?? {};

    // Buscar perfil
    let { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', userId)
      .maybeSingle();

    const isNewProfile = !profile;

    const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL ?? 'contactomatchpro@gmail.com';

    // Si no tiene perfil (Google OAuth, o email confirmado sin perfil previo), crearlo
    if (!profile) {
      // El email superadmin siempre obtiene rol correcto, sin importar userMeta
      const rol = userEmail === SUPERADMIN_EMAIL
        ? 'superadmin'
        : ((userMeta.rol as string) ?? 'jugador');
      const nombre = (userMeta.nombre_completo as string)
        ?? (userMeta.full_name as string)
        ?? (userMeta.name as string)
        ?? null;

      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      await admin.from('profiles').upsert({
        id: userId,
        email: userEmail,
        nombre_completo: nombre,
        rol,
        ciudad: 'Catamarca',
      }, { onConflict: 'id' });

      profile = { rol };
    }

    // Si el perfil existente es del superadmin pero tiene rol incorrecto, corregirlo
    if (userEmail === SUPERADMIN_EMAIL && profile.rol !== 'superadmin') {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      await admin.from('profiles').update({ rol: 'superadmin' }).eq('id', userId);
      profile = { rol: 'superadmin' };
    }

    let destination = isNewProfile ? '/onboarding/jugador' : '/explorar';
    if (profile?.rol === 'superadmin' || profile?.rol === 'admin') {
      destination = '/admin';
    } else if (profile?.rol === 'propietario') {
      destination = '/owner';
    }
    // Usuario nuevo que intentaba entrar como dueño → registro de dueño
    if (isNewProfile && fromOwner && profile?.rol === 'jugador') {
      destination = '/registro/dueno';
    }

    const finalResponse = NextResponse.redirect(buildRedirect(destination, request.url, h));
    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie.name, cookie.value);
    });
    return finalResponse;
  }

  return NextResponse.redirect(buildRedirect('/login', request.url, h));
}
