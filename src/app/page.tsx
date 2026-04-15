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
  Shield,
  Navigation,
  Car,
  Bus,
  Plane,
  Star,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
      "https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=2000&auto=format&fit=crop",
    bgVideo: null,
    cardImage:
      "https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=600&auto=format&fit=crop",
    slug: "padel-club-elite",
  },
  {
    id: 3,
    title: "ARENA VÓLEY CATAMARCA",
    subtitle: "VÓLEY / BÁSQUET",
    description:
      "Estadio especializado en vóley con 4 canchas profesionales. Capacidad para ligas y torneos internacionales. Zona de entrenamientos y academia.",
    bgImage:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2000&auto=format&fit=crop",
    bgVideo: null,
    cardImage:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop",
    slug: "arena-voley",
  },
];

// --- MOCK ALERTA ---
const MOCK_ALERTA_ACTIVA = {
  activa: false,
  nivel: "amarillo" as "amarillo" | "rojo",
  texto:
    "Mantenimiento en Sportivo Central este sábado. Canchas disponibles a partir del domingo.",
  tipo: "Mantenimiento",
};

// --- MOCK COMPLEJOS DESTACADOS ---
const MOCK_LUGARES_DESTACADOS = [
  {
    slug: "sportivo-central",
    nombre: "Sportivo Central",
    categoria: "Fútbol 5/11",
    rating: 4.8,
    imagen:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop",
  },
  {
    slug: "padel-club-elite",
    nombre: "Padel Club Elite",
    categoria: "Padel",
    rating: 4.9,
    imagen:
      "https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=600&auto=format&fit=crop",
  },
  {
    slug: "arena-voley",
    nombre: "Arena Vóley Catamarca",
    categoria: "Vóley",
    rating: 4.6,
    imagen:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop",
  },
  {
    slug: "sportivo-central",
    nombre: "Tenis Club Catamarca",
    categoria: "Tenis",
    rating: 4.7,
    imagen:
      "https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=600&auto=format&fit=crop",
  },
];

// --- STATS ---
const MOCK_STATS = [
  { valor: "12", unidad: "+", descripcion: "Complejos deportivos disponibles" },
  { valor: "45", unidad: "+", descripcion: "Canchas regulares" },
  { valor: "8", unidad: "", descripcion: "Deportes diferentes" },
  { valor: "24/7", unidad: "", descripcion: "Reservas disponibles" },
  { valor: "500+", unidad: "", descripcion: "Jugadores activos" },
  { valor: "10K", unidad: "ARS", descripcion: "Tarifa promedio por cancha" },
];

// --- ACCESO RÁPIDO ---
const ACCESO_RAPIDO = [
  {
    href: "/explorar",
    icono: Compass,
    titulo: "Explorar Complejos",
    descripcion: "Descubrí todos los complejos deportivos",
    colorIcono: "text-rodeo-lime",
  },
  {
    href: "/mapa",
    icono: Map,
    titulo: "Mapa de Canchas",
    descripcion: "Ubicación de complejos en Catamarca",
    colorIcono: "text-blue-400",
  },
  {
    href: "/mis-reservas",
    icono: Footprints,
    titulo: "Mis Reservas",
    descripcion: "Administra tus reservas activas",
    colorIcono: "text-green-400",
  },
];

// --- VENTAJAS DE MATCHPRO ---
const VENTAJAS = [
  {
    icono: Compass,
    titulo: "Fácil Reserva",
    descripcion:
      "Busca, selecciona tu horario y confirma en WhatsApp en menos de 2 minutos.",
  },
  {
    icono: MapPin,
    titulo: "Ubicación Inteligente",
    descripcion:
      "Filtra por deporte, horario y disponibilidad. Mapa interactivo de todos los complejos.",
  },
  {
    icono: Star,
    titulo: "Reseñas Verificadas",
    descripcion:
      "Lee opiniones de otros jugadores y califica cada cancha después de jugar.",
  },
];

export default function TuristaHome() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % MOCK_DESTINATIONS.length);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex(
      (prev) => (prev - 1 + MOCK_DESTINATIONS.length) % MOCK_DESTINATIONS.length
    );
  }, []);

  useEffect(() => {
    setCurrentIndex(Math.floor(Math.random() * MOCK_DESTINATIONS.length));
    const timer = setInterval(handleNext, 7000);
    return () => clearInterval(timer);
  }, [handleNext]);

  const activeItem = MOCK_DESTINATIONS[currentIndex];

  const alertaColor =
    MOCK_ALERTA_ACTIVA.nivel === "rojo"
      ? {
          bg: "bg-red-500/20 border-y border-red-400/30",
          icono: "text-red-400",
          badge: "bg-red-500/20 text-red-400 border border-red-400/30",
        }
      : {
          bg: "bg-yellow-500/20 border-y border-yellow-400/30",
          icono: "text-yellow-400",
          badge: "bg-yellow-500/20 text-yellow-400 border border-yellow-400/30",
        };

  return (
    <div className="bg-rodeo-dark text-rodeo-cream font-sans">

      {/* ===================== SECCIÓN 1: HERO SLIDER ===================== */}
      <section className="relative h-screen overflow-hidden">
        {/* LAYER 0: FONDO DINÁMICO (Video o Imagen) */}
        <AnimatePresence mode="wait">
          {activeItem.bgVideo ? (
            <motion.video
              key={activeItem.id}
              src={activeItem.bgVideo}
              autoPlay
              muted
              loop
              playsInline
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          ) : (
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
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/50 z-0 backdrop-blur-sm" />

        {/* HEADER NAVBAR */}
        <header className="absolute top-0 w-full px-12 py-8 flex justify-between items-center z-20">
          <img src="/assets/logo-main.png" alt="ElPiqueApp" className="h-12 w-auto object-contain" />

          <nav className="hidden md:flex gap-12 text-sm font-medium tracking-wide">
            <Link
              href="/explorar"
              className="hover:text-white transition-colors border-b border-transparent hover:border-white pb-1"
            >
              EXPLORAR
            </Link>
            <Link
              href="/mapa"
              className="hover:text-white transition-colors border-b border-transparent hover:border-white pb-1"
            >
              MAPA
            </Link>
            <Link
              href="/dueno/dashboard"
              className="hover:text-white transition-colors border-b border-transparent hover:border-white pb-1"
            >
              PANEL DUEÑO
            </Link>
          </nav>

          <div className="flex gap-6">
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <Search size={20} />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <Bell size={20} />
            </button>
            <Link
              href="/perfil"
              className="p-2 rounded-full hover:bg-white/10 transition-colors bg-white/5 border border-white/10"
            >
              <User size={20} />
            </Link>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="absolute inset-0 z-10 flex pt-32 pb-24">
          {/* PANEL IZQUIERDO */}
          <div className="w-[45%] pl-12 md:pl-24 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ duration: 0.5, staggerChildren: 0.1 }}
                className="flex flex-col gap-4"
              >
                <motion.span className="text-sm font-semibold tracking-[0.3em] text-rodeo-cream/80 uppercase">
                  {activeItem.subtitle}
                </motion.span>
                <motion.h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter text-white uppercase">
                  {activeItem.title}
                </motion.h1>
                <motion.p className="text-lg text-rodeo-cream/90 max-w-md mt-4 font-light leading-relaxed">
                  {activeItem.description}
                </motion.p>
                <motion.div className="mt-8">
                  <Link
                    href={`/complejo/${activeItem.slug}`}
                    className="liquid-button inline-flex items-center gap-3 text-sm font-bold tracking-widest uppercase w-fit"
                  >
                    <MapPin size={18} />
                    Descubrir Lugar
                  </Link>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* PANEL DERECHO: CARRUSEL DE TARJETAS */}
          <div className="w-[55%] flex items-center overflow-hidden pl-10">
            <motion.div
              className="flex gap-6"
              initial={false}
              animate={{
                x: `calc(-${currentIndex * 320}px - ${currentIndex * 24}px)`,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {MOCK_DESTINATIONS.map((dest, index) => {
                const isActive = index === currentIndex;
                return (
                  <motion.div
                    key={dest.id}
                    animate={{
                      scale: isActive ? 1 : 0.85,
                      opacity: isActive ? 1 : 0.5,
                    }}
                    transition={{ duration: 0.4 }}
                    className="w-[320px] h-[480px] shrink-0 rounded-liquid-lg overflow-hidden relative cursor-pointer group shadow-glass border border-white/20"
                    onClick={() => setCurrentIndex(index)}
                  >
                    <img
                      src={dest.cardImage}
                      alt={dest.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-8">
                      <span className="text-xs font-bold tracking-widest text-rodeo-cream/80 uppercase mb-2 block">
                        {dest.subtitle}
                      </span>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                        {dest.title}
                      </h3>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </main>

        {/* CONTROLES INFERIORES */}
        <footer className="absolute bottom-10 w-full px-12 md:px-24 flex justify-between items-end z-20">
          <div className="flex gap-4">
            <button
              onClick={handlePrev}
              className="w-12 h-12 rounded-full border border-white/30 bg-white/5 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={handleNext}
              className="w-12 h-12 rounded-full border border-white/30 bg-white/5 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          <div className="text-6xl md:text-8xl font-black text-white/20 tracking-tighter tabular-nums leading-none">
            0{currentIndex + 1}
          </div>
        </footer>

        {/* INDICADOR DE SCROLL */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown size={20} className="text-white/40" />
          </motion.div>
          <span className="text-[10px] tracking-widest text-white/30 uppercase">
            Deslizá para conocer más
          </span>
        </div>
      </section>

      {/* ===================== SECCIÓN 2: ALERTA OFICIAL ===================== */}
      {MOCK_ALERTA_ACTIVA.activa && (
        <section className={`${alertaColor.bg} px-6 py-4`}>
          <div className="max-w-4xl mx-auto flex items-start gap-4">
            <AlertTriangle size={20} className={`${alertaColor.icono} shrink-0 mt-0.5`} />
            <div className="flex-1">
              <p className="text-sm text-rodeo-cream/90 leading-relaxed">
                {MOCK_ALERTA_ACTIVA.texto}
              </p>
            </div>
            <span
              className={`${alertaColor.badge} text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full shrink-0`}
            >
              {MOCK_ALERTA_ACTIVA.tipo}
            </span>
          </div>
        </section>
      )}

      {/* ===================== SECCIÓN 3: ACCESO RÁPIDO ===================== */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40 mb-5">
            Acceso Rápido
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ACCESO_RAPIDO.map((item) => {
              const Icono = item.icono;
              return (
                <Link key={item.href} href={item.href}>
                  <div className="liquid-panel p-5 flex flex-col gap-3 hover:bg-white/10 transition-colors cursor-pointer h-full">
                    <Icono size={28} className={item.colorIcono} />
                    <div>
                      <p className="text-sm font-bold text-white">{item.titulo}</p>
                      <p className="text-xs text-rodeo-cream/40 mt-0.5 leading-relaxed">
                        {item.descripcion}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== SECCIÓN 4: SOBRE MATCHPRO ===================== */}
      <section className="px-6 py-12 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="mb-2">
            <h2 className="text-3xl font-black uppercase tracking-tight text-white">
              Reserva tu cancha, juega tu partido
            </h2>
            <p className="text-sm text-rodeo-cream/40 mt-1">
              La plataforma de deportes más confiable de Catamarca
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 mt-8">
            <div className="flex-1 flex flex-col gap-5">
              <p className="text-sm text-rodeo-cream/70 leading-relaxed">
                ElPiqueApp es la plataforma de reservas deportivas más completa de Catamarca.
                Conectamos jugadores con los mejores complejos deportivos de la región.
                Desde fútbol, padel y tenis hasta vóley y básquetbol, encuentra la cancha
                perfecta para tu próximo partido. Con más de 12 complejos afiliados y
                disponibilidad 24/7, reservar tu cancha nunca fue tan fácil.
              </p>
              <p className="text-sm text-rodeo-cream/70 leading-relaxed">
                Nuestros complejos ofrecen instalaciones de primera categoría con vestuarios,
                estacionamiento y servicios. Reserva a través de WhatsApp con confirmación
                instantánea. Si eres dueño de un complejo, gestiona tus canchas, disponibilidad
                y reservas desde nuestro dashboard intuitivo. Únete a cientos de jugadores
                y propietarios que ya confían en ElPiqueApp.
              </p>
            </div>

            <div className="md:w-64 shrink-0">
              <div className="rounded-liquid-lg overflow-hidden h-64 md:h-full min-h-48">
                <img
                  src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop"
                  alt="Naturaleza de montaña en El Rodeo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== SECCIÓN 5: MATCHPRO EN NÚMEROS ===================== */}
      <section className="px-6 py-12 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40 mb-8">
            ElPiqueApp en Números
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {MOCK_STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col gap-1"
              >
                <div className="text-4xl font-black text-white leading-none">
                  {stat.valor}
                  {stat.unidad && (
                    <span className="text-2xl text-rodeo-cream/40 ml-1">{stat.unidad}</span>
                  )}
                </div>
                <p className="text-xs text-rodeo-cream/50 leading-relaxed">
                  {stat.descripcion}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== SECCIÓN 6: COMPLEJOS DESTACADOS ===================== */}
      <section className="py-12 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black uppercase tracking-tight text-white px-6 mb-6">
            Complejos Destacados
          </h2>
          <div className="flex gap-4 overflow-x-auto px-6 pb-4 snap-x snap-mandatory scroll-smooth scrollbar-thin">
            {MOCK_LUGARES_DESTACADOS.map((lugar, i) => (
              <Link
                key={i}
                href={`/complejo/${lugar.slug}`}
                className="w-64 shrink-0 liquid-panel overflow-hidden hover:bg-white/10 transition-colors"
              >
                <div className="h-40 overflow-hidden">
                  <img
                    src={lugar.imagen}
                    alt={lugar.nombre}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-rodeo-cream/40 mb-1">
                    {lugar.categoria}
                  </p>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    {lugar.nombre}
                  </h3>
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

      {/* ===================== SECCIÓN 7: ¿POR QUÉ MATCHPRO? ===================== */}
      <section className="px-6 py-12 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Star size={20} className="text-rodeo-lime" />
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
              ¿Por qué ElPiqueApp?
            </h2>
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
                  <p className="text-xs text-rodeo-cream/60 leading-relaxed">
                    {opcion.descripcion}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== SECCIÓN 8: FOOTER ===================== */}
      <footer className="border-t border-white/10 px-6 py-12 bg-black/20">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <img src="/assets/logo-main.png" alt="ElPiqueApp" className="h-16 w-auto object-contain opacity-80" />
          <p className="text-xs text-rodeo-cream/30 tracking-widest uppercase text-center">
            Reserva canchas deportivas en Catamarca · 24/7 disponible
          </p>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {[
              { href: "/explorar", label: "Explorar" },
              { href: "/mapa", label: "Mapa" },
              { href: "/perfil", label: "Mi Perfil" },
              { href: "/dueno/dashboard", label: "Panel Dueño" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-rodeo-cream/30 hover:text-rodeo-cream/70 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <p className="text-[10px] text-rodeo-cream/20 text-center">
            © 2025 ElPiqueApp · Plataforma de Reservas Deportivas Catamarca
          </p>
        </div>
      </footer>
    </div>
  );
}
