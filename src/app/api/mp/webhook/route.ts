import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

// Clientes lazy — se inicializan en runtime, no en build time
function getMPClient() {
  return new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || "",
  });
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const PLAN_DURATIONS: Record<string, number> = {
  monthly: 30,
  annual: 365,
};

function verifyMPSignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // skip if not configured

  const xSignature = req.headers.get("x-signature") || "";
  const xRequestId = req.headers.get("x-request-id") || "";
  const dataId = new URL(req.url).searchParams.get("data.id") || "";

  const tsMatch = xSignature.match(/ts=(\d+)/);
  const v1Match = xSignature.match(/v1=([a-f0-9]+)/);
  if (!tsMatch || !v1Match) return false;

  const ts = tsMatch[1];
  const v1 = v1Match[1];
  const signedContent = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(signedContent).digest("hex");

  return expected === v1;
}

export async function POST(req: NextRequest) {
  const mp = getMPClient();
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const rawBody = await req.text();

    if (!verifyMPSignature(req, rawBody)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const { type, data } = body as { type: string; data: { id: string } };

    if (type !== "payment") {
      return NextResponse.json({ ok: true });
    }

    const paymentClient = new Payment(mp);
    const paymentData = await paymentClient.get({ id: data.id });

    if (!paymentData) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    const externalRef = paymentData.external_reference || "";
    const status = paymentData.status;
    const mpPaymentId = String(paymentData.id);

    // Actualizar registro de pago en BD
    await supabaseAdmin
      .from("payments")
      .update({
        status: status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending",
        mp_payment_id: mpPaymentId,
      })
      .eq("mp_external_ref", externalRef);

    if (status !== "approved") {
      // Si el pago fue rechazado, sincronizar por si la suscripción expiró
      if (status === "rejected" || status === "cancelled") {
        const parts = externalRef.split("_");
        if (parts.length >= 3 && parts[0] === "owner-sub") {
          await supabaseAdmin.rpc("sync_complex_activo", { p_user_id: parts[1] });
        }
      }
      return NextResponse.json({ ok: true });
    }

    // Extraer datos del external reference
    // Formato: owner-sub_<userId>_<plan>_<timestamp>
    const parts = externalRef.split("_");
    if (parts.length < 3 || parts[0] !== "owner-sub") {
      return NextResponse.json({ ok: true });
    }

    const userId = parts[1];
    const plan = parts[2] as "monthly" | "annual";
    const durationDays = PLAN_DURATIONS[plan] || 30;

    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + durationDays);

    // Verificar si ya tiene suscripción activa y extender, o crear nueva
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("id, ends_at, status")
      .eq("user_id", userId)
      .eq("plan", "owner")
      .in("status", ["active", "trial"])
      .single();

    if (existingSub) {
      // Extender la suscripción existente desde cuando vence (o desde ahora si ya venció)
      const currentEnd = existingSub.ends_at ? new Date(existingSub.ends_at) : new Date();
      const baseDate = currentEnd > new Date() ? currentEnd : new Date();
      baseDate.setDate(baseDate.getDate() + durationDays);

      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "active",
          is_trial: false,
          ends_at: baseDate.toISOString(),
          mp_payment_id: mpPaymentId,
          amount: paymentData.transaction_amount || 0,
        })
        .eq("id", existingSub.id);
    } else {
      // Crear nueva suscripción activa
      await supabaseAdmin.from("subscriptions").insert({
        user_id: userId,
        plan: "owner",
        status: "active",
        is_trial: false,
        amount: paymentData.transaction_amount || 0,
        mp_payment_id: mpPaymentId,
        starts_at: new Date().toISOString(),
        ends_at: endsAt.toISOString(),
      });
    }

    // Asegurar que el usuario tiene rol 'propietario' (sin pisar admin/superadmin)
    await supabaseAdmin
      .from("profiles")
      .update({ rol: "propietario" })
      .eq("id", userId)
      .not("rol", "in", '("admin","superadmin")');

    // Sincronizar visibilidad de complejos según suscripción
    await supabaseAdmin.rpc("sync_complex_activo", { p_user_id: userId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook MP error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// MP también puede enviar GET para verificar el endpoint
export async function GET() {
  return NextResponse.json({ ok: true });
}
