"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Search, Calendar, MessageCircle, CheckCircle2 } from "lucide-react";

const DEPORTES = [
  { id: "futbol",  label: "Fútbol",   emoji: "⚽" },
  { id: "padel",   label: "Pádel",    emoji: "🎾" },
  { id: "tenis",   label: "Tenis",    emoji: "🏸" },
  { id: "voley",   label: "Vóley",    emoji: "🏐" },
  { id: "basquet", label: "Básquet",  emoji: "🏀" },
];

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center:               { opacity: 1, x: 0 },
  exit:  (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

export default function OnboardingJugadorPage() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const [dir, setDir] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (localStorage.getItem("player_onboarded") === "true") {
      router.replace("/explorar");
    }
  }, [router]);

  const goTo = (next: number) => {
    setDir(next > slide ? 1 : -1);
    setSlide(next);
  };

  const finish = () => {
    localStorage.setItem("player_onboarded", "true");
    if (selected.length > 0) localStorage.setItem("player_sports", JSON.stringify(selected));
    router.replace("/explorar");
  };

  const toggleSport = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const slides = [
    // Slide 0 — Bienvenida
    <div key="s0" className="space-y-6 text-center">
      <motion.img src="/assets/elpique.png" alt="ElPiqueApp" className="h-20 w-auto mx-auto"
        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} />
      <div className="space-y-3">
        <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "44px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }} className="text-white">
          Bienvenido a<br /><span className="text-rodeo-lime">ElPiqueApp</span>
        </h1>
        <p className="text-rodeo-cream/60 text-sm leading-relaxed max-w-xs mx-auto">
          La forma más fácil de encontrar y reservar canchas deportivas en Catamarca. Rápido, fácil y sin llamadas.
        </p>
      </div>
    </div>,

    // Slide 1 — Cómo funciona
    <div key="s1" className="space-y-5">
      <div className="text-center space-y-1">
        <h2 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "32px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }} className="text-white"><span className="section-slash">/</span>¿Cómo funciona?</h2>
        <p className="text-rodeo-cream/50 text-sm">Reservar es muy simple</p>
      </div>
      <div className="space-y-3">
        {[
          { icon: Search,        title: "Buscá tu cancha",       desc: "Explorá complejos por deporte, precio u horario disponible." },
          { icon: Calendar,      title: "Elegí el horario",      desc: "Ves disponibilidad en tiempo real y reservás con un toque." },
          { icon: MessageCircle, title: "Confirmá por WhatsApp", desc: "Te conectamos directo con el complejo para confirmar la reserva." },
        ].map(({ icon: Icon, title, desc }, i) => (
          <div key={i} className="flex items-start gap-4 p-4 rounded-[18px] bg-white/5 border border-white/8">
            <div className="w-10 h-10 rounded-full bg-rodeo-lime/15 border border-rodeo-lime/30 flex items-center justify-center shrink-0">
              <Icon size={18} className="text-rodeo-lime" />
            </div>
            <div>
              <p className="text-sm font-black text-white">{title}</p>
              <p className="text-xs text-rodeo-cream/50 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>,

    // Slide 2 — Deportes favoritos
    <div key="s2" className="space-y-5">
      <div className="text-center space-y-1">
        <h2 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "32px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }} className="text-white"><span className="section-slash">/</span>¿Qué deportes jugás?</h2>
        <p className="text-rodeo-cream/50 text-sm">Seleccioná tus favoritos (opcional)</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {DEPORTES.map(({ id, label, emoji }) => {
          const active = selected.includes(id);
          return (
            <button key={id} onClick={() => toggleSport(id)}
              className={`relative flex items-center gap-3 p-4 rounded-[18px] border transition-all text-left
                ${active ? "bg-rodeo-lime/15 border-rodeo-lime/50" : "bg-white/5 border-white/10 hover:bg-white/8"}`}>
              <span className="text-2xl">{emoji}</span>
              <span className={`text-sm font-bold ${active ? "text-rodeo-lime" : "text-rodeo-cream/80"}`}>{label}</span>
              {active && <CheckCircle2 size={14} className="absolute top-2 right-2 text-rodeo-lime" />}
            </button>
          );
        })}
      </div>
    </div>,
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark overflow-hidden flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.45, 0.2] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-rodeo-lime/10 rounded-full blur-3xl" />
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.45, 0.2] }} transition={{ duration: 8, repeat: Infinity, delay: 3 }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-rodeo-terracotta/8 rounded-full blur-3xl" />
      </div>

      {/* Puntos de progreso */}
      <div className="relative z-10 flex justify-center gap-2 pt-12 pb-2">
        {slides.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? "w-8 bg-rodeo-lime" : "w-2 bg-white/20"}`} />
        ))}
      </div>

      {/* Slide */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-6 overflow-hidden">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={slide} custom={dir} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="liquid-panel p-6">
              {slides[slide]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Botones */}
      <div className="relative z-10 px-6 pb-10 space-y-3 max-w-sm mx-auto w-full">
        <motion.button
          onClick={() => slide < slides.length - 1 ? goTo(slide + 1) : finish()}
          whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
          className="w-full py-4 rounded-[16px] bg-rodeo-lime text-rodeo-dark font-black text-base
            flex items-center justify-center gap-2 hover:shadow-[0_8px_32px_rgba(200,255,0,0.35)] transition-all">
          {slide < slides.length - 1 ? "Continuar" : "¡Empezar a explorar!"}
          <ArrowRight size={18} />
        </motion.button>
        <button onClick={finish} className="w-full py-2 text-sm text-rodeo-cream/40 hover:text-rodeo-cream/60 transition-colors">
          Omitir
        </button>
      </div>
    </div>
  );
}
