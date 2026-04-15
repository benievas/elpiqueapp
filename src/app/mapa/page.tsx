"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  MapPin,
  Clock,
  Phone,
  Star,
  Users,
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

  const complejosFiltrados =
    filtroActivo === "todos"
      ? MOCK_COMPLEJOS
      : MOCK_COMPLEJOS.filter(
          (c) => c.deporte.toLowerCase() === filtroActivo.toLowerCase()
        );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-rodeo-dark text-rodeo-cream font-sans">
      {/* FONDO MAPA */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2000&auto=format&fit=crop"
          alt="Mapa de Catamarca"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rodeo-dark/40 to-rodeo-dark/80" />
      </div>

      {/* CONTENIDO */}
      <div className="relative z-10 h-full flex flex-col">
        {/* HEADER */}
        <header className="bg-rodeo-dark/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="w-10 h-10 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 flex items-center justify-center transition-all">
              <ChevronLeft className="text-rodeo-cream" size={20} />
            </Link>
            <div className="flex-1 ml-6">
              <h1 className="text-lg font-black tracking-widest uppercase text-rodeo-cream">
                Mapa de Complejos Deportivos
              </h1>
              <p className="text-xs text-rodeo-cream/50 mt-1">
                Ubica y reserva tu cancha ideal en Catamarca
              </p>
            </div>
          </div>
        </header>

        {/* FILTROS */}
        <div className="bg-rodeo-dark/60 backdrop-blur-md border-b border-white/10 px-6 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {FILTROS.map((filtro) => (
                <button
                  key={filtro.id}
                  onClick={() => setFiltroActivo(filtro.id)}
                  className={`px-4 py-2 rounded-liquid text-sm font-bold transition-all whitespace-nowrap ${
                    filtroActivo === filtro.id
                      ? "bg-rodeo-terracotta text-rodeo-dark border-rodeo-terracotta"
                      : "bg-white/5 border border-white/20 text-rodeo-cream hover:bg-white/10"
                  }`}
                >
                  {filtro.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MAPA + LISTA */}
        <div className="flex-1 flex overflow-hidden">
          {/* ÁREA DEL MAPA (izquierda) */}
          <div className="flex-1 relative">
            <MapaLeaflet
              complejos={complejosFiltrados}
              filtroDeporte={filtroActivo}
              onSelectComplejo={setComplejoSeleccionado}
            />
          </div>

          {/* PANEL LATERAL (derecha) */}
          <div className="w-96 bg-rodeo-dark/90 backdrop-blur-md border-l border-white/10 overflow-y-auto">
            {complejoSeleccionado && (
              <motion.div
                key={complejoSeleccionado.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 flex flex-col gap-6"
              >
                {/* TITULO */}
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-rodeo-terracotta/20 border border-rodeo-terracotta/50 text-rodeo-terracotta text-xs font-bold mb-2">
                    {complejoSeleccionado.deporte}
                  </span>
                  <h2 className="text-2xl font-black text-white">
                    {complejoSeleccionado.nombre}
                  </h2>
                  <p className="text-xs text-rodeo-cream/50 mt-1">
                    {complejoSeleccionado.descripcion}
                  </p>
                </div>

                {/* INFO */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock size={16} className="text-rodeo-terracotta" />
                    <div>
                      <p className="text-xs text-rodeo-cream/60">Horario</p>
                      <p className="text-white font-bold">
                        {complejoSeleccionado.horario}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={16} className="text-rodeo-terracotta" />
                    <div>
                      <p className="text-xs text-rodeo-cream/60">Teléfono</p>
                      <a
                        href={`tel:${complejoSeleccionado.telefono}`}
                        className="text-white font-bold hover:text-rodeo-terracotta"
                      >
                        {complejoSeleccionado.telefono}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <MapPin size={16} className="text-rodeo-terracotta" />
                    <div>
                      <p className="text-xs text-rodeo-cream/60">Distancia</p>
                      <p className="text-white font-bold">
                        {complejoSeleccionado.distancia}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Star size={16} className="text-yellow-400 fill-yellow-400" />
                    <div>
                      <p className="text-xs text-rodeo-cream/60">Calificación</p>
                      <p className="text-white font-bold">
                        {complejoSeleccionado.rating}/5.0
                      </p>
                    </div>
                  </div>
                </div>

                {/* BOTONES */}
                <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                  <Link
                    href={`/complejo/${complejoSeleccionado.slug}`}
                    className="w-full py-3 rounded-liquid bg-rodeo-terracotta text-rodeo-dark font-bold text-center hover:bg-rodeo-terracotta/90 transition-all"
                  >
                    Ver Canchas y Reservar
                  </Link>

                  <a
                    href={`https://wa.me/5493834431234?text=Hola!%20Tengo%20una%20consulta%20sobre%20${complejoSeleccionado.nombre}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-liquid bg-white/10 border border-white/20 text-white font-bold text-center hover:bg-white/20 transition-all"
                  >
                    Contactar por WhatsApp
                  </a>
                </div>

                {/* BADGE ABIERTO */}
                {complejoSeleccionado.abierto && (
                  <div className="px-3 py-2 rounded-liquid bg-green-500/20 border border-green-400/40 text-green-400 text-xs font-bold text-center">
                    ✓ Abierto Ahora
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
