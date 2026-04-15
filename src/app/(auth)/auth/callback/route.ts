import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const cookieHeader = request.headers.get('cookie') ?? '';
    const cookies = parseCookieHeader(cookieHeader);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value })),
          setAll: (cookiesToSet: Array<{ name: string; value: string }>) => {
            // Las cookies se setean en la response
          },
        },
      }
    );

    // Intercambiar código por sesión
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth error:', error);
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
    }

    if (data.session) {
      const response = NextResponse.redirect(new URL('/', request.url));
      return response;
    }
  }

  return NextResponse.redirect(new URL('/login', request.url));
}
