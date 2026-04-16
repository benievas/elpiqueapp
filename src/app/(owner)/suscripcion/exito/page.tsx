"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ExitoContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");

  return (
    <div className="max-w-md mx-auto text-center space-y-8 py-12">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="w-24 h-24 rounded-full bg-rodeo-lime/20 border-2 border-rodeo-lime/50 flex items-center justify-center mx-auto"
      >
        <CheckCircle2 size={48} className="text-rodeo-lime" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <h1 className="text-3xl font-black text-white">¡Pago exitoso!</h1>
        <p className="text-rodeo-cream/60">
          Tu licencia {plan === "annual" ? "anual" : "mensual"} fue activada correctamente.
          Ya podés acceder a todas las funciones del panel de gestión.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="liquid-panel p-6 text-left space-y-4"
      >
        <p className="font-bold text-white">¿Qué sigue?</p>
        <ul className="space-y-3 text-sm text-rodeo-cream/70">
          <li className="flex items-start gap-2">
            <span className="text-rodeo-lime mt-0.5">→</span>
            Configurá tu complejo y canchas desde el panel
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rodeo-lime mt-0.5">→</span>
            Compartí tu link único con tus clientes
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rodeo-lime mt-0.5">→</span>
            Configurá la disponibilidad de tus canchas
          </li>
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Link
          href="/owner/complejo"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-[22px] bg-rodeo-lime text-rodeo-dark font-black hover:shadow-[0_8px_32px_rgba(200,255,0,0.4)] transition-all"
        >
          Ir al panel de gestión
          <ArrowRight size={18} />
        </Link>
      </motion.div>
    </div>
  );
}

export default function ExitoPage() {
  return (
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="text-rodeo-lime animate-pulse">Cargando...</div></div>}>
      <ExitoContent />
    </Suspense>
  );
}
