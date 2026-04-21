import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface Payload {
  complex_id: string;
  jugador_nombre: string;
  jugador_email: string;
  cancha_nombre: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  precio_total: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Payload;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: complejo } = await supabaseAdmin
      .from("complexes")
      .select("nombre, slug, owner_id")
      .eq("id", body.complex_id)
      .single();

    if (!complejo) return NextResponse.json({ ok: false, reason: "complex_not_found" });

    const { data: owner } = await supabaseAdmin
      .from("profiles")
      .select("email, nombre_completo, notif_email")
      .eq("id", complejo.owner_id)
      .single();

    if (!owner?.email) return NextResponse.json({ ok: false, reason: "owner_no_email" });
    if (owner.notif_email === false) return NextResponse.json({ ok: true, sent: false, reason: "user_disabled" });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: true, sent: false, reason: "no_api_key" });
    }

    const fechaFmt = new Date(body.fecha + "T12:00:00").toLocaleDateString("es-AR", {
      weekday: "long", day: "numeric", month: "long",
    });

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; background: #1A120B; color: #E1D4C2; padding: 32px; border-radius: 16px;">
        <div style="border-left: 3px solid #C8FF00; padding-left: 16px; margin-bottom: 24px;">
          <p style="color: #C8FF00; font-size: 11px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 0;">Nueva reserva</p>
          <h1 style="color: white; font-size: 24px; font-weight: 900; margin: 4px 0 0 0;">${complejo.nombre}</h1>
        </div>
        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <p style="margin: 0 0 12px 0;"><strong style="color:#C8FF00;">Jugador:</strong> ${body.jugador_nombre} (${body.jugador_email})</p>
          <p style="margin: 0 0 12px 0;"><strong style="color:#C8FF00;">Cancha:</strong> ${body.cancha_nombre}</p>
          <p style="margin: 0 0 12px 0;"><strong style="color:#C8FF00;">Fecha:</strong> ${fechaFmt}</p>
          <p style="margin: 0 0 12px 0;"><strong style="color:#C8FF00;">Horario:</strong> ${body.hora_inicio} — ${body.hora_fin}</p>
          <p style="margin: 0;"><strong style="color:#C8FF00;">Precio:</strong> $${body.precio_total.toLocaleString("es-AR")}</p>
        </div>
        <a href="https://elpiqueapp.com/owner/reservas" style="display: inline-block; background: #C8FF00; color: #1A120B; font-weight: 900; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin-top: 8px;">Ver en el panel</a>
        <p style="color: rgba(225,212,194,0.4); font-size: 11px; margin-top: 24px;">ElPiqueApp — Catamarca</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "ElPiqueApp <noreply@elpiqueapp.com>",
        to: [owner.email],
        subject: `Nueva reserva en ${complejo.nombre} — ${fechaFmt}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return NextResponse.json({ ok: false, reason: "resend_failed", detail: err }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sent: true });
  } catch (e) {
    console.error("notify/new-reservation error:", e);
    return NextResponse.json({ ok: false, reason: "internal" }, { status: 500 });
  }
}
