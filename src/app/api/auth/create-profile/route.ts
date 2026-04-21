import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

// Endpoint interno: crea o actualiza el perfil usando service role (bypasea RLS)
export async function POST(request: NextRequest) {
  const rl = rateLimit(`create-profile:${getClientIp(request)}`, { limit: 5, windowSecs: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }
  try {
    const body = await request.json();
    const { userId, nombre_completo, telefono, ciudad, rol } = body;

    if (!userId || !rol) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      rol,
      nombre_completo: nombre_completo || null,
      telefono: telefono || null,
      ciudad: ciudad || "Catamarca",
      email: body.email || null,
    }, { onConflict: "id" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
