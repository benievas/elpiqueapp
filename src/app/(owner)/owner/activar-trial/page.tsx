"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Rocket, CheckCircle2, Loader, Crown, Calendar, Shield, Zap } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabaseMut } from "@/lib/supabase";

const INCLUIDO = [
  "Panel de gestión completo",
  "Canchas y horarios ilimitados",
  "Disponibilidad en tiempo real",
  "Link y QR propio del complejo",
  "Feed de publicaciones y promos",
  "Torneos y estadísticas",
];

export default function ActivarTrialPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivar = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error: insertError } = await supabaseMut.from("subscriptions").insert({
        user_id: user.id,
        plan: "owner",
        status: "trial",
        is_trial: true,
        starts_at: now,
        ends_at: trialEnd,
        created_at: now,
      });

      if (insertError) throw insertError;

      router.push("/onboarding/dueno");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al activar el trial");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Badge */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-rodeo-lime/10 border border-rodeo-lime/25 text-rodeo-lime text-sm font-black">
            <Rocket size={16} />
            30 DÍAS GRATIS
          </div>
        </div>

        {/* Card principal */}
        <div className="liquid-panel p-8 space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white">¡Bienvenido a ElPiqueApp!</h1>
            <p className="text-rodeo-cream/60 text-sm leading-relaxed">
              Probá todas las funciones gratis durante 30 días. Sin compromisos.
              Al vencer, elegís si querés continuar con un plan pago.
            </p>
          </div>

          {/* Timeline visual */}
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-rodeo-lime/20 border-2 border-rodeo-lime flex items-center justify-center">
                <Rocket size={16} className="text-rodeo-lime" />
              </div>
              <span className="text-[10px] text-rodeo-lime font-bold">HOY</span>
            </div>
            <div className="flex-1 h-0.5 bg-gradient-to-r from-rodeo-lime/50 to-yellow-400/50 mx-1" />
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-yellow-400/20 border-2 border-yellow-400/50 flex items-center justify-center">
                <Calendar size={16} className="text-yellow-400" />
              </div>
              <span className="text-[10px] text-yellow-400 font-bold">DÍA 30</span>
            </div>
            <div className="flex-1 h-0.5 bg-gradient-to-r from-yellow-400/30 to-white/10 mx-1" />
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
                <Crown size={16} className="text-white/50" />
              </div>
              <span className="text-[10px] text-white/40 font-bold">PLAN</span>
            </div>
          </div>

          {/* Lo que incluye */}
          <div className="space-y-2.5 text-left">
            {INCLUIDO.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 size={15} className="text-rodeo-lime shrink-0" />
                <span className="text-sm text-rodeo-cream/80">{item}</span>
              </div>
            ))}
          </div>

          {/* Aviso prórroga */}
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-[12px] bg-white/5 border border-white/8 text-left">
            <Shield size={14} className="text-rodeo-cream/40 shrink-0 mt-0.5" />
            <p className="text-xs text-rodeo-cream/50 leading-relaxed">
              Al vencer los 30 días tenés <span className="text-white font-bold">2 días de prórroga</span> para elegir un plan sin perder acceso a tu datos.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-[12px] text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* CTA */}
          <motion.button
            onClick={handleActivar}
            disabled={loading}
            whileHover={!loading ? { scale: 1.02, y: -2 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
            className="w-full py-4 rounded-[16px] bg-rodeo-lime text-rodeo-dark font-black text-base
              flex items-center justify-center gap-3 transition-all
              hover:shadow-[0_8px_32px_rgba(200,255,0,0.35)]
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <>
                <Zap size={20} />
                Activar 30 días gratis
              </>
            )}
          </motion.button>

          <p className="text-xs text-rodeo-cream/30">
            Sin tarjeta de crédito · Solo pagás si decidís continuar
          </p>
        </div>
      </motion.div>
    </div>
  );
}
