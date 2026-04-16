import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

function buildRedirect(path: string, requestUrl: string): URL {
  const url = new URL(requestUrl);
  // En localhost forzar http (Chrome bloquea https://localhost)
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    url.protocol = 'http:';
  }
  return new URL(path, url.origin);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(buildRedirect('/login?error=no_code', request.url));
  }

  const response = NextResponse.redirect(buildRedirect('/owner', request.url));

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
    return NextResponse.redirect(buildRedirect(`/login?error=${encodeURIComponent(error.message)}`, request.url));
  }

  if (data.session) {
    // Determinar destino según rol
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', data.session.user.id)
      .maybeSingle();

    let destination = '/explorar';
    if (profile?.rol === 'propietario' || profile?.rol === 'admin' || profile?.rol === 'superadmin') {
      destination = '/owner';
    }

    const finalResponse = NextResponse.redirect(buildRedirect(destination, request.url));
    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie.name, cookie.value);
    });
    return finalResponse;
  }

  return NextResponse.redirect(buildRedirect('/login', request.url));
}
