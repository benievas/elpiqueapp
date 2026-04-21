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

  // getSession() renueva el token si expiró y actualiza las cookies.
  // No hace network call cuando el token es válido → más rápido y estable que getUser().
  // La validación JWT real se hace en las API routes que necesitan seguridad estricta.
  const { data: { session } } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  if (!session) {
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (pathname.startsWith('/owner')) {
      return NextResponse.redirect(new URL('/login?from=owner', request.url));
    }
  }

  supabaseResponse.headers.set('Cache-Control', 'no-store, must-revalidate');
  supabaseResponse.headers.set('Pragma', 'no-cache');

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
