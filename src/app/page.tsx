"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MapPin,
  AlertTriangle,
  Compass,
  Map,
  Footprints,
  Star,
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

        {/* NAVBAR */}
        <header className="absolute top-0 w-full px-6 md:px-12 py-6 flex justify-between items-center z-20">
          <span className="text-xl font-black text-white tracking-tight uppercase">
            ElPique<span className="text-rodeo-lime">App</span>
          </span>
          <nav className="hidden md:flex gap-10 text-sm font-medium tracking-wide text-rodeo-cream/80">
            <Link href="/explorar" className="hover:text-white transition-colors">EXPLORAR</Link>
            <Link href="/mapa" className="hover:text-white transition-colors">MAPA</Link>
            <Link href="/torneos" className="hover:text-white transition-colors">TORNEOS</Link>
            <Link href="/dueno/dashboard" className="hover:text-white transition-colors">PANEL DUEÑO</Link>
          </nav>
          <div className="flex gap-3">
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <Search size={20} />
            </button>
            <Link href="/perfil" className="p-2 rounded-full hover:bg-white/10 transition-colors bg-white/5 border border-white/10">
              <User size={20} />
            </Link>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="absolute inset-0 z-10 flex pt-28 pb-24">
          {/* PANEL IZQUIERDO */}
          <div className="w-full md:w-[45%] pl-6 md:pl-24 flex flex-col justify-center pr-6 md:pr-0">
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
          <div className="hidden md:flex w-[55%] items-center overflow-hidden pl-10">
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
                    className="w-[320px] h-[480px] shrink-0 rounded-liquid-lg overflow-hidden relative cursor-pointer group shadow-glass border border-white/20"
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

      {/* POR QUÉ ELPIQUEAPP */}
      <section className="px-6 py-12 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Star size={20} className="text-rodeo-lime" />
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">¿Por qué ElPiqueApp?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {VENTAJAS.map((opcion, i) => {
              const Icono = opcion.icono;
              return (
                <div key={i} className="liquid-panel p-5 flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Icono size={20} className="text-rodeo-terracotta" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{opcion.titulo}</h3>
                  <p className="text-xs text-rodeo-cream/60 leading-relaxed">{opcion.descripcion}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-12 pb-24 md:pb-12 bg-black/20">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <span className="text-2xl font-black text-white tracking-tight uppercase">ElPique<span className="text-rodeo-lime">App</span></span>
          <p className="text-xs text-rodeo-cream/30 tracking-widest uppercase text-center">Reserva canchas deportivas en Catamarca · 24/7 disponible</p>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {[{ href: "/explorar", label: "Explorar" }, { href: "/mapa", label: "Mapa" }, { href: "/torneos", label: "Torneos" }, { href: "/perfil", label: "Mi Perfil" }, { href: "/dueno/dashboard", label: "Panel Dueño" }].map((link) => (
              <Link key={link.href} href={link.href} className="text-xs text-rodeo-cream/30 hover:text-rodeo-cream/70 transition-colors">{link.label}</Link>
            ))}
          </nav>
          <p className="text-[10px] text-rodeo-cream/20 text-center">© 2026 ElPiqueApp · Plataforma de Reservas Deportivas Catamarca</p>
        </div>
      </footer>
    </div>
  );
}
