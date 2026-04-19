"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, Loader } from "lucide-react";

function ConfirmarContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="liquid-panel p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-rodeo-lime/15 border border-rodeo-lime/30 flex items-center justify-center mx-auto">
            <Mail size={28} className="text-rodeo-lime" />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "32px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }} className="text-white mb-2">Confirmá tu email</h1>
            <p className="text-rodeo-cream/60 text-sm leading-relaxed">
              Te enviamos un link de confirmación a{" "}
              <span className="text-white font-bold">{email}</span>.
              Hacé click en el link para activar tu cuenta y empezar tu prueba gratis.
            </p>
          </div>
          <div className="space-y-2.5 text-left">
            {["Revisá tu bandeja de entrada", "Si no lo ves, revisá Spam", "El link expira en 24 horas"].map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <CheckCircle2 size={14} className="text-rodeo-lime shrink-0" />
                <span className="text-sm text-rodeo-cream/60">{item}</span>
              </div>
            ))}
          </div>
          <Link href="/login" className="inline-block text-sm text-rodeo-lime font-bold hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function ConfirmarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-rodeo-dark flex items-center justify-center"><Loader size={28} className="animate-spin text-rodeo-lime" /></div>}>
      <ConfirmarContent />
    </Suspense>
  );
}
