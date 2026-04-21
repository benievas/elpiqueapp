import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  // 1. Rate limit por IP
  const ip = getClientIp(request);
  const rl = rateLimit(`ai-summary:${ip}`, { limit: 3, windowSecs: 120 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  // 2. Requiere sesión de Supabase válida
  const supabaseResponse = NextResponse.next({ request });
  const supabaseClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies: Array<{ name: string; value: string; [key: string]: unknown }>) =>
          cookies.forEach(({ name, value, ...opts }) =>
            supabaseResponse.cookies.set(name, value, opts as Parameters<typeof supabaseResponse.cookies.set>[2])
          ),
      },
    }
  );

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 3. Validar body
  const body = await request.json().catch(() => null);
  const complexId: string | undefined = body?.complex_id;
  if (!complexId || typeof complexId !== "string" || complexId.length > 40) {
    return NextResponse.json({ error: "Parámetro inválido" }, { status: 400 });
  }

  // 4. Fetch de reseñas con service role (sin exponer datos al cliente)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: reviews, error: dbErr } = await admin
    .from("reviews")
    .select("estrellas, texto")
    .eq("complex_id", complexId)
    .not("texto", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (dbErr) return NextResponse.json({ error: "Error interno" }, { status: 500 });
  if (!reviews || reviews.length < 5) {
    return NextResponse.json({ ok: true, resumen: null, razon: "insufficient_reviews" });
  }

  // 5. Llamada a Claude — sin datos de usuarios, solo texto de reseñas
  const textos = reviews
    .map((r) => `[${r.estrellas}★] ${r.texto}`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `Sos un asistente de ElPiqueApp, app de reservas de canchas deportivas en Argentina. Leé estas reseñas de jugadores y escribí UN párrafo corto (máximo 2 oraciones) en español argentino, objetivo y positivo, que resuma la experiencia general. No menciones nombres ni datos personales. Solo devolvé el párrafo, sin introducción.\n\nReseñas:\n${textos}`,
    }],
  });

  const resumen = message.content[0].type === "text" ? message.content[0].text.trim() : null;
  if (!resumen) return NextResponse.json({ error: "Error al generar resumen" }, { status: 500 });

  // 6. Guardar en DB
  await admin
    .from("complexes")
    .update({
      ai_resumen: resumen,
      ai_resumen_updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq("id", complexId);

  // 7. Solo devolver el resumen — nunca datos de usuarios ni reseñas crudas
  return NextResponse.json({ ok: true, resumen });
}
