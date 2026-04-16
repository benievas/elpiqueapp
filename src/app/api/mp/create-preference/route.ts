import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
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

const PLANS = {
  monthly: {
    title: "Licencia ElPiqueApp — Mensual",
    unit_price: 60000,
    description: "Acceso completo al panel de gestión por 30 días",
  },
  annual: {
    title: "Licencia ElPiqueApp — Anual",
    unit_price: 600000,
    description: "Acceso completo al panel de gestión por 12 meses (2 meses de regalo)",
  },
};

export async function POST(req: NextRequest) {
  const mp = getMPClient();
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const body = await req.json();
    const { plan, userId, userEmail, complexId } = body as {
      plan: "monthly" | "annual";
      userId: string;
      userEmail: string;
      complexId?: string;
    };

    if (!plan || !userId || !userEmail) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 });
    }

    if (!PLANS[plan]) {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }

    const planData = PLANS[plan];
    const externalRef = `owner-sub_${userId}_${plan}_${Date.now()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://elpiqueapp.com";

    // Crear registro de pago pendiente en Supabase
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,
        type: "owner_sub",
        amount: planData.unit_price,
        status: "pending",
        mp_external_ref: externalRef,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error creando registro de pago:", paymentError);
    }

    const preference = new Preference(mp);
    const result = await preference.create({
      body: {
        items: [
          {
            id: plan,
            title: planData.title,
            description: planData.description,
            quantity: 1,
            unit_price: planData.unit_price,
            currency_id: "ARS",
          },
        ],
        payer: {
          email: userEmail,
        },
        back_urls: {
          success: `${appUrl}/owner/suscripcion/exito?plan=${plan}`,
          failure: `${appUrl}/owner/suscripcion?error=pago_fallido`,
          pending: `${appUrl}/owner/suscripcion/pendiente`,
        },
        auto_return: "approved",
        external_reference: externalRef,
        metadata: {
          userId,
          plan,
          complexId: complexId || null,
        },
        notification_url: `${appUrl}/api/mp/webhook`,
        statement_descriptor: "ELPIQUEAPP",
      },
    });

    // Actualizar el pago con el preference_id de MP
    if (payment && result.id) {
      await supabaseAdmin
        .from("payments")
        .update({ mp_preference_id: result.id })
        .eq("id", payment.id);
    }

    return NextResponse.json({
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
    });
  } catch (error) {
    console.error("Error creando preferencia MP:", error);
    return NextResponse.json(
      { error: "Error al procesar el pago" },
      { status: 500 }
    );
  }
}
