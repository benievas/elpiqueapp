import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface Payload {
  tournament_id: string;
  equipo_nombre: string;
  capitan_nombre: string;
  capitan_email: string;
  miembros: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Payload;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: torneo } = await supabaseAdmin
      .from("tournaments")
      .select("nombre, slug, complex_id, cupos_ocupados, cupos_totales")
      .eq("id", body.tournament_id)
      .single();

    if (!torneo) return NextResponse.json({ ok: false, reason: "tournament_not_found" });

    const { data: complejo } = await supabaseAdmin
      .from("complexes")
      .select("nombre, owner_id")
      .eq("id", torneo.complex_id)
      .single();

    if (!complejo) return NextResponse.json({ ok: false, reason: "complex_not_found" });

    const { data: owner } = await supabaseAdmin
      .from("profiles")
      .select("email, nombre_completo")
      .eq("id", complejo.owner_id)
      .single();

    if (!owner?.email) return NextResponse.json({ ok: false, reason: "owner_no_email" });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: true, sent: false, reason: "no_api_key" });
    }

    const miembrosHtml = body.miembros.length > 0
      ? `<ul style="margin:0;padding-left:20px;">${body.miembros.map(m => `<li style="color:#E1D4C2;">${m}</li>`).join("")}</ul>`
      : `<span style="color:rgba(225,212,194,0.5);">Sin miembros especificados</span>`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; background: #1A120B; color: #E1D4C2; padding: 32px; border-radius: 16px;">
        <div style="border-left: 3px solid #C8FF00; padding-left: 16px; margin-bottom: 24px;">
          <p style="color: #C8FF00; font-size: 11px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 0;">Nueva inscripción</p>
          <h1 style="color: white; font-size: 24px; font-weight: 900; margin: 4px 0 0 0;">${torneo.nombre}</h1>
          <p style="color: rgba(225,212,194,0.6); font-size: 13px; margin: 4px 0 0 0;">${complejo.nombre}</p>
        </div>
        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <p style="margin: 0 0 12px 0;"><strong style="color:#C8FF00;">Equipo:</strong> ${body.equipo_nombre}</p>
          <p style="margin: 0 0 12px 0;"><strong style="color:#C8FF00;">Capitán:</strong> ${body.capitan_nombre} (${body.capitan_email})</p>
          <p style="margin: 0 0 8px 0;"><strong style="color:#C8FF00;">Miembros:</strong></p>
          ${miembrosHtml}
          <p style="margin: 16px 0 0 0; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); color: rgba(225,212,194,0.6); font-size: 12px;">
            Cupos: ${torneo.cupos_ocupados}/${torneo.cupos_totales}
          </p>
        </div>
        <a href="https://elpiqueapp.com/owner/torneos/${torneo.slug}" style="display: inline-block; background: #C8FF00; color: #1A120B; font-weight: 900; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin-top: 8px;">Ver torneo</a>
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
        subject: `Nuevo equipo inscrito en ${torneo.nombre}`,
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
    console.error("notify/new-tournament-team error:", e);
    return NextResponse.json({ ok: false, reason: "internal" }, { status: 500 });
  }
}
