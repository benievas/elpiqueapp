import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

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

export async function POST(req: NextRequest) {
  const mp = getMPClient();
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const body = await req.json();
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
    // NOTE: schema check — sql/sprint7_suscripciones.sql usa `role`/'owner',
    // pero UI usa `rol`/'propietario'. Aquí seguimos la convención de UI.
    await supabaseAdmin
      .from("profiles")
      .update({ rol: "propietario" })
      .eq("id", userId)
      .not("rol", "in", '("admin","superadmin")');

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
