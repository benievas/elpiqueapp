"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  MapPin,
  Clock,
  Phone,
  Star,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

// Componente Leaflet dinámico
const MapaLeaflet = dynamic(() => import("@/components/MapaLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-rodeo-dark">
      <div className="text-rodeo-cream">Cargando mapa...</div>
    </div>
  ),
});

// --- DATOS MOCK ---
const MOCK_COMPLEJOS = [
  {
    id: 1,
    nombre: "Sportivo Central",
    deporte: "Fútbol",
    descripcion: "8 canchas de fútbol sintético de primera calidad",
    horario: "06:00 - 23:00",
    telefono: "+54 383 443-1234",
    abierto: true,
    distancia: "1.2 km",
    rating: 4.8,
    lat: -28.4695,
    lng: -65.4089,
    slug: "sportivo-central",
  },
  {
    id: 2,
    nombre: "Padel Club Elite",
    deporte: "Padel",
    descripcion: "6 canchas de padel premium con iluminación LED",
    horario: "07:00 - 22:00",
    telefono: "+54 383 443-5678",
    abierto: true,
    distancia: "2.3 km",
    rating: 4.9,
    lat: -28.4720,
    lng: -65.4050,
    slug: "padel-club-elite",
  },
  {
    id: 3,
    nombre: "Arena Vóley Catamarca",
    deporte: "Vóley",
    descripcion: "4 canchas profesionales para vóley y básquetbol",
    horario: "08:00 - 22:00",
    telefono: "+54 383 443-9999",
    abierto: true,
    distancia: "1.8 km",
    rating: 4.7,
    lat: -28.4710,
    lng: -65.4100,
    slug: "arena-voley",
  },
  {
    id: 4,
    nombre: "Tenis Club Catamarca",
    deporte: "Tenis",
    descripcion: "5 canchas de tenis con césped y polvo de ladrillo",
    horario: "07:00 - 20:00",
    telefono: "+54 383 443-4567",
    abierto: true,
    distancia: "3.1 km",
    rating: 4.6,
    lat: -28.4680,
    lng: -65.4120,
    slug: "tenis-club",
  },
  {
    id: 5,
    nombre: "Básquet Arena",
    deporte: "Básquetbol",
    descripcion: "3 canchas de básquetbol con piso profesional",
    horario: "08:00 - 21:00",
    telefono: "+54 383 443-7890",
    abierto: true,
    distancia: "2.5 km",
    rating: 4.5,
    lat: -28.4700,
    lng: -65.4070,
    slug: "basquet-arena",
  },
];

const FILTROS = [
  { id: "todos", label: "Todos los deportes" },
  { id: "futbol", label: "Fútbol" },
  { id: "padel", label: "Padel" },
  { id: "voley", label: "Vóley" },
  { id: "tenis", label: "Tenis" },
  { id: "basquet", label: "Básquetbol" },
];

export default function MapaPage() {
  const [filtroActivo, setFiltroActivo] = useState("todos");
  const [complejoSeleccionado, setComplejoSeleccionado] = useState<typeof MOCK_COMPLEJOS[0] | null>(
    MOCK_COMPLEJOS[0]
  );
  // Panel móvil: "peek" (visible parcial), "full" (expandido), "collapsed" (solo handle)
  const [panelState, setPanelState] = useState<"peek" | "full" | "collapsed">("peek");

  const complejosFiltrados =
    filtroActivo === "todos"
      ? MOCK_COMPLEJOS
      : MOCK_COMPLEJOS.filter(
          (c) => c.deporte.toLowerCase() === filtroActivo.toLowerCase()
        );

  const handleSelectComplejo = (c: typeof MOCK_COMPLEJOS[0]) => {
    setComplejoSeleccionado(c);
    setPanelState("peek");
  };

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-rodeo-dark text-rodeo-cream font-sans">

      {/* ── DESKTOP LAYOUT ──────────────────────────────── */}
      <div className="hidden md:flex h-full flex-col">
        {/* Header desktop */}
        <header
          style={{
            background: "rgba(4,13,7,0.85)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
          className="px-6 py-4"
        >
          <div className="max-w-6xl mx-auto flex items-center gap-6">
            <Link href="/" className="w-10 h-10 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 flex items-center justify-center transition-all">
              <ChevronLeft className="text-rodeo-cream" size={20} />
            </Link>
            <div>
              <h1 className="text-lg font-black tracking-widest uppercase text-rodeo-cream">Mapa de Complejos</h1>
              <p className="text-xs text-rodeo-cream/50 mt-0.5">Catamarca · {complejosFiltrados.length} complejos</p>
            </div>
            {/* Filtros desktop */}
            <div className="flex gap-2 overflow-x-auto ml-auto no-scrollbar">
              {FILTROS.map((filtro) => (
                <button
                  key={filtro.id}
                  onClick={() => setFiltroActivo(filtro.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    filtroActivo === filtro.id
                      ? "bg-rodeo-lime text-rodeo-dark"
                      : "bg-white/8 border border-white/15 text-rodeo-cream hover:bg-white/15"
                  }`}
                >
                  {filtro.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Mapa + Panel */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 relative">
            <MapaLeaflet complejos={complejosFiltrados} filtroDeporte={filtroActivo} onSelectComplejo={setComplejoSeleccionado} selectedId={complejoSeleccionado?.id} />
          </div>
          {/* Panel lateral derecho */}
          <div
            style={{
              background: "rgba(4,13,7,0.92)",
              backdropFilter: "blur(40px) saturate(180%)",
              WebkitBackdropFilter: "blur(40px) saturate(180%)",
              borderLeft: "1px solid rgba(255,255,255,0.1)",
            }}
            className="w-96 overflow-y-auto"
          >
            {complejoSeleccionado && (
              <motion.div key={complejoSeleccionado.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 flex flex-col gap-5">
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-rodeo-lime/15 border border-rodeo-lime/30 text-rodeo-lime text-xs font-bold mb-2">{complejoSeleccionado.deporte}</span>
                  <h2 className="text-2xl font-black text-white">{complejoSeleccionado.nombre}</h2>
                  <p className="text-xs text-rodeo-cream/50 mt-1">{complejoSeleccionado.descripcion}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Clock, label: "Horario", value: complejoSeleccionado.horario },
                    { icon: MapPin, label: "Distancia", value: complejoSeleccionado.distancia },
                    { icon: Star, label: "Rating", value: `${complejoSeleccionado.rating}/5.0` },
                    { icon: Phone, label: "Teléfono", value: complejoSeleccionado.telefono },
                  ].map((item) => {
                    const Icono = item.icon;
                    return (
                      <div key={item.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px" }} className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Icono size={13} className="text-rodeo-lime" />
                          <p className="text-[10px] text-rodeo-cream/50 font-medium">{item.label}</p>
                        </div>
                        <p className="text-sm font-bold text-white truncate">{item.value}</p>
                      </div>
                    );
                  })}
                </div>
                {complejoSeleccionado.abierto && (
                  <div style={{ background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)", borderRadius: "12px" }} className="px-4 py-2 text-green-400 text-xs font-bold text-center">✓ Abierto Ahora</div>
                )}
                <div className="flex flex-col gap-3 pt-2 border-t border-white/8">
                  <Link href={`/complejo/${complejoSeleccionado.slug}`} style={{ background: "linear-gradient(135deg, #C8FF00, #A8D800)", borderRadius: "16px", boxShadow: "0 4px 20px rgba(200,255,0,0.3)" }} className="w-full py-3 text-rodeo-dark font-black text-center text-sm">Ver Canchas y Reservar</Link>
                  <a href={`https://wa.me/5493834431234?text=Hola! Consulta sobre ${complejoSeleccionado.nombre}`} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px" }} className="w-full py-3 text-white font-bold text-center text-sm">Contactar por WhatsApp</a>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── MÓVIL LAYOUT ────────────────────────────────── */}
      <div className="flex md:hidden flex-col h-full relative">
        {/* Mapa full-screen como fondo */}
        <div className="absolute inset-0 z-0">
          <MapaLeaflet complejos={complejosFiltrados} filtroDeporte={filtroActivo} onSelectComplejo={handleSelectComplejo} />
        </div>

        {/* Header flotante */}
        <div className="relative z-10 pt-safe">
          <div
            style={{
              background: "rgba(4,13,7,0.75)",
              backdropFilter: "blur(24px) saturate(200%)",
              WebkitBackdropFilter: "blur(24px) saturate(200%)",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            }}
            className="px-4 py-3 flex items-center gap-3"
          >
            <Link href="/" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px" }} className="w-9 h-9 flex items-center justify-center shrink-0">
              <ChevronLeft size={18} className="text-rodeo-cream" />
            </Link>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Mapa de Complejos</p>
              <p className="text-white/40 text-[11px]">{complejosFiltrados.length} complejos en Catamarca</p>
            </div>
          </div>

          {/* Filtros scroll horizontal */}
          <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
            {FILTROS.map((filtro) => (
              <button
                key={filtro.id}
                onClick={() => setFiltroActivo(filtro.id)}
                style={filtroActivo === filtro.id ? {
                  background: "linear-gradient(135deg, #C8FF00, #A8D800)",
                  borderRadius: "20px",
                  boxShadow: "0 2px 12px rgba(200,255,0,0.4)",
                } : {
                  background: "rgba(4,13,7,0.75)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "20px",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
                className={`px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                  filtroActivo === filtro.id ? "text-rodeo-dark" : "text-rodeo-cream"
                }`}
              >
                {filtro.label}
              </button>
            ))}
          </div>
        </div>

        {/* Panel deslizable desde abajo */}
        <AnimatePresence>
          <motion.div
            className="absolute bottom-20 left-0 right-0 z-20"
            initial={{ y: 0 }}
            animate={{
              y: panelState === "collapsed" ? "calc(100% - 60px)"
                : panelState === "peek" ? 0
                : 0,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
          >
            {/* Handle bar */}
            <button
              onClick={() => setPanelState(panelState === "full" ? "peek" : panelState === "peek" ? "collapsed" : "peek")}
              style={{
                background: "rgba(4,13,7,0.75)",
                backdropFilter: "blur(24px) saturate(200%)",
                WebkitBackdropFilter: "blur(24px) saturate(200%)",
                borderTop: "1px solid rgba(255,255,255,0.15)",
                borderTopLeftRadius: "22px",
                borderTopRightRadius: "22px",
                boxShadow: "0 -4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)",
              }}
              className="w-full px-6 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-1 bg-white/25 rounded-full" />
                {complejoSeleccionado && (
                  <span className="text-white/60 text-xs font-medium">{complejoSeleccionado.nombre}</span>
                )}
              </div>
              {panelState === "full" ? <ChevronDown size={16} className="text-white/40" /> : <ChevronUp size={16} className="text-white/40" />}
            </button>

            {/* Contenido del panel */}
            <div
              style={{
                background: "rgba(4,13,7,0.92)",
                backdropFilter: "blur(40px) saturate(180%)",
                WebkitBackdropFilter: "blur(40px) saturate(180%)",
                maxHeight: panelState === "full" ? "65vh" : "45vh",
              }}
              className="overflow-y-auto transition-all duration-300"
            >
              {/* Detalle del complejo seleccionado */}
              {complejoSeleccionado && (
                <div className="px-4 pt-2 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <span style={{ background: "rgba(200,255,0,0.12)", border: "1px solid rgba(200,255,0,0.25)", borderRadius: "8px" }} className="inline-block px-2 py-0.5 text-rodeo-lime text-[10px] font-bold mb-1">{complejoSeleccionado.deporte}</span>
                      <h2 className="text-white font-black text-lg leading-tight">{complejoSeleccionado.nombre}</h2>
                      <p className="text-white/50 text-xs mt-0.5">{complejoSeleccionado.descripcion}</p>
                    </div>
                    {complejoSeleccionado.abierto && (
                      <span style={{ background: "rgba(0,230,118,0.12)", border: "1px solid rgba(0,230,118,0.3)", borderRadius: "10px" }} className="ml-3 shrink-0 px-2 py-1 text-green-400 text-[10px] font-bold">Abierto</span>
                    )}
                  </div>

                  {/* Info badges */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { icon: Clock, label: "Horario", value: complejoSeleccionado.horario },
                      { icon: MapPin, label: "Distancia", value: complejoSeleccionado.distancia },
                      { icon: Star, label: "Rating", value: `${complejoSeleccionado.rating}/5.0` },
                      { icon: Phone, label: "Teléfono", value: complejoSeleccionado.telefono },
                    ].map((item) => {
                      const Icono = item.icon;
                      return (
                        <div key={item.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px" }} className="p-2.5">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Icono size={11} className="text-rodeo-lime" />
                            <span className="text-[9px] text-white/40 font-medium">{item.label}</span>
                          </div>
                          <p className="text-xs font-bold text-white truncate">{item.value}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Botones CTA */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/complejo/${complejoSeleccionado.slug}`} style={{ background: "linear-gradient(135deg, #C8FF00, #A8D800)", borderRadius: "14px", boxShadow: "0 4px 16px rgba(200,255,0,0.3)" }} className="py-3 text-rodeo-dark font-black text-center text-xs">Ver y Reservar</Link>
                    <a href={`https://wa.me/5493834431234?text=Hola! Consulta sobre ${complejoSeleccionado.nombre}`} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "14px" }} className="py-3 text-white font-bold text-center text-xs">WhatsApp</a>
                  </div>
                </div>
              )}

              {/* Lista de complejos */}
              <div className="px-4 pb-4">
                <p className="text-[10px] font-bold tracking-widest uppercase text-white/30 mb-3 mt-2">Todos los complejos</p>
                <div className="space-y-2">
                  {complejosFiltrados.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectComplejo(c)}
                      style={complejoSeleccionado?.id === c.id ? {
                        background: "rgba(200,255,0,0.08)",
                        border: "1px solid rgba(200,255,0,0.25)",
                        borderRadius: "14px",
                      } : {
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "14px",
                      }}
                      className="w-full flex items-center gap-3 p-3 text-left transition-all"
                    >
                      <div style={{ background: complejoSeleccionado?.id === c.id ? "rgba(200,255,0,0.15)" : "rgba(255,255,255,0.06)", borderRadius: "10px" }} className="w-9 h-9 flex items-center justify-center shrink-0">
                        <MapPin size={14} className={complejoSeleccionado?.id === c.id ? "text-rodeo-lime" : "text-white/40"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${complejoSeleccionado?.id === c.id ? "text-rodeo-lime" : "text-white"}`}>{c.nombre}</p>
                        <p className="text-[10px] text-white/40 truncate">{c.deporte} · {c.distancia}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star size={10} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-white/60">{c.rating}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
