"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Search,
  X,
  Star,
  MapPin,
  Users,
  Clock,
} from "lucide-react";
import Link from "next/link";

// --- TIPOS ---
type Complejo = typeof MOCK_COMPLEJOS[number];

// --- DATOS MOCK ---
const MOCK_COMPLEJOS = [
  {
    id: 1,
    nombre: "Sportivo Central",
    deporte: "Fútbol",
    ubicacion: "Av. Libertad 1234",
    rating: 4.8,
    reseñas: 312,
    imagen:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600",
    slug: "sportivo-central",
    canchas: 8,
    abierto: true,
  },
  {
    id: 2,
    nombre: "Padel Club Elite",
    deporte: "Padel",
    ubicacion: "Calle Rivadavia 567",
    rating: 4.9,
    reseñas: 189,
    imagen:
      "https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=600",
    slug: "padel-club-elite",
    canchas: 6,
    abierto: true,
  },
  {
    id: 3,
    nombre: "Arena Vóley Catamarca",
    deporte: "Vóley",
    ubicacion: "Calle San Martín 890",
    rating: 4.7,
    reseñas: 98,
    imagen:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600",
    slug: "arena-voley",
    canchas: 4,
    abierto: true,
  },
  {
    id: 4,
    nombre: "Tenis Club Catamarca",
    deporte: "Tenis",
    ubicacion: "Parque Municipal",
    rating: 4.6,
    reseñas: 156,
    imagen:
      "https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=600",
    slug: "tenis-club",
    canchas: 5,
    abierto: true,
  },
  {
    id: 5,
    nombre: "Básquet Arena",
    deporte: "Básquetbol",
    ubicacion: "Centro Deportivo",
    rating: 4.5,
    reseñas: 124,
    imagen:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600",
    slug: "basquet-arena",
    canchas: 3,
    abierto: true,
  },
];

const DEPORTES = [
  "Todos",
  "Fútbol",
  "Padel",
  "Vóley",
  "Tenis",
  "Básquetbol",
];

function Estrellas({ cantidad }: { cantidad: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={
            i <= cantidad ? "text-yellow-400 fill-yellow-400" : "text-white/20"
          }
        />
      ))}
    </div>
  );
}

export default function ExplorarPage() {
  const [busqueda, setBusqueda] = useState("");
  const [deporte, setDeporte] = useState("Todos");

  // Orden aleatorio que se genera una sola vez (seed por sesión)
  const complejosPermutados = useMemo(() => {
    return [...MOCK_COMPLEJOS].sort(() => Math.random() - 0.5);
  }, []);

  const filtrados = useMemo(() => {
    return complejosPermutados.filter((c) => {
      const coincideBusqueda = c.nombre
        .toLowerCase()
        .includes(busqueda.toLowerCase());
      const coincideDeporte = deporte === "Todos" || c.deporte === deporte;
      return coincideBusqueda && coincideDeporte;
    });
  }, [busqueda, deporte, complejosPermutados]);

  return (
    <div className="relative min-h-screen bg-rodeo-dark text-rodeo-cream font-sans overflow-x-hidden">
      {/* FONDO */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-rodeo-dark via-rodeo-brown to-rodeo-dark" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-rodeo-lime/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rodeo-lime/5 rounded-full blur-3xl" />
      </div>

      {/* CONTENIDO */}
      <div className="relative z-10 min-h-screen pb-20">
        {/* HEADER */}
        <header className="sticky top-0 z-30 p-6 flex items-center justify-between bg-rodeo-dark/60 backdrop-blur-md border-b border-white/5">
          <Link
            href="/"
            className="w-10 h-10 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          >
            <ChevronLeft className="text-rodeo-cream" size={20} />
          </Link>
          <h1 className="text-xl font-black text-rodeo-cream tracking-wide">
            Explorar Complejos
          </h1>
          <div className="w-10" />
        </header>

        {/* BÚSQUEDA */}
        <div className="px-6 py-6 max-w-4xl mx-auto">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-rodeo-cream/40"
            />
            <input
              type="text"
              placeholder="Buscar complejo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-liquid pl-12 pr-4 py-3 text-rodeo-cream placeholder-rodeo-cream/30 focus:outline-none focus:border-rodeo-lime/50 transition-all"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-rodeo-cream/40 hover:text-rodeo-cream"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* FILTROS POR DEPORTE */}
        <div className="px-6 py-4 max-w-4xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/50 mb-3">
            Deporte
          </p>
          <div className="flex gap-2 flex-wrap">
            {DEPORTES.map((d) => (
              <button
                key={d}
                onClick={() => setDeporte(d)}
                className={`px-4 py-2 rounded-liquid text-sm font-bold tracking-wide transition-all ${
                  deporte === d
                    ? "bg-rodeo-lime text-rodeo-dark border-rodeo-lime"
                    : "bg-white/5 border border-white/10 text-rodeo-cream hover:bg-white/10"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* GRID DE COMPLEJOS */}
        <div className="px-6 py-6 max-w-4xl mx-auto">
          {filtrados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-rodeo-cream/50 text-sm">
                No encontramos complejos que coincidan con tu búsqueda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtrados.map((complejo, i) => (
                <motion.div
                  key={complejo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Link
                    href={`/complejo/${complejo.slug}`}
                    className="liquid-panel overflow-hidden hover:bg-white/10 transition-all group block"
                  >
                    {/* Imagen */}
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={complejo.imagen}
                        alt={complejo.nombre}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-rodeo-dark via-transparent to-transparent" />

                      {/* Badge deporte */}
                      <div className="absolute top-4 right-4">
                        <span className="inline-block px-3 py-1 rounded-full bg-rodeo-lime/20 border border-rodeo-lime/50 text-rodeo-lime text-xs font-bold">
                          {complejo.deporte}
                        </span>
                      </div>

                      {/* Badge abierto */}
                      <div className="absolute bottom-4 left-4">
                        <span className="inline-block px-3 py-1 rounded-full bg-green-500/20 border border-green-400/40 text-green-400 text-xs font-bold">
                          Abierto
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight">
                          {complejo.nombre}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-rodeo-cream/50 mt-1">
                          <MapPin size={12} />
                          {complejo.ubicacion}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1">
                          <Estrellas cantidad={Math.round(complejo.rating)} />
                          <span className="text-xs font-bold text-white ml-1">
                            {complejo.rating}
                          </span>
                          <span className="text-xs text-rodeo-cream/40">
                            ({complejo.reseñas})
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-rodeo-cream/50">
                          <Users size={12} />
                          {complejo.canchas} canchas
                        </div>
                      </div>

                      <button className="w-full py-2 rounded-liquid bg-rodeo-lime/20 border border-rodeo-lime/50 text-rodeo-lime text-xs font-bold hover:bg-rodeo-lime/30 transition-all">
                        Ver Canchas →
                      </button>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
