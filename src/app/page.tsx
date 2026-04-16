"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MapPin,
  AlertTriangle,
  Compass,
  Map,
  Star,
  CheckCircle2,
  Zap,
  Trophy,
  CalendarDays,
  QrCode,
  BarChart3,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";

// --- DATOS MOCK DEL SLIDER ---
const MOCK_DESTINATIONS = [
  {
    id: 1,
    title: "SPORTIVO CENTRAL",
    subtitle: "FÚTBOL / MULTIDEPORTE",
    description:
      "Complejo deportivo profesional con 8 canchas de fútbol sintético, padel y vóley. Infraestructura de primera con vestuarios, estacionamiento y servicios gastronómicos.",
    bgImage:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2000&auto=format&fit=crop",
    bgVideo: null,
    cardImage:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop",
    slug: "sportivo-central",
  },
  {
    id: 2,
    title: "PADEL CLUB ELITE",
    subtitle: "PADEL / TENIS",
    description:
      "Cancha de padel con césped sintético de última generación. Iluminación LED profesional para juegos nocturnos y área de espera climatizada.",
    bgImage:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=2000&auto=format&fit=crop",
    bgVideo: null,
    cardImage:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=600&auto=format&fit=crop",
    slug: "padel-club-elite",
  },
  {
    id: 3,
    title: "ARENA VÓLEY CATAMARCA",
    subtitle: "VÓLEY / BÁSQUET",
    description:
      "Estadio especializado en vóley con 4 canchas profesionales. Capacidad para ligas y torneos internacionales. Zona de entrenamientos y academia.",
    bgImage:
      "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=2000&auto=format&fit=crop",
    bgVideo: null,
    cardImage:
      "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=600&auto=format&fit=crop",
    slug: "arena-voley",
  },
];

const MOCK_ALERTA_ACTIVA = {
  activa: false,
  nivel: "amarillo" as "amarillo" | "rojo",
  texto: "Mantenimiento en Sportivo Central este sábado. Canchas disponibles a partir del domingo.",
  tipo: "Mantenimiento",
};

const MOCK_LUGARES_DESTACADOS = [
  { slug: "sportivo-central", nombre: "Sportivo Central", categoria: "Fútbol 5/11", rating: 4.8, imagen: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop" },
  { slug: "padel-club-elite", nombre: "Padel Club Elite", categoria: "Padel", rating: 4.9, imagen: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=600&auto=format&fit=crop" },
  { slug: "arena-voley", nombre: "Arena Vóley Catamarca", categoria: "Vóley", rating: 4.6, imagen: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=600&auto=format&fit=crop" },
  { slug: "tenis-club-norte", nombre: "Tenis Club Catamarca", categoria: "Tenis", rating: 4.7, imagen: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=600&auto=format&fit=crop" },
];

const MOCK_STATS = [
  { valor: "12", unidad: "+", descripcion: "Complejos deportivos disponibles" },
  { valor: "45", unidad: "+", descripcion: "Canchas regulares" },
  { valor: "8", unidad: "", descripcion: "Deportes diferentes" },
  { valor: "24/7", unidad: "", descripcion: "Reservas disponibles" },
  { valor: "500+", unidad: "", descripcion: "Jugadores activos" },
  { valor: "10K", unidad: "ARS", descripcion: "Tarifa promedio por cancha" },
];

const ACCESO_RAPIDO = [
  { href: "/explorar", icono: Compass, titulo: "Explorar Complejos", descripcion: "Descubrí todos los complejos deportivos", colorIcono: "text-rodeo-lime" },
  { href: "/mapa", icono: Map, titulo: "Mapa de Canchas", descripcion: "Ubicación de complejos en Catamarca", colorIcono: "text-blue-400" },
  { href: "/torneos", icono: Star, titulo: "Torneos", descripcion: "Participá en torneos activos", colorIcono: "text-yellow-400" },
];

const VENTAJAS = [
  { icono: Compass, titulo: "Fácil Reserva", descripcion: "Busca, selecciona tu horario y confirma en WhatsApp en menos de 2 minutos." },
  { icono: MapPin, titulo: "Ubicación Inteligente", descripcion: "Filtra por deporte, horario y disponibilidad. Mapa interactivo de todos los complejos." },
  { icono: Star, titulo: "Reseñas Verificadas", descripcion: "Lee opiniones de otros jugadores y califica cada cancha después de jugar." },
];

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % MOCK_DESTINATIONS.length);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + MOCK_DESTINATIONS.length) % MOCK_DESTINATIONS.length);
  }, []);

  useEffect(() => {
    setCurrentIndex(Math.floor(Math.random() * MOCK_DESTINATIONS.length));
    const timer = setInterval(handleNext, 7000);
    return () => clearInterval(timer);
  }, [handleNext]);

  const activeItem = MOCK_DESTINATIONS[currentIndex];

  const alertaColor = MOCK_ALERTA_ACTIVA.nivel === "rojo"
    ? { bg: "bg-red-500/20 border-y border-red-400/30", icono: "text-red-400", badge: "bg-red-500/20 text-red-400 border border-red-400/30" }
    : { bg: "bg-yellow-500/20 border-y border-yellow-400/30", icono: "text-yellow-400", badge: "bg-yellow-500/20 text-yellow-400 border border-yellow-400/30" };

  return (
    <div className="bg-rodeo-dark text-rodeo-cream font-sans">

      {/* HERO SLIDER */}
      <section className="relative h-screen overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeItem.id}
            src={activeItem.bgImage}
            alt="Background"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/50 z-0 backdrop-blur-sm" />

        {/* NAVBAR — flotante sin fondo, elementos directamente sobre el hero */}
        <header className="absolute top-0 w-full px-6 md:px-12 py-5 flex justify-between items-center z-20">
          <img
            src="/assets/logo-main.png"
            alt="ElPiqueApp"
            style={{ filter: "drop-shadow(0 0 12px rgba(200,255,0,0.25))" }}
            className="h-16 md:h-24 w-auto"
          />
          <nav className="hidden md:flex gap-10 text-xs font-bold tracking-[0.2em] text-white/90"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}
          >
            <Link href="/explorar" className="hover:text-rodeo-lime transition-colors">EXPLORAR</Link>
            <Link href="/mapa" className="hover:text-rodeo-lime transition-colors">MAPA</Link>
            <Link href="/torneos" className="hover:text-rodeo-lime transition-colors">TORNEOS</Link>
            <Link href="/owner" className="text-rodeo-lime hover:text-white transition-colors">PANEL DUEÑO</Link>
          </nav>
          <div className="flex gap-2">
            <button
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "12px",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
              className="p-2.5 hover:bg-white/25 transition-all"
            >
              <Search size={18} className="text-white" />
            </button>
            <Link
              href="/perfil"
              style={{
                background: "rgba(200,255,0,0.18)",
                border: "1px solid rgba(200,255,0,0.35)",
                borderRadius: "12px",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
              className="p-2.5 hover:bg-rodeo-lime/30 transition-all"
            >
              <User size={18} className="text-rodeo-lime" />
            </Link>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="absolute inset-0 z-10 flex pt-36 pb-28">
          {/* PANEL IZQUIERDO */}
          <div className="w-full md:w-[45%] pl-6 md:pl-24 flex flex-col justify-center pr-6 md:pr-0 relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col gap-4"
              >
                <span className="text-sm font-semibold tracking-[0.3em] text-rodeo-cream/80 uppercase">
                  {activeItem.subtitle}
                </span>
                <h1 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter text-white uppercase">
                  {activeItem.title}
                </h1>
                <p className="text-base md:text-lg text-rodeo-cream/90 max-w-md mt-2 font-light leading-relaxed">
                  {activeItem.description}
                </p>
                <div className="mt-6">
                  <Link href={`/complejo/${activeItem.slug}`} className="liquid-button inline-flex items-center gap-3 text-sm font-bold tracking-widest uppercase w-fit">
                    <MapPin size={18} />
                    Reservar Cancha
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* PANEL DERECHO: CARRUSEL */}
          <div className="hidden md:flex w-[55%] items-center overflow-visible pl-10 py-6">
            <motion.div
              className="flex gap-6"
              animate={{ x: `calc(-${currentIndex * 320}px - ${currentIndex * 24}px)` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {MOCK_DESTINATIONS.map((dest, index) => {
                const isActive = index === currentIndex;
                return (
                  <motion.div
                    key={dest.id}
                    animate={{ scale: isActive ? 1 : 0.85, opacity: isActive ? 1 : 0.5 }}
                    transition={{ duration: 0.4 }}
                    className="w-[320px] h-[460px] shrink-0 rounded-liquid-lg overflow-hidden relative cursor-pointer group shadow-glass border border-white/20"
                    onClick={() => setCurrentIndex(index)}
                  >
                    <img src={dest.cardImage} alt={dest.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-8">
                      <span className="text-xs font-bold tracking-widest text-rodeo-cream/80 uppercase mb-2 block">{dest.subtitle}</span>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight">{dest.title}</h3>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </main>

        {/* CONTROLES */}
        <footer className="absolute bottom-10 w-full px-6 md:px-24 flex justify-between items-end z-20">
          <div className="flex gap-4">
            <button onClick={handlePrev} className="w-12 h-12 rounded-full border border-white/30 bg-white/5 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-colors">
              <ChevronLeft size={24} />
            </button>
            <button onClick={handleNext} className="w-12 h-12 rounded-full border border-white/30 bg-white/5 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-colors">
              <ChevronRight size={24} />
            </button>
          </div>
          <div className="text-6xl md:text-8xl font-black text-white/20 tracking-tighter tabular-nums leading-none">
            0{currentIndex + 1}
          </div>
        </footer>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown size={20} className="text-white/40" />
          </motion.div>
          <span className="text-[10px] tracking-widest text-white/30 uppercase">Deslizá para conocer más</span>
        </div>
      </section>

      {/* ALERTA */}
      {MOCK_ALERTA_ACTIVA.activa && (
        <section className={`${alertaColor.bg} px-6 py-4`}>
          <div className="max-w-4xl mx-auto flex items-start gap-4">
            <AlertTriangle size={20} className={`${alertaColor.icono} shrink-0 mt-0.5`} />
            <p className="text-sm text-rodeo-cream/90 leading-relaxed flex-1">{MOCK_ALERTA_ACTIVA.texto}</p>
            <span className={`${alertaColor.badge} text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full shrink-0`}>{MOCK_ALERTA_ACTIVA.tipo}</span>
          </div>
        </section>
      )}

      {/* ACCESO RÁPIDO */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40 mb-5">Acceso Rápido</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ACCESO_RAPIDO.map((item) => {
              const Icono = item.icono;
              return (
                <Link key={item.href} href={item.href}>
                  <div className="liquid-panel p-5 flex flex-col gap-3 hover:bg-white/10 transition-colors cursor-pointer h-full">
                    <Icono size={28} className={item.colorIcono} />
                    <div>
                      <p className="text-sm font-bold text-white">{item.titulo}</p>
                      <p className="text-xs text-rodeo-cream/40 mt-0.5 leading-relaxed">{item.descripcion}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="px-6 py-12 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40 mb-8">ElPiqueApp en Números</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {MOCK_STATS.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} className="flex flex-col gap-1">
                <div className="text-4xl font-black text-white leading-none">
                  {stat.valor}
                  {stat.unidad && <span className="text-2xl text-rodeo-cream/40 ml-1">{stat.unidad}</span>}
                </div>
                <p className="text-xs text-rodeo-cream/50 leading-relaxed">{stat.descripcion}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPLEJOS DESTACADOS */}
      <section className="py-12 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black uppercase tracking-tight text-white px-6 mb-6">Complejos Destacados</h2>
          <div className="flex gap-4 overflow-x-auto px-6 pb-4 snap-x snap-mandatory scroll-smooth scrollbar-thin">
            {MOCK_LUGARES_DESTACADOS.map((lugar, i) => (
              <Link key={i} href={`/complejo/${lugar.slug}`} className="w-64 shrink-0 liquid-panel overflow-hidden hover:bg-white/10 transition-colors snap-start">
                <div className="h-40 overflow-hidden">
                  <img src={lugar.imagen} alt={lugar.nombre} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-rodeo-cream/40 mb-1">{lugar.categoria}</p>
                  <h3 className="text-sm font-bold text-white leading-tight">{lugar.nombre}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-rodeo-cream/60">{lugar.rating}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* QUÉ ES ELPIQUEAPP */}
      <section className="px-6 py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
          >
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rodeo-lime/10 border border-rodeo-lime/20 text-rodeo-lime text-xs font-bold tracking-widest uppercase">
                <Zap size={12} /> ¿Qué es ElPiqueApp?
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-tight">
                La app deportiva de Catamarca
              </h2>
              <p className="text-rodeo-cream/70 leading-relaxed">
                ElPiqueApp conecta jugadores con complejos deportivos de forma simple y rápida. Buscás la cancha, elegís el horario disponible y reservás directo por WhatsApp — sin apps extra, sin complicaciones.
              </p>
              <p className="text-rodeo-cream/70 leading-relaxed">
                Para los dueños de complejos, es la herramienta completa: gestionás tus canchas, horarios, reservas y torneos desde un panel dedicado. Tu complejo visible para cientos de jugadores en la región.
              </p>
              <div className="flex flex-col gap-3 pt-2">
                {[
                  "Reservas vía WhatsApp sin intermediarios",
                  "Mapa interactivo con todos los complejos",
                  "Torneos y ligas organizadas",
                  "Panel de gestión para dueños",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-rodeo-lime shrink-0" />
                    <span className="text-sm text-rodeo-cream/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: MessageCircle, label: "Reservas por WhatsApp", desc: "Confirmación instantánea con el dueño" },
                { icon: CalendarDays, label: "Disponibilidad en tiempo real", desc: "Ves qué horarios están libres" },
                { icon: Trophy, label: "Torneos y ligas", desc: "Anotate y competí con tu equipo" },
                { icon: MapPin, label: "Mapa interactivo", desc: "Encontrá complejos cerca tuyo" },
              ].map((item, i) => {
                const Icono = item.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="liquid-panel p-4 space-y-2"
                  >
                    <Icono size={22} className="text-rodeo-lime" />
                    <p className="text-white text-xs font-bold leading-tight">{item.label}</p>
                    <p className="text-rodeo-cream/50 text-[11px] leading-relaxed">{item.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* PARA DUEÑOS — PRICING */}
      <section className="px-6 py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-rodeo-cream/60 text-xs font-bold tracking-widest uppercase">
              Para dueños de complejos
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
              Sumá tu complejo a ElPiqueApp
            </h2>
            <p className="text-rodeo-cream/60 max-w-xl mx-auto">
              Una sola licencia, todas las herramientas. Con un mes gratis para que lo pruebes sin comprometerte.
            </p>
          </motion.div>

          {/* Cards de precio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {/* Mensual */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="liquid-panel p-6 space-y-4"
            >
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40">Plan Mensual</p>
                <div className="flex items-end gap-1 mt-2">
                  <span className="text-4xl font-black text-white">$60.000</span>
                  <span className="text-rodeo-cream/50 text-sm mb-1">/mes</span>
                </div>
              </div>
              <p className="text-xs text-rodeo-cream/50">Cancelás cuando querés. Sin contratos.</p>
              <Link href="/login" className="liquid-button block text-center text-sm font-bold text-rodeo-cream">
                Empezar prueba gratis
              </Link>
            </motion.div>

            {/* Anual — destacado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="liquid-panel p-6 space-y-4 relative border-rodeo-lime/30 bg-gradient-to-br from-rodeo-lime/10 to-transparent"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-rodeo-lime text-rodeo-dark text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase">
                  Ahorrás 2 meses
                </span>
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-rodeo-lime/70">Plan Anual</p>
                <div className="flex items-end gap-1 mt-2">
                  <span className="text-4xl font-black text-white">$600.000</span>
                  <span className="text-rodeo-cream/50 text-sm mb-1">/año</span>
                </div>
                <p className="text-xs text-rodeo-lime/80 mt-1">≈ $50.000/mes — 2 meses gratis vs mensual</p>
              </div>
              <p className="text-xs text-rodeo-cream/50">Pago único anual. Máximo ahorro.</p>
              <Link href="/login" className="block text-center text-sm font-black py-3 rounded-liquid bg-rodeo-lime text-rodeo-dark hover:bg-rodeo-lime/80 transition-all">
                Empezar prueba gratis
              </Link>
            </motion.div>
          </div>

          {/* 1 mes gratis banner */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="liquid-panel p-5 max-w-2xl mx-auto flex items-center gap-4 border-rodeo-lime/20"
          >
            <div className="text-3xl shrink-0">🎁</div>
            <div>
              <p className="text-white font-bold text-sm">1 mes gratis para probar</p>
              <p className="text-rodeo-cream/60 text-xs mt-0.5">Registrá tu complejo, configurá todo y usá la plataforma completa sin pagar nada el primer mes. Sin tarjeta requerida.</p>
            </div>
          </motion.div>

          {/* Ventajas competitivas */}
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40 mb-6 text-center">¿Por qué ElPiqueApp y no otra plataforma?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {[
                { icon: Zap, highlight: "Canchas ilimitadas", text: "Sin límite de canchas por complejo. Agregá todas las que tenés." },
                { icon: MessageCircle, highlight: "Feed publicitario gratis", text: "Publicá novedades, promos y torneos en el feed visible para todos los jugadores." },
                { icon: Trophy, highlight: "Torneos gratis incluidos", text: "Creá y gestioná torneos desde el panel sin costo adicional." },
                { icon: QrCode, highlight: "QR + link propio", text: "Tu complejo con URL propia y código QR descargable para compartir." },
                { icon: CalendarDays, highlight: "Disponibilidad en tiempo real", text: "Los jugadores ven qué canchas están libres en cada horario, sin llamadas." },
                { icon: MapPin, highlight: "Visibilidad en el mapa", text: "Aparecé en el mapa de ElPiqueApp con toda la info de tu complejo." },
                { icon: BarChart3, highlight: "Estadísticas y reportes", text: "Visualizá ocupación, canchas más reservadas y tendencias de uso." },
                { icon: Star, highlight: "Reseñas verificadas", text: "Acumulá reseñas reales de jugadores que refuercen tu reputación." },
              ].map((item, i) => {
                const Icono = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/5">
                    <div className="p-1.5 rounded-lg bg-rodeo-lime/15 mt-0.5">
                      <Icono size={14} className="text-rodeo-lime shrink-0" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.highlight}</p>
                      <p className="text-xs text-rodeo-cream/50 mt-0.5">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-12 pb-24 md:pb-12 bg-black/20">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <img src="/assets/logo-main.png" alt="ElPiqueApp" className="h-20 w-auto" style={{ filter: "drop-shadow(0 0 8px rgba(200,255,0,0.2))" }} />
          <p className="text-xs text-rodeo-cream/30 tracking-widest uppercase text-center">Reserva canchas deportivas en Catamarca · 24/7 disponible</p>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {[{ href: "/explorar", label: "Explorar" }, { href: "/mapa", label: "Mapa" }, { href: "/torneos", label: "Torneos" }, { href: "/perfil", label: "Mi Perfil" }, { href: "/owner", label: "Panel Dueño" }].map((link) => (
              <Link key={link.href} href={link.href} className="text-xs text-rodeo-cream/30 hover:text-rodeo-cream/70 transition-colors">{link.label}</Link>
            ))}
          </nav>
          <div className="flex gap-4 text-[11px] text-rodeo-cream/30">
            <Link href="/privacidad" className="hover:text-rodeo-cream/60 transition-colors">Privacidad</Link>
            <span>·</span>
            <Link href="/terminos" className="hover:text-rodeo-cream/60 transition-colors">Términos</Link>
          </div>
          <p className="text-[10px] text-rodeo-cream/20 text-center">© 2026 ElPiqueApp · Plataforma de Reservas Deportivas Catamarca</p>
        </div>
      </footer>
    </div>
  );
}
