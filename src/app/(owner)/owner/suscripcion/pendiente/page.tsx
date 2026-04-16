"use client";

import { motion } from "framer-motion";
import { Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PendientePage() {
  return (
    <div className="max-w-md mx-auto text-center space-y-8 py-12">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="w-24 h-24 rounded-full bg-yellow-400/20 border-2 border-yellow-400/50 flex items-center justify-center mx-auto"
      >
        <Clock size={48} className="text-yellow-400" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <h1 className="text-3xl font-black text-white">Pago en proceso</h1>
        <p className="text-rodeo-cream/60">
          Tu pago está siendo procesado. Una vez confirmado, tu licencia se activará
          automáticamente. Esto puede tomar unos minutos.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Link
          href="/owner/suscripcion"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-[18px] border border-white/20 bg-white/5 text-rodeo-cream font-bold hover:bg-white/10 transition-all"
        >
          <ArrowLeft size={16} />
          Volver a suscripciones
        </Link>
      </motion.div>
    </div>
  );
}
