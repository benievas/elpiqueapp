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
  const { data: { user } } = await supabaseAdmin.auth.getUser(auth.slice(7));
  if (!user) return null;
  const { data: p } = await supabaseAdmin.from("profiles").select("rol").eq("id", user.id).maybeSingle();
  return p?.rol === "admin" ? user : null;
}

export async function GET(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");

  let q = supabaseAdmin
    .from("reservations")
    .select("id, fecha, hora_inicio, hora_fin, estado, precio_total, notas, user_id, court_id, complex_id, profiles!user_id(nombre_completo, email), courts!court_id(nombre), complexes!complex_id(nombre)")
    .order("fecha", { ascending: false })
    .order("hora_inicio", { ascending: false })
    .limit(200);

  if (days > 0) {
    const desde = new Date(); desde.setDate(desde.getDate() - days);
    q = q.gte("fecha", desde.toISOString().split("T")[0]);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data || []);
}

export async function PATCH(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, estado } = await req.json();
  const { error } = await supabaseAdmin.from("reservations").update({ estado }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
