"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Search, X, Star, MapPin, Users } from "lucide-react";
import Link from "next/link";
import CityBanner from "@/components/CityBanner";
import { useCityContext } from "@/lib/context/CityContext";

// --- TIPOS ---
type Complejo = typeof TODOS_LOS_COMPLEJOS[number];

// --- DATOS MULTI-CIUDAD ---
const TODOS_LOS_COMPLEJOS = [
  // ── CATAMARCA ──────────────────────────────────────────────────────────────
  {
    id: 1,
    nombre: "Sportivo Central",
    deporte: "Fútbol",
    ubicacion: "Av. Libertad 1234",
    ciudad: "Catamarca",
    provincia: "Catamarca",
    lat: -28.4685, lng: -65.7872,
    rating: 4.8, reseñas: 312,
    imagen: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600",
    slug: "sportivo-central", canchas: 8, abierto: true,
  },
  {
    id: 2,
    nombre: "Padel Club Elite",
    deporte: "Padel",
    ubicacion: "Calle Rivadavia 567",
    ciudad: "Catamarca",
    provincia: "Catamarca",
    lat: -28.4720, lng: -65.7810,
    rating: 4.9, reseñas: 189,
    imagen: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=600",
    slug: "padel-club-elite", canchas: 6, abierto: true,
  },
  {
    id: 3,
    nombre: "Arena Vóley Catamarca",
    deporte: "Vóley",
    ubicacion: "Calle San Martín 890",
    ciudad: "Catamarca",
    provincia: "Catamarca",
    lat: -28.4658, lng: -65.7850,
    rating: 4.7, reseñas: 98,
    imagen: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?q=80&w=600",
    slug: "arena-voley", canchas: 4, abierto: true,
  },
  {
    id: 4,
    nombre: "Tenis Club Catamarca",
    deporte: "Tenis",
    ubicacion: "Parque Municipal",
    ciudad: "Catamarca",
    provincia: "Catamarca",
    lat: -28.4740, lng: -65.7830,
    rating: 4.6, reseñas: 156,
    imagen: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=600",
    slug: "tenis-club", canchas: 5, abierto: true,
  },
  {
    id: 5,
    nombre: "Básquet Arena Catamarca",
    deporte: "Básquetbol",
    ubicacion: "Centro Deportivo Municipal",
    ciudad: "Catamarca",
    provincia: "Catamarca",
    lat: -28.4700, lng: -65.7895,
    rating: 4.5, reseñas: 124,
    imagen: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=600",
    slug: "basquet-arena", canchas: 3, abierto: true,
  },
  // ── TUCUMÁN ────────────────────────────────────────────────────────────────
  {
    id: 6,
    nombre: "Fútbol Park Tucumán",
    deporte: "Fútbol",
    ubicacion: "Av. Aconquija 2100",
    ciudad: "Tucumán",
    provincia: "Tucumán",
    lat: -26.8002, lng: -65.2080,
    rating: 4.7, reseñas: 203,
    imagen: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=600",
    slug: "futbol-park-tucuman", canchas: 10, abierto: true,
  },
  {
    id: 7,
    nombre: "Padel Norte Tucumán",
    deporte: "Padel",
    ubicacion: "Calle Corrientes 450",
    ciudad: "Tucumán",
    provincia: "Tucumán",
    lat: -26.8120, lng: -65.2210,
    rating: 4.8, reseñas: 87,
    imagen: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=600",
    slug: "padel-norte-tucuman", canchas: 4, abierto: true,
  },
  {
    id: 8,
    nombre: "Tenis Club del Norte",
    deporte: "Tenis",
    ubicacion: "Parque 9 de Julio",
    ciudad: "Tucumán",
    provincia: "Tucumán",
    lat: -26.8050, lng: -65.2150,
    rating: 4.6, reseñas: 112,
    imagen: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=600",
    slug: "tenis-norte-tucuman", canchas: 6, abierto: true,
  },
  // ── CÓRDOBA ────────────────────────────────────────────────────────────────
  {
    id: 9,
    nombre: "Complejo Deportivo Córdoba",
    deporte: "Fútbol",
    ubicacion: "Av. Colón 1800",
    ciudad: "Córdoba",
    provincia: "Córdoba",
    lat: -31.4130, lng: -64.1800,
    rating: 4.9, reseñas: 445,
    imagen: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=600",
    slug: "complejo-deportivo-cordoba", canchas: 12, abierto: true,
  },
  {
    id: 10,
    nombre: "Padel Center Córdoba",
    deporte: "Padel",
    ubicacion: "Barrio Nueva Córdoba",
    ciudad: "Córdoba",
    provincia: "Córdoba",
    lat: -31.4280, lng: -64.1950,
    rating: 4.8, reseñas: 231,
    imagen: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=600",
    slug: "padel-center-cordoba", canchas: 8, abierto: true,
  },
  {
    id: 11,
    nombre: "Arena Deportes Córdoba",
    deporte: "Básquetbol",
    ubicacion: "Alta Córdoba",
    ciudad: "Córdoba",
    provincia: "Córdoba",
    lat: -31.4050, lng: -64.1850,
    rating: 4.7, reseñas: 178,
    imagen: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=600",
    slug: "arena-deportes-cordoba", canchas: 5, abierto: true,
  },
];

const DEPORTES = ["Todos", "Fútbol", "Padel", "Vóley", "Tenis", "Básquetbol"];

function Estrellas({ cantidad }: { cantidad: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={12} className={i <= cantidad ? "text-yellow-400 fill-yellow-400" : "text-white/20"} />
      ))}
    </div>
  );
}

export default function ExplorarPage() {
  const { ciudadCorta, loading } = useCityContext();
  const [busqueda, setBusqueda] = useState("");
  const [deporte, setDeporte] = useState("Todos");

  // Filtrar por ciudad + búsqueda + deporte
  const complejosDeCiudad = useMemo(
    () => TODOS_LOS_COMPLEJOS.filter((c) => c.ciudad === ciudadCorta),
    [ciudadCorta]
  );

  const filtrados = useMemo(() => {
    return complejosDeCiudad.filter((c) => {
      const coincideBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideDeporte = deporte === "Todos" || c.deporte === deporte;
      return coincideBusqueda && coincideDeporte;
    });
  }, [busqueda, deporte, complejosDeCiudad]);

  return (
    <div className="relative min-h-screen bg-rodeo-dark text-rodeo-cream font-sans overflow-x-hidden">
      {/* FONDO */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-rodeo-dark via-rodeo-brown to-rodeo-dark" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-rodeo-lime/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen pb-24">
        {/* HEADER */}
        <header className="sticky top-0 z-30 px-5 py-4 flex items-center justify-between bg-rodeo-dark/60 backdrop-blur-md border-b border-white/5">
          <Link href="/" className="w-10 h-10 rounded-full border border-white/20 bg-white/8 hover:bg-white/15 flex items-center justify-center transition-all">
            <ChevronLeft className="text-rodeo-cream" size={20} />
          </Link>
          <h1 className="text-lg font-black text-rodeo-cream tracking-wide">Explorar Complejos</h1>
          <div className="w-10" />
        </header>

        <div className="px-5 pt-5 max-w-4xl mx-auto space-y-5">
          {/* CITY BANNER */}
          <CityBanner />

          {/* BÚSQUEDA */}
          <div className="relative">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/40" />
            <input
              type="text"
              placeholder={`Buscar en ${ciudadCorta}...`}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
              className="w-full pl-10 pr-10 py-3 text-sm text-rodeo-cream placeholder-rodeo-cream/30 focus:outline-none focus:border-rodeo-lime/40 transition-all"
            />
            {busqueda && (
              <button onClick={() => setBusqueda("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/40 hover:text-rodeo-cream">
                <X size={17} />
              </button>
            )}
          </div>

          {/* FILTROS */}
          <div className="flex gap-2 flex-wrap">
            {DEPORTES.map((d) => (
              <button
                key={d}
                onClick={() => setDeporte(d)}
                style={deporte === d
                  ? { background: "#C8FF00", color: "#040D07", borderRadius: "10px" }
                  : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }
                }
                className="px-3 py-1.5 text-xs font-bold transition-all text-rodeo-cream"
              >
                {d}
              </button>
            ))}
          </div>

          {/* RESULTADO */}
          {!loading && complejosDeCiudad.length === 0 ? (
            <div
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px" }}
              className="p-12 text-center"
            >
              <p className="text-4xl mb-4">🚀</p>
              <p className="text-lg font-black text-white mb-2">¡Pronto en {ciudadCorta}!</p>
              <p className="text-sm text-rodeo-cream/50 mb-6">Estamos expandiéndonos. Todavía no hay complejos registrados en tu ciudad.</p>
              <Link href="/mapa" style={{ background: "rgba(200,255,0,0.15)", border: "1px solid rgba(200,255,0,0.3)", borderRadius: "12px" }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-rodeo-lime"
              >
                <MapPin size={15} /> Ver mapa de todas las ciudades
              </Link>
            </div>
          ) : filtrados.length === 0 ? (
            <p className="text-center text-rodeo-cream/50 text-sm py-8">
              No encontramos complejos que coincidan
            </p>
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
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" }}
                    className="overflow-hidden hover:bg-white/8 transition-all group block"
                  >
                    <div className="h-44 overflow-hidden relative">
                      <img src={complejo.imagen} alt={complejo.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-rodeo-dark via-transparent to-transparent" />
                      <div className="absolute top-3 right-3">
                        <span style={{ background: "rgba(200,255,0,0.2)", border: "1px solid rgba(200,255,0,0.4)", borderRadius: "8px" }}
                          className="inline-block px-2.5 py-1 text-rodeo-lime text-[11px] font-bold">
                          {complejo.deporte}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <span style={{ background: "rgba(34,197,94,0.2)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "8px" }}
                          className="inline-block px-2.5 py-1 text-green-400 text-[11px] font-bold">
                          ● Abierto
                        </span>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight">{complejo.nombre}</h3>
                        <div className="flex items-center gap-1 text-xs text-rodeo-cream/50 mt-1">
                          <MapPin size={11} />{complejo.ubicacion}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1">
                          <Estrellas cantidad={Math.round(complejo.rating)} />
                          <span className="text-xs font-bold text-white ml-1">{complejo.rating}</span>
                          <span className="text-xs text-rodeo-cream/40">({complejo.reseñas})</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-rodeo-cream/50">
                          <Users size={11} />{complejo.canchas} canchas
                        </div>
                      </div>
                      <button style={{ background: "rgba(200,255,0,0.15)", border: "1px solid rgba(200,255,0,0.4)", borderRadius: "10px" }}
                        className="w-full py-2 text-rodeo-lime text-xs font-bold hover:bg-rodeo-lime/25 transition-all">
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
