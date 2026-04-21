import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

  // getUser() valida el token contra Supabase Auth y renueva cookies si es necesario.
  // Esto es crítico para evitar sesiones stale y el flickering de auth en SSR.
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user) {
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (pathname.startsWith('/owner')) {
      return NextResponse.redirect(new URL('/login?from=owner', request.url));
    }
  }

  // HTML no-store para evitar que navegadores/PWAs sirvan bundles viejos.
  // Los assets hasheados (_next/static/*) siguen excluidos por el matcher.
  supabaseResponse.headers.set('Cache-Control', 'no-store, must-revalidate');
  supabaseResponse.headers.set('Pragma', 'no-cache');

  // Siempre devolver supabaseResponse para que los cookies se propaguen
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
