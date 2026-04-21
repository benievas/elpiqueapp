"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Building2, LayoutGrid, Share2, Rocket,
  ChevronRight, Trophy, Rss, Zap, Bell,
} from "lucide-react";
import Link from "next/link";

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center:               { opacity: 1, x: 0 },
  exit:  (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

const HEADING = {
  fontFamily: "'Barlow Condensed', system-ui, sans-serif",
  fontWeight: 900,
  letterSpacing: "-0.02em",
  textTransform: "uppercase" as const,
  lineHeight: 0.95,
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
    // 0 — Bienvenida
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
        <h1 style={{ ...HEADING, fontSize: "38px" }} className="text-white">
          ¡Bienvenido al panel<br />de <span className="text-rodeo-lime">dueños</span>!
        </h1>
        <p className="text-rodeo-cream/60 text-sm leading-relaxed max-w-xs mx-auto">
          Todo lo que necesitás para gestionar tu complejo, atraer jugadores y llenar tus canchas — en un solo lugar.
        </p>
      </div>
    </div>,

    // 1 — Completá tu complejo
    <div key="s1" className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rodeo-lime flex items-center justify-center shrink-0">
          <span className="text-rodeo-dark font-black text-sm">1</span>
        </div>
        <div>
          <h2 style={{ ...HEADING, fontSize: "22px" }} className="text-white">Completá tu complejo</h2>
          <p className="text-rodeo-cream/50 text-xs">Datos básicos y de contacto</p>
        </div>
      </div>
      <div className="p-4 rounded-[18px] bg-white/5 border border-white/8 space-y-3">
        <div className="flex items-start gap-3">
          <Building2 size={18} className="text-rodeo-lime shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-white">Información del complejo</p>
            <p className="text-xs text-rodeo-cream/50 mt-0.5 leading-relaxed">
              Nombre, dirección, WhatsApp, fotos, deportes y horarios. Tu página pública se genera automáticamente.
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

    // 2 — Canchas
    <div key="s2" className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rodeo-lime flex items-center justify-center shrink-0">
          <span className="text-rodeo-dark font-black text-sm">2</span>
        </div>
        <div>
          <h2 style={{ ...HEADING, fontSize: "22px" }} className="text-white">Agregá tus canchas</h2>
          <p className="text-rodeo-cream/50 text-xs">Precios, superficie e iluminación</p>
        </div>
      </div>
      <div className="p-4 rounded-[18px] bg-white/5 border border-white/8 space-y-3">
        <div className="flex items-start gap-3">
          <LayoutGrid size={18} className="text-rodeo-lime shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-white">Canchas y disponibilidad</p>
            <p className="text-xs text-rodeo-cream/50 mt-0.5 leading-relaxed">
              Cada cancha con su deporte, precio/hora, superficie y estado. Los jugadores ven disponibilidad en tiempo real.
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

    // 3 — Torneos
    <div key="s3" className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
          <Trophy size={18} className="text-rodeo-dark" />
        </div>
        <div>
          <h2 style={{ ...HEADING, fontSize: "22px" }} className="text-white">Organizá torneos</h2>
          <p className="text-rodeo-cream/50 text-xs">Atraé jugadores con competencias</p>
        </div>
      </div>
      <div className="space-y-3">
        {[
          { t: "Creá torneos de cualquier deporte", d: "Fútbol, pádel, tenis, vóley — fijás los cupos, el precio y las fechas." },
          { t: "Inscripción online desde la app", d: "Los jugadores se anotan con su equipo directamente. Vos ves los equipos inscriptos en tiempo real." },
          { t: "Bracket automático", d: "ElPiqueApp genera el fixture y actualiza los resultados automáticamente." },
        ].map(({ t, d }) => (
          <div key={t} className="flex items-start gap-3 p-3 rounded-[14px] bg-white/5 border border-white/8">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 shrink-0" />
            <div>
              <p className="text-sm font-black text-white">{t}</p>
              <p className="text-xs text-rodeo-cream/50 mt-0.5 leading-relaxed">{d}</p>
            </div>
          </div>
        ))}
      </div>
      <Link href="/owner/torneos"
        className="flex items-center justify-between w-full px-4 py-3 rounded-[14px] bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 font-black text-sm hover:bg-yellow-400/20 transition-all">
        Ver mis torneos <ChevronRight size={16} />
      </Link>
    </div>,

    // 4 — Descuento Express
    <div key="s4" className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "rgba(251,191,36,0.2)", border: "2px solid rgba(251,191,36,0.5)" }}>
          <Zap size={18} className="text-yellow-400" />
        </div>
        <div>
          <h2 style={{ ...HEADING, fontSize: "22px" }} className="text-white">Cancha libre ahora</h2>
          <p className="text-rodeo-cream/50 text-xs">Llenás huecos con descuento express</p>
        </div>
      </div>
      <div className="p-4 rounded-[18px] space-y-3"
        style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.25)" }}>
        <p className="text-sm text-rodeo-cream/80 leading-relaxed">
          ¿Te quedó una cancha vacía para las próximas horas? Activás el toggle <span className="font-black text-yellow-400">⚡ Express</span> en la cancha y aparece al instante en el home de la app con el descuento que vos elegís.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <div className="h-7 px-3 rounded-lg flex items-center gap-1.5 text-xs font-black"
            style={{ background: "rgba(251,191,36,0.2)", color: "#FBbf24", border: "1px solid rgba(251,191,36,0.4)" }}>
            <Zap size={12} /> Express -20%
          </div>
          <span className="text-xs text-rodeo-cream/40">aparece en el home para todos los jugadores</span>
        </div>
      </div>
      <Link href="/owner/canchas"
        className="flex items-center justify-between w-full px-4 py-3 rounded-[14px] text-sm font-black transition-all"
        style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", color: "#FBbf24" }}>
        Activar en mis canchas <ChevronRight size={16} />
      </Link>
    </div>,

    // 5 — Feed + Notificaciones
    <div key="s5" className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 border-2 border-blue-400/50 flex items-center justify-center shrink-0">
          <Rss size={18} className="text-blue-400" />
        </div>
        <div>
          <h2 style={{ ...HEADING, fontSize: "22px" }} className="text-white">Publicá en el feed</h2>
          <p className="text-rodeo-cream/50 text-xs">Llegá directo a la comunidad</p>
        </div>
      </div>
      <div className="space-y-3">
        {[
          { icon: Rss,   color: "text-blue-400",  t: "Feed de novedades", d: "Publicá promos, avisos, fotos del complejo. Aparece en el feed público de todos los jugadores de tu ciudad." },
          { icon: Bell,  color: "text-rodeo-lime", t: "Notificaciones por email", d: "Recibís un email cada vez que llega una reserva nueva o un equipo se inscribe a tu torneo. Configuralo en Ajustes." },
        ].map(({ icon: Icon, color, t, d }) => (
          <div key={t} className="flex items-start gap-3 p-3 rounded-[14px] bg-white/5 border border-white/8">
            <Icon size={18} className={`${color} shrink-0 mt-0.5`} />
            <div>
              <p className="text-sm font-black text-white">{t}</p>
              <p className="text-xs text-rodeo-cream/50 mt-0.5 leading-relaxed">{d}</p>
            </div>
          </div>
        ))}
      </div>
    </div>,

    // 6 — Listo
    <div key="s6" className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-rodeo-lime/20 border-2 border-rodeo-lime flex items-center justify-center">
          <Share2 size={28} className="text-rodeo-lime" />
        </div>
      </div>
      <div>
        <h2 style={{ ...HEADING, fontSize: "32px" }} className="text-white">¡Compartí tu link!</h2>
        <p className="text-rodeo-cream/60 text-sm leading-relaxed max-w-xs mx-auto mt-3">
          Tu complejo tiene una URL y QR únicos. Compartílos en redes y WhatsApp para que los jugadores te encuentren.
        </p>
      </div>
      <div className="p-4 rounded-[18px] bg-rodeo-lime/10 border border-rodeo-lime/25 text-left space-y-2.5">
        {[
          "Tu complejo publicado en ElPiqueApp",
          "Link y QR propio para compartir",
          "Torneos con inscripción online",
          "Descuento express para llenar horas vacías",
          "Notificaciones de reservas y torneos",
          "Feed para llegar a la comunidad",
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

      <div className="relative z-10 flex justify-center gap-2 pt-12 pb-2">
        {slides.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? "w-8 bg-rodeo-lime" : "w-2 bg-white/20"}`} />
        ))}
      </div>

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
          Omitir tour
        </button>
      </div>
    </div>
  );
}
