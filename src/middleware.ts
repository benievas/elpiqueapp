import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// Rutas públicas
const PUBLIC_ROUTES = [
  '/',
  '/explorar',
  '/mapa',
  '/login',
  '/complejo',
  '/auth/callback',
  '/torneos',
  '/feed',
  '/privacidad',
  '/terminos',
];

// Rutas protegidas por rol
const ROLE_ROUTES = {
  owner: ['/owner'],
  admin: ['/admin'],
  superadmin: ['/admin'],
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Las rutas públicas no necesitan middleware
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Obtener sesión de las cookies
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookies = parseCookieHeader(cookieHeader);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          Object.entries(cookies).map(([name, value]) => ({ name, value })),
        setAll: () => {
          // Las cookies se setean en la response
        },
      },
    }
  );

  try {
    // Obtener sesión del usuario
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      // No autenticado - redirigir a login
      if (pathname.startsWith('/owner') || pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return NextResponse.next();
    }

    // Usuario autenticado - verificar rol si es necesario
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Obtener rol del usuario desde profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (pathname.startsWith('/admin')) {
      // Solo admin y superadmin
      if (!profile || !['admin', 'superadmin'].includes(profile.rol)) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    if (pathname.startsWith('/owner')) {
      // Solo owner, admin y superadmin
      if (!profile || !['propietario', 'admin', 'superadmin'].includes(profile.rol)) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // En caso de error, permitir el acceso (fallback)
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
