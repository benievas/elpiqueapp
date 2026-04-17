"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Building2, LayoutGrid, Share2, Rocket, ChevronRight } from "lucide-react";
import Link from "next/link";

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center:               { opacity: 1, x: 0 },
  exit:  (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

export default function OnboardingDuenoPage() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    if (localStorage.getItem("owner_onboarded") === "true") {
      router.replace("/owner");
    }
  }, [router]);

  const goTo = (next: number) => {
    setDir(next > slide ? 1 : -1);
    setSlide(next);
  };

  const finish = () => {
    localStorage.setItem("owner_onboarded", "true");
    router.replace("/owner");
  };

  const slides = [
    // Slide 0 — Bienvenida
    <div key="s0" className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-rodeo-lime/20 border-2 border-rodeo-lime flex items-center justify-center">
          <Rocket size={28} className="text-rodeo-lime" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rodeo-lime/10 border border-rodeo-lime/25 text-rodeo-lime text-xs font-black">
          30 DÍAS GRATIS ACTIVADOS ✓
        </div>
        <h1 className="text-2xl font-black text-white leading-tight">
          ¡Bienvenido al panel<br />de <span className="text-rodeo-lime">dueños</span>!
        </h1>
        <p className="text-rodeo-cream/60 text-sm leading-relaxed max-w-xs mx-auto">
          En 3 pasos simples tu complejo va a estar publicado y recibiendo reservas de jugadores de toda la ciudad.
        </p>
      </div>
    </div>,

    // Slide 1 — Completá tu complejo
    <div key="s1" className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rodeo-lime flex items-center justify-center shrink-0">
          <span className="text-rodeo-dark font-black text-sm">1</span>
        </div>
        <div>
          <h2 className="text-xl font-black text-white">Completá tu complejo</h2>
          <p className="text-rodeo-cream/50 text-xs">Datos básicos y de contacto</p>
        </div>
      </div>
      <div className="p-4 rounded-[18px] bg-white/5 border border-white/8 space-y-3">
        <div className="flex items-start gap-3">
          <Building2 size={18} className="text-rodeo-lime shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-white">Información del complejo</p>
            <p className="text-xs text-rodeo-cream/50 mt-0.5 leading-relaxed">
              Nombre, dirección, teléfono, WhatsApp, deportes que ofrecés y horarios de apertura.
            </p>
          </div>
        </div>
        <Link href="/owner/complejo"
          className="flex items-center justify-between w-full px-4 py-3 rounded-[14px] bg-rodeo-lime/15 border border-rodeo-lime/30 text-rodeo-lime font-black text-sm hover:bg-rodeo-lime/25 transition-all">
          Ir a Mi Complejo <ChevronRight size={16} />
        </Link>
      </div>
      <p className="text-xs text-rodeo-cream/40 text-center">Podés completarlo ahora o más tarde desde el panel</p>
    </div>,

    // Slide 2 — Agregá canchas
    <div key="s2" className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rodeo-lime flex items-center justify-center shrink-0">
          <span className="text-rodeo-dark font-black text-sm">2</span>
        </div>
        <div>
          <h2 className="text-xl font-black text-white">Agregá tus canchas</h2>
          <p className="text-rodeo-cream/50 text-xs">Disponibilidad y precios</p>
        </div>
      </div>
      <div className="p-4 rounded-[18px] bg-white/5 border border-white/8 space-y-3">
        <div className="flex items-start gap-3">
          <LayoutGrid size={18} className="text-rodeo-lime shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-white">Canchas y horarios</p>
            <p className="text-xs text-rodeo-cream/50 mt-0.5 leading-relaxed">
              Creá cada cancha con su deporte, precio por hora y disponibilidad. Los jugadores la ven en tiempo real.
            </p>
          </div>
        </div>
        <Link href="/owner/canchas"
          className="flex items-center justify-between w-full px-4 py-3 rounded-[14px] bg-rodeo-lime/15 border border-rodeo-lime/30 text-rodeo-lime font-black text-sm hover:bg-rodeo-lime/25 transition-all">
          Ir a Mis Canchas <ChevronRight size={16} />
        </Link>
      </div>
      <p className="text-xs text-rodeo-cream/40 text-center">Podés agregar canchas ahora o más tarde</p>
    </div>,

    // Slide 3 — Compartí tu link
    <div key="s3" className="space-y-5 text-center">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-rodeo-lime/20 border-2 border-rodeo-lime flex items-center justify-center">
          <Share2 size={28} className="text-rodeo-lime" />
        </div>
      </div>
      <div className="flex items-center gap-3 justify-center">
        <div className="w-10 h-10 rounded-full bg-rodeo-lime flex items-center justify-center shrink-0">
          <span className="text-rodeo-dark font-black text-sm">3</span>
        </div>
        <h2 className="text-xl font-black text-white">¡Compartí tu link!</h2>
      </div>
      <p className="text-rodeo-cream/60 text-sm leading-relaxed max-w-xs mx-auto">
        Cada complejo tiene un link y QR único. Compartílo en redes sociales y WhatsApp para que los jugadores te encuentren fácil.
      </p>
      <div className="p-4 rounded-[18px] bg-rodeo-lime/10 border border-rodeo-lime/25 text-left space-y-2.5">
        {[
          "Tu complejo visible en ElPiqueApp",
          "Link y QR propio para compartir",
          "Reservas directas desde la app",
          "Panel para gestionar todo en un lugar",
        ].map(item => (
          <div key={item} className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-rodeo-lime shrink-0" />
            <span className="text-sm text-rodeo-cream/80">{item}</span>
          </div>
        ))}
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
          {slide < slides.length - 1 ? "Continuar" : "¡Ir a mi panel!"}
          <ArrowRight size={18} />
        </motion.button>
        <button onClick={finish} className="w-full py-2 text-sm text-rodeo-cream/40 hover:text-rodeo-cream/60 transition-colors">
          Omitir
        </button>
      </div>
    </div>
  );
}
