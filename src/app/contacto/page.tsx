"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Send, CheckCircle2, MessageSquare, Bug, Lightbulb, Loader } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";

const TIPOS = [
  { id: "sugerencia", label: "Sugerencia", icon: Lightbulb, color: "#C8FF00" },
  { id: "problema",   label: "Reportar problema", icon: Bug, color: "#FF4444" },
  { id: "consulta",   label: "Consulta general",  icon: MessageSquare, color: "#00E5FF" },
];

export default function ContactoPage() {
  const { profile } = useAuth();
  const [tipo, setTipo] = useState("sugerencia");
  const [mensaje, setMensaje] = useState("");
  const [nombre, setNombre] = useState(profile?.nombre_completo || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const tipoActual = TIPOS.find(t => t.id === tipo)!;

  const handleEnviar = async () => {
    if (!mensaje.trim()) return;
    setLoading(true);
    // Pequeño delay para UX
    await new Promise(r => setTimeout(r, 600));
    // Abrir mailto con los datos
    const asunto = encodeURIComponent(`[ElPiqueApp] ${tipoActual.label}: ${mensaje.slice(0, 60)}`);
    const cuerpo = encodeURIComponent(
      `Tipo: ${tipoActual.label}\nNombre: ${nombre || "Anónimo"}\nEmail: ${email || "No informado"}\n\n${mensaje}`
    );
    window.location.href = `mailto:contactomatchpro@gmail.com?subject=${asunto}&body=${cuerpo}`;
    setLoading(false);
    setEnviado(true);
  };

  return (
    <div className="relative min-h-screen bg-rodeo-dark text-rodeo-cream font-sans overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-rodeo-dark via-rodeo-brown to-rodeo-dark" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-rodeo-lime/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen pb-24">
        <header className="sticky top-0 z-30 px-5 py-4 flex items-center justify-between bg-rodeo-dark/60 backdrop-blur-md border-b border-white/5">
          <Link href="/" className="w-10 h-10 rounded-full border border-white/20 bg-white/8 hover:bg-white/15 flex items-center justify-center transition-all">
            <ChevronLeft className="text-rodeo-cream" size={20} />
          </Link>
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "22px", letterSpacing: "-0.01em", textTransform: "uppercase", lineHeight: 1 }} className="text-rodeo-cream">
            <span className="section-slash">/</span>Contacto
          </h1>
          <div className="w-10" />
        </header>

        <div className="px-5 pt-6 max-w-xl mx-auto">
          {enviado ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-rodeo-lime/15 border border-rodeo-lime/30 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} className="text-rodeo-lime" />
              </div>
              <p className="text-2xl font-black text-white">¡Gracias!</p>
              <p className="text-rodeo-cream/60 text-sm max-w-xs mx-auto">
                Tu mensaje fue enviado a nuestro equipo. Te respondemos a la brevedad.
              </p>
              <div className="flex flex-col gap-2 pt-4">
                <button onClick={() => { setEnviado(false); setMensaje(""); }}
                  style={{ background: "rgba(200,255,0,0.15)", border: "1px solid rgba(200,255,0,0.3)", borderRadius: "12px" }}
                  className="px-6 py-2.5 text-sm font-bold text-rodeo-lime">
                  Enviar otro mensaje
                </button>
                <Link href="/"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  className="px-6 py-2.5 text-sm font-bold text-rodeo-cream/60 text-center">
                  Volver al inicio
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div>
                <p className="text-xs text-rodeo-cream/40 mb-1">¿Tenés una sugerencia o encontraste un problema?</p>
                <p className="text-rodeo-cream/60 text-sm">Escribinos y lo revisamos. Tu feedback nos ayuda a mejorar ElPiqueApp.</p>
              </div>

              {/* Tipo */}
              <div className="grid grid-cols-3 gap-2">
                {TIPOS.map(t => (
                  <button key={t.id} onClick={() => setTipo(t.id)}
                    className="p-3 rounded-[12px] text-center transition-all flex flex-col items-center gap-1.5"
                    style={{
                      background: tipo === t.id ? `${t.color}15` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${tipo === t.id ? `${t.color}50` : "rgba(255,255,255,0.08)"}`,
                    }}>
                    <t.icon size={16} style={{ color: tipo === t.id ? t.color : "rgba(225,212,194,0.4)" }} />
                    <span className="text-[11px] font-bold" style={{ color: tipo === t.id ? t.color : "rgba(225,212,194,0.5)" }}>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Nombre y email */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-rodeo-cream/40">Tu nombre</label>
                  <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Opcional"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#E1D4C2", outline: "none" }}
                    className="w-full px-3 py-2.5 text-sm placeholder:text-rodeo-cream/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-rodeo-cream/40">Tu email</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Para responderte" type="email"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#E1D4C2", outline: "none" }}
                    className="w-full px-3 py-2.5 text-sm placeholder:text-rodeo-cream/20" />
                </div>
              </div>

              {/* Mensaje */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-rodeo-cream/40">Mensaje *</label>
                <textarea value={mensaje} onChange={e => setMensaje(e.target.value)}
                  placeholder={tipo === "problema" ? "Describí el problema que encontraste, en qué pantalla ocurrió y qué esperabas que pasara..." : "Contanos tu sugerencia o consulta..."}
                  rows={5} maxLength={1000}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#E1D4C2", outline: "none", resize: "none" }}
                  className="w-full px-4 py-3 text-sm placeholder:text-rodeo-cream/20" />
                <p className="text-[10px] text-rodeo-cream/25 text-right">{mensaje.length}/1000</p>
              </div>

              <motion.button
                onClick={handleEnviar} disabled={!mensaje.trim() || loading}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-[14px] font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: tipoActual.color, color: "#1A120B" }}>
                {loading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                {loading ? "Abriendo cliente de email..." : "Enviar mensaje"}
              </motion.button>

              <p className="text-center text-[11px] text-rodeo-cream/30">
                Se abrirá tu cliente de correo. Podés enviarlo desde ahí a{" "}
                <span className="text-rodeo-lime font-bold">contactomatchpro@gmail.com</span>
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
