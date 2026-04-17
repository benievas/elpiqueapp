"use client";
export const dynamic = 'force-dynamic';

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import nextDynamic from "next/dynamic";
import { ChevronLeft, MapPin, Clock, Phone, Star, X } from "lucide-react";
import Link from "next/link";
import CityBanner from "@/components/CityBanner";

const MapaLeaflet = nextDynamic(() => import("@/components/MapaLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-rodeo-dark">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-rodeo-lime/30 border-t-rodeo-lime animate-spin" />
        <span className="text-rodeo-cream/50 text-sm">Cargando mapa...</span>
      </div>
    </div>
  ),
});

const MOCK_COMPLEJOS = [
  { id: 1, nombre: "Sportivo Central", deporte: "Fútbol", descripcion: "8 canchas de fútbol sintético de primera calidad", horario: "06:00 - 23:00", telefono: "+54 383 443-1234", abierto: true, distancia: "1.2 km", rating: 4.8, lat: -28.4685, lng: -65.7872, slug: "sportivo-central" },
  { id: 2, nombre: "Padel Club Elite", deporte: "Padel", descripcion: "6 canchas de padel premium con iluminación LED", horario: "07:00 - 22:00", telefono: "+54 383 443-5678", abierto: true, distancia: "2.3 km", rating: 4.9, lat: -28.4720, lng: -65.7810, slug: "padel-club-elite" },
  { id: 3, nombre: "Arena Vóley Catamarca", deporte: "Vóley", descripcion: "4 canchas profesionales para vóley y básquetbol", horario: "08:00 - 22:00", telefono: "+54 383 443-9999", abierto: true, distancia: "1.8 km", rating: 4.7, lat: -28.4710, lng: -65.7850, slug: "arena-voley" },
  { id: 4, nombre: "Tenis Club Catamarca", deporte: "Tenis", descripcion: "5 canchas de tenis con césped y polvo de ladrillo", horario: "07:00 - 20:00", telefono: "+54 383 443-4567", abierto: true, distancia: "3.1 km", rating: 4.6, lat: -28.4668, lng: -65.7825, slug: "tenis-club" },
  { id: 5, nombre: "Básquet Arena", deporte: "Básquetbol", descripcion: "3 canchas de básquetbol con piso profesional", horario: "08:00 - 21:00", telefono: "+54 383 443-7890", abierto: true, distancia: "2.5 km", rating: 4.5, lat: -28.4700, lng: -65.7890, slug: "basquet-arena" },
];

const FILTROS = [
  { id: "todos", label: "Todos" },
  { id: "fútbol", label: "Fútbol" },
  { id: "padel", label: "Padel" },
  { id: "vóley", label: "Vóley" },
  { id: "tenis", label: "Tenis" },
  { id: "básquetbol", label: "Básquetbol" },
];

const DEPORTE_COLORS: Record<string, string> = {
  "fútbol": "#C8FF00", "padel": "#00E5FF", "vóley": "#FF6B35",
  "tenis": "#FFD600", "básquetbol": "#FF4081", "todos": "#C8FF00",
};

type SheetState = "collapsed" | "mid" | "full";

const SHEET_HEIGHTS: Record<SheetState, string> = {
  collapsed: "80px",
  mid: "52vh",
  full: "88vh",
};

export default function MapaPage() {
  const [filtroActivo, setFiltroActivo] = useState("todos");
  const [complejoSeleccionado, setComplejoSeleccionado] = useState<typeof MOCK_COMPLEJOS[0] | null>(null);
  const [sheetState, setSheetState] = useState<SheetState>("mid");

  const complejosFiltrados = filtroActivo === "todos"
    ? MOCK_COMPLEJOS
    : MOCK_COMPLEJOS.filter((c) => c.deporte.toLowerCase() === filtroActivo.toLowerCase());

  const handleSelectComplejo = useCallback((complejo: typeof MOCK_COMPLEJOS[0]) => {
    setComplejoSeleccionado(complejo);
    setSheetState("mid");
  }, []);

  const accentColor = DEPORTE_COLORS[complejoSeleccionado?.deporte.toLowerCase() || "todos"] || "#C8FF00";

  const glassBg = {
    background: "linear-gradient(160deg, rgba(10,22,12,0.97) 0%, rgba(4,13,7,0.99) 100%)",
    backdropFilter: "blur(48px) saturate(200%)",
    WebkitBackdropFilter: "blur(48px) saturate(200%)",
  } as React.CSSProperties;

  return (
    <div className="relative w-screen h-screen bg-rodeo-dark text-rodeo-cream font-sans">

      {/* ─── MAPA: ocupa toda la pantalla ─── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <MapaLeaflet
          complejos={complejosFiltrados}
          filtroDeporte={filtroActivo}
          onSelectComplejo={handleSelectComplejo}
          selectedId={complejoSeleccionado?.id ?? null}
        />
      </div>

      {/* ─── HEADER flotante (ciudad + filtros en columna) ─── */}
      <header
        className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 pb-3 md:pr-[336px] flex flex-col gap-2"
        style={{ background: "linear-gradient(180deg, rgba(4,13,7,0.92) 0%, rgba(4,13,7,0.6) 80%, transparent 100%)" }}
      >
        {/* Fila 1: back + ciudad */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <ChevronLeft size={18} className="text-white" />
          </Link>
          <div
            className="flex-1 flex items-center justify-between px-3 py-2 rounded-[14px]"
            style={{ background: "rgba(4,13,7,0.75)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <CityBanner />
            <span className="text-xs text-rodeo-cream/40 ml-2 shrink-0">{complejosFiltrados.length} complejos</span>
          </div>
        </div>

        {/* Fila 2: filtros — siempre en la misma columna, sin solapamiento */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {FILTROS.map((f) => {
          const isActive = filtroActivo === f.id;
          const color = DEPORTE_COLORS[f.id] || "#C8FF00";
          return (
            <button
              key={f.id}
              onClick={() => { setFiltroActivo(f.id); setComplejoSeleccionado(null); }}
              className="shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: isActive ? color : "rgba(4,13,7,0.78)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: `1px solid ${isActive ? color : "rgba(255,255,255,0.15)"}`,
                color: isActive ? "#040D07" : "rgba(232,240,228,0.75)",
                boxShadow: isActive ? `0 0 16px ${color}55` : "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              {f.label}
            </button>
          );
        })}
        </div>
      </header>

      {/* ─── MOBILE: BOTTOM SHEET ─── */}
      <motion.div
        className="absolute left-0 right-0 bottom-0 z-30 md:hidden"
        animate={{ height: SHEET_HEIGHTS[sheetState] }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.08}
        onDragEnd={(_, info) => {
          if (info.offset.y > 70) setSheetState(sheetState === "full" ? "mid" : "collapsed");
          else if (info.offset.y < -70) setSheetState(sheetState === "collapsed" ? "mid" : "full");
        }}
      >
        <div
          className="h-full flex flex-col overflow-hidden"
          style={{
            ...glassBg,
            borderTopLeftRadius: "28px",
            borderTopRightRadius: "28px",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
            borderRight: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 -8px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.14)",
          }}
        >
          {/* Handle */}
          <div
            className="flex flex-col items-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
            onClick={() => setSheetState(sheetState === "collapsed" ? "mid" : sheetState === "mid" ? "full" : "mid")}
          >
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24">
            {!complejoSeleccionado ? (
              /* Lista */
              <div className="space-y-2 pt-1">
                <p className="text-xs text-rodeo-cream/40 font-bold uppercase tracking-wider mb-3">
                  {complejosFiltrados.length} complejos · tocá un pin o seleccioná
                </p>
                {complejosFiltrados.map((c) => {
                  const color = DEPORTE_COLORS[c.deporte.toLowerCase()] || "#C8FF00";
                  return (
                    <motion.button
                      key={c.id}
                      onClick={() => handleSelectComplejo(c)}
                      whileTap={{ scale: 0.97 }}
                      className="w-full flex items-center gap-3 p-3 rounded-[18px] text-left transition-all"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                        style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
                        <MapPin size={16} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{c.nombre}</p>
                        <p className="text-xs text-rodeo-cream/45">{c.deporte} · {c.distancia} · ⭐ {c.rating}</p>
                      </div>
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: c.abierto ? "#00E676" : "#FF4040", boxShadow: c.abierto ? "0 0 6px #00E676" : "none" }}
                      />
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              /* Detalle */
              <AnimatePresence mode="wait">
                <motion.div
                  key={complejoSeleccionado.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 pt-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-2"
                        style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30`, color: accentColor }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
                        {complejoSeleccionado.deporte}
                      </span>
                      <h2 className="text-xl font-black text-white leading-tight">{complejoSeleccionado.nombre}</h2>
                      <p className="text-xs text-rodeo-cream/50 mt-1">{complejoSeleccionado.descripcion}</p>
                    </div>
                    <button
                      onClick={() => setComplejoSeleccionado(null)}
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                    >
                      <X size={14} className="text-white/60" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { Icon: Clock, label: "Horario", value: complejoSeleccionado.horario },
                      { Icon: Star, label: "Calificación", value: `${complejoSeleccionado.rating}/5.0` },
                      { Icon: MapPin, label: "Distancia", value: complejoSeleccionado.distancia },
                      { Icon: Phone, label: "Teléfono", value: complejoSeleccionado.telefono },
                    ].map(({ Icon, label, value }) => (
                      <div key={label} className="flex items-start gap-2 p-3 rounded-[14px]"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <Icon size={13} style={{ color: accentColor, marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <p className="text-[10px] text-rodeo-cream/38">{label}</p>
                          <p className="text-xs font-bold text-white">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-[12px]"
                    style={{
                      background: complejoSeleccionado.abierto ? "rgba(0,230,118,0.1)" : "rgba(255,64,64,0.1)",
                      border: `1px solid ${complejoSeleccionado.abierto ? "rgba(0,230,118,0.25)" : "rgba(255,64,64,0.25)"}`,
                    }}
                  >
                    <div className="w-2 h-2 rounded-full"
                      style={{ background: complejoSeleccionado.abierto ? "#00E676" : "#FF4040", boxShadow: complejoSeleccionado.abierto ? "0 0 6px #00E676" : "none" }} />
                    <span className="text-xs font-bold"
                      style={{ color: complejoSeleccionado.abierto ? "#00E676" : "#FF4040" }}>
                      {complejoSeleccionado.abierto ? "Abierto ahora" : "Cerrado"}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/complejo/${complejoSeleccionado.slug}`}
                      className="flex-1 py-3.5 rounded-[18px] text-sm font-black text-center"
                      style={{ background: accentColor, color: "#040D07", boxShadow: `0 4px 20px ${accentColor}40` }}
                    >
                      Ver canchas y reservar
                    </Link>
                    <a
                      href={`https://wa.me/5493834431234?text=${encodeURIComponent("Hola! Consulta sobre " + complejoSeleccionado.nombre)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-14 py-3.5 rounded-[18px] flex items-center justify-center"
                      style={{ background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)" }}
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </a>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>

      {/* ─── DESKTOP: SIDEBAR DERECHO ─── */}
      <div
        className="hidden md:block absolute right-0 top-0 bottom-0 w-80 z-10 overflow-y-auto"
        style={{ ...glassBg, borderLeft: "1px solid rgba(255,255,255,0.1)" }}
      >
        {complejoSeleccionado ? (
          <motion.div key={complejoSeleccionado.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-5">
            <button
              onClick={() => setComplejoSeleccionado(null)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-bold transition-all text-rodeo-cream hover:text-white"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}
            >
              <ChevronLeft size={14} /> Todos los complejos
            </button>
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
                style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30`, color: accentColor }}>
                {complejoSeleccionado.deporte}
              </span>
              <h2 className="text-2xl font-black text-white">{complejoSeleccionado.nombre}</h2>
              <p className="text-sm text-rodeo-cream/50 mt-1">{complejoSeleccionado.descripcion}</p>
            </div>
            <div className="space-y-3">
              {[
                { Icon: Clock, label: "Horario", value: complejoSeleccionado.horario },
                { Icon: Phone, label: "Teléfono", value: complejoSeleccionado.telefono },
                { Icon: MapPin, label: "Distancia", value: complejoSeleccionado.distancia },
                { Icon: Star, label: "Calificación", value: `${complejoSeleccionado.rating}/5.0` },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon size={16} style={{ color: accentColor }} />
                  <div>
                    <p className="text-xs text-rodeo-cream/40">{label}</p>
                    <p className="text-sm font-bold text-white">{value}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href={`/complejo/${complejoSeleccionado.slug}`}
              className="block py-3 rounded-[18px] text-sm font-black text-center"
              style={{ background: accentColor, color: "#040D07", boxShadow: `0 4px 20px ${accentColor}40` }}>
              Ver Canchas y Reservar
            </Link>
          </motion.div>
        ) : (
          <div className="p-6 space-y-3">
            <div className="mb-4 mt-16"><CityBanner /></div>
            <p className="text-xs text-rodeo-cream/40 font-bold uppercase tracking-widest mb-2">{complejosFiltrados.length} complejos</p>
            {complejosFiltrados.map((c) => {
              const color = DEPORTE_COLORS[c.deporte.toLowerCase()] || "#C8FF00";
              return (
                <motion.button key={c.id} onClick={() => handleSelectComplejo(c)} whileHover={{ x: 4 }}
                  className="w-full flex items-center gap-3 p-3 rounded-[14px] text-left"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                    style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                    <MapPin size={14} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{c.nombre}</p>
                    <p className="text-xs text-rodeo-cream/40">{c.deporte} · {c.distancia}</p>
                  </div>
                  <span className="text-xs text-white/60">⭐ {c.rating}</span>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
