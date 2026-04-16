import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    // Crear la response destino primero para poder setear cookies en ella
    const response = NextResponse.redirect(new URL(next, request.url));

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
              return {
                name: c.slice(0, eqIdx).trim(),
                value: c.slice(eqIdx + 1).trim(),
              };
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
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
    }

    if (data.session) {
      // Redirigir según el rol del usuario
      const { data: profile } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', data.session.user.id)
        .single();

      let destination = '/explorar';
      if (profile?.rol === 'propietario') destination = '/mi-negocio';
      else if (profile?.rol === 'admin' || profile?.rol === 'superadmin') destination = '/admin';

      const finalResponse = NextResponse.redirect(new URL(destination, request.url));
      // Copiar las cookies seteadas
      response.cookies.getAll().forEach((cookie) => {
        finalResponse.cookies.set(cookie.name, cookie.value);
      });
      return finalResponse;
    }
  }

  return NextResponse.redirect(new URL('/login?error=no_code', request.url));
}
