import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : new URL(request.url).origin;
  const response = NextResponse.redirect(new URL("/login", origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies: Array<{ name: string; value: string; [key: string]: unknown }>) =>
          cookies.forEach(({ name, value, ...opts }) =>
            response.cookies.set(name, value, opts as Parameters<typeof response.cookies.set>[2])
          ),
      },
    }
  );

  await supabase.auth.signOut();
  return response;
}
