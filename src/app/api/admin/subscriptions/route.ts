import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function verifyAdmin(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await supabaseAdmin
    .from("profiles").select("rol").eq("id", user.id).maybeSingle();
  return profile?.rol === "admin" ? user : null;
}

export async function GET(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id, user_id, status, starts_at, ends_at, plan, is_trial, created_at, profiles!user_id(email, nombre_completo)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const userIds = (data || []).map((s: any) => s.user_id);
  let compMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: comps } = await supabaseAdmin
      .from("complexes").select("owner_id, nombre").in("owner_id", userIds);
    (comps || []).forEach((c: any) => { compMap[c.owner_id] = c.nombre; });
  }

  const rows = (data || []).map((s: any) => ({
    ...s,
    owner_email: Array.isArray(s.profiles) ? s.profiles[0]?.email : s.profiles?.email,
    owner_nombre: Array.isArray(s.profiles) ? s.profiles[0]?.nombre_completo : s.profiles?.nombre_completo,
    complejo_nombre: compMap[s.user_id] ?? null,
  }));

  return NextResponse.json(rows);
}

export async function PATCH(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, ...updates } = await req.json();
  const { error } = await supabaseAdmin
    .from("subscriptions").update(updates).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
