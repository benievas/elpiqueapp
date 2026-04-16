"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Zap,
  Star,
  Crown,
  AlertCircle,
  Loader,
  Calendar,
  Building2,
  Shield,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const FEATURES = [
  "Panel de gestión completo",
  "Configuración de canchas y horarios",
  "Sistema de disponibilidad en tiempo real",
  "Generación de link y QR para compartir",
  "Publicaciones y promociones",
  "Gestión de torneos",
  "Estadísticas y reportes",
  "Soporte prioritario",
];

type SubscriptionStatus = {
  status: "active" | "trial" | "expired" | "none";
  endsAt: string | null;
  isTriial: boolean;
  daysLeft: number;
};

export default function SuscripcionPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const errorParam = searchParams.get("error");
    if (errorParam === "pago_fallido") {
      setError("El pago no pudo procesarse. Por favor, intentá de nuevo.");
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadSubscription();
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;
    setLoadingSub(true);
    try {
      const { data } = await supabase
        .from("subscriptions" as never)
        .select("status, ends_at, is_trial")
        .eq("user_id", user.id)
        .eq("plan", "owner")
        .in("status", ["active", "trial"])
        .single() as { data: { status: string; ends_at: string | null; is_trial: boolean } | null };

      if (data) {
        const endsAt = data.ends_at ? new Date(data.ends_at) : null;
        const daysLeft = endsAt
          ? Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : 0;

        setSubscription({
          status: data.status as "active" | "trial",
          endsAt: data.ends_at,
          isTriial: data.is_trial,
          daysLeft,
        });
      } else {
        setSubscription({ status: "none", endsAt: null, isTriial: false, daysLeft: 0 });
      }
    } catch {
      setSubscription({ status: "none", endsAt: null, isTriial: false, daysLeft: 0 });
    } finally {
      setLoadingSub(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/mp/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          userId: user.id,
          userEmail: user.email,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Error al iniciar el pago");
      }

      // Redirigir al checkout de MercadoPago
      const url = process.env.NODE_ENV === "production"
        ? data.initPoint
        : (data.sandboxInitPoint || data.initPoint);

      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el pago");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingSub) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size={32} className="animate-spin text-rodeo-lime" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rodeo-lime/10 border border-rodeo-lime/20 text-rodeo-lime text-sm font-bold mb-2">
          <Crown size={16} />
          LICENCIA ELPIQUEAPP
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white">
          Gestioná tu complejo con todo incluido
        </h1>
        <p className="text-rodeo-cream/60 max-w-xl mx-auto">
          Una licencia por complejo. Acceso completo a todas las funciones del panel de gestión.
        </p>
      </motion.div>

      {/* Estado de suscripción actual */}
      {subscription && subscription.status !== "none" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`liquid-panel p-6 flex items-start gap-4 ${
            subscription.status === "trial"
              ? "border-yellow-400/30"
              : "border-rodeo-lime/30"
          }`}
        >
          <div className={`p-3 rounded-xl ${
            subscription.status === "trial"
              ? "bg-yellow-400/20 text-yellow-400"
              : "bg-rodeo-lime/20 text-rodeo-lime"
          }`}>
            {subscription.status === "trial" ? <Star size={24} /> : <CheckCircle2 size={24} />}
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-lg">
              {subscription.status === "trial" ? "Período de prueba activo" : "Licencia activa"}
            </p>
            <p className="text-rodeo-cream/60 text-sm mt-1">
              {subscription.daysLeft > 0
                ? `Te quedan ${subscription.daysLeft} días${subscription.status === "trial" ? " de prueba gratuita" : ""}`
                : "Tu período venció hoy"}
              {subscription.endsAt && (
                <span className="ml-2 text-rodeo-cream/40">
                  — vence el {new Date(subscription.endsAt).toLocaleDateString("es-AR")}
                </span>
              )}
            </p>
          </div>
          {subscription.status === "trial" && (
            <div className="flex items-center gap-2 text-xs bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 px-3 py-1 rounded-full">
              <Calendar size={12} />
              TRIAL GRATIS
            </div>
          )}
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-red-500/20 border border-red-500/30 rounded-[20px] text-red-300 flex items-center gap-3"
        >
          <AlertCircle size={18} />
          {error}
        </motion.div>
      )}

      {/* Selector de plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-2 gap-6"
      >
        {/* Plan Mensual */}
        <button
          onClick={() => setSelectedPlan("monthly")}
          className={`liquid-panel p-6 text-left transition-all ${
            selectedPlan === "monthly"
              ? "border-rodeo-lime/50 shadow-[0_0_30px_rgba(200,255,0,0.1)]"
              : "opacity-70 hover:opacity-90"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-white/10">
              <Zap size={20} className="text-white" />
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selectedPlan === "monthly"
                ? "border-rodeo-lime bg-rodeo-lime"
                : "border-white/20"
            }`}>
              {selectedPlan === "monthly" && (
                <div className="w-2 h-2 rounded-full bg-rodeo-dark" />
              )}
            </div>
          </div>
          <p className="text-rodeo-cream/50 text-sm mb-1">MENSUAL</p>
          <p className="text-3xl font-black text-white mb-1">
            $60.000
            <span className="text-base font-normal text-rodeo-cream/50">/mes</span>
          </p>
          <p className="text-rodeo-cream/60 text-sm">Renovación mensual automática</p>
        </button>

        {/* Plan Anual */}
        <button
          onClick={() => setSelectedPlan("annual")}
          className={`liquid-panel p-6 text-left transition-all relative overflow-hidden ${
            selectedPlan === "annual"
              ? "border-rodeo-lime/50 shadow-[0_0_30px_rgba(200,255,0,0.15)]"
              : "opacity-70 hover:opacity-90"
          }`}
        >
          {/* Badge "mejor valor" */}
          <div className="absolute top-4 right-4 bg-rodeo-lime text-rodeo-dark text-xs font-black px-3 py-1 rounded-full">
            MEJOR VALOR
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-rodeo-lime/20">
              <Crown size={20} className="text-rodeo-lime" />
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selectedPlan === "annual"
                ? "border-rodeo-lime bg-rodeo-lime"
                : "border-white/20"
            }`}>
              {selectedPlan === "annual" && (
                <div className="w-2 h-2 rounded-full bg-rodeo-dark" />
              )}
            </div>
          </div>
          <p className="text-rodeo-lime text-sm font-bold mb-1">ANUAL</p>
          <p className="text-3xl font-black text-white mb-1">
            $600.000
            <span className="text-base font-normal text-rodeo-cream/50">/año</span>
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-rodeo-lime text-sm font-bold">2 meses de regalo</span>
            <span className="text-rodeo-cream/40 text-xs line-through">$720.000</span>
          </div>
          <p className="text-rodeo-cream/50 text-xs mt-1">Equivale a $50.000/mes</p>
        </button>
      </motion.div>

      {/* Funciones incluidas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="liquid-panel p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <Shield size={20} className="text-rodeo-lime" />
          <h3 className="font-bold text-white">Todo incluido en la licencia</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-3 text-sm text-rodeo-cream/80">
              <CheckCircle2 size={16} className="text-rodeo-lime flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Nota de 1 mes gratis */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="flex items-start gap-3 px-4 py-3 bg-rodeo-lime/5 border border-rodeo-lime/20 rounded-[16px]"
      >
        <Star size={18} className="text-rodeo-lime mt-0.5 flex-shrink-0" />
        <p className="text-sm text-rodeo-cream/70">
          <span className="text-white font-bold">1 mes de prueba gratuito</span> al registrar
          tu complejo. Sin tarjeta de crédito necesaria para empezar.
        </p>
      </motion.div>

      {/* Nota por complejo */}
      <div className="flex items-start gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-[16px]">
        <Building2 size={18} className="text-rodeo-cream/40 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-rodeo-cream/50">
          Cada complejo requiere su propia licencia. Si tenés varios complejos,
          cada uno se gestiona de forma independiente con su propio acceso y suscripción.
        </p>
      </div>

      {/* Botón de pago */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          onClick={handleCheckout}
          disabled={loading}
          whileHover={!loading ? { scale: 1.02, y: -2 } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
          className="w-full py-5 rounded-[22px] bg-rodeo-lime text-rodeo-dark font-black text-lg
            flex items-center justify-center gap-3 transition-all
            hover:shadow-[0_8px_32px_rgba(200,255,0,0.4)]
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader size={22} className="animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Zap size={22} />
              {subscription?.status === "active"
                ? "Renovar licencia"
                : subscription?.status === "trial"
                ? "Activar licencia completa"
                : "Comenzar con 1 mes gratis"}
              {" — "}
              {selectedPlan === "monthly" ? "$60.000/mes" : "$600.000/año"}
            </>
          )}
        </motion.button>
        <p className="text-center text-xs text-rodeo-cream/40 mt-3">
          Pago seguro procesado por MercadoPago. Cancelá cuando quieras.
        </p>
      </motion.div>
    </div>
  );
}
