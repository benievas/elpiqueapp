import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Si faltan las env vars, dejar pasar sin auth check
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
  });

  try {
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
  } catch {
    // Si Supabase falla, dejar pasar (la página maneja su propio auth)
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
