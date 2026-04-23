import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user }, error: userErr } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // Bypass RLS for profiles and subscriptions using service_role
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Fetch trial/subscription status
  const { data: subscription } = await admin
    .from("subscriptions")
    .select("status, is_trial, starts_at, ends_at")
    .eq("user_id", user.id)
    .eq("plan", "owner")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Force superadmin for the master account in case the UUID changed or RLS botched
  if (user.email?.toLowerCase() === 'contactomatchpro@gmail.com') {
    if (!profile) {
      profile = { id: user.id, email: user.email, rol: 'superadmin' };
    } else {
      profile.rol = 'superadmin';
    }
  }

  return NextResponse.json({
    authenticated: true,
    user,
    profile,
    subscription: subscription || null
  });
}
