"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import dynamicImport from "next/dynamic";
import { motion } from "framer-motion";
import { ChevronLeft, Search, X, Star, MapPin, Users, Loader, List } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/Skeleton";
import CityBanner from "@/components/CityBanner";
import { useCityContext } from "@/lib/context/CityContext";
import { supabase } from "@/lib/supabase";

const MapaLeaflet = dynamicImport(() => import("@/components/MapaLeaflet"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-[60vh]"><Loader size={24} className="animate-spin text-rodeo-lime" /></div>,
});

type Complejo = {
  id: string;
  nombre: string;
  deporte_principal: string;
  deportes: string[];
  direccion: string;
  ciudad: string;
  rating_promedio: number | null;
  total_reviews: number;
  imagen_principal: string | null;
  slug: string;
  activo: boolean;
  lat: number | null;
  lng: number | null;
  _canchas_count?: number;
};

const DEPORTES = ["Todos", "Fútbol", "Padel", "Vóley", "Tenis", "Básquetbol", "Hockey", "Squash"];

const DEPORTE_MAP: Record<string, string> = {
  futbol: "Fútbol", padel: "Padel", tenis: "Tenis",
  voley: "Vóley", basquet: "Básquetbol", hockey: "Hockey", squash: "Squash",
};

const FALLBACK_IMGS: Record<string, string> = {
  futbol: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600",
  padel: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=600",
  tenis: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=600",
  voley: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?q=80&w=600",
  basquet: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=600",
};

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
  const { ciudadCorta, loading: cityLoading } = useCityContext();
  const [complejos, setComplejos] = useState<Complejo[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [deporte, setDeporte] = useState("Todos");
  const [vista, setVista] = useState<"lista" | "mapa">("lista");
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);

  useEffect(() => {
    if (cityLoading) return;
    fetchComplejos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ciudadCorta, cityLoading]);

  const fetchComplejos = async () => {
    setLoadingData(true);
    setFetchError(false);
    try {
      const { data, error } = await supabase
        .from("complexes")
        .select("id, nombre, deporte_principal, deportes, direccion, ciudad, rating_promedio, total_reviews, imagen_principal, slug, activo, lat, lng")
        .eq("activo", true)
        .eq("ciudad", ciudadCorta)
        .order("nombre");

      if (error) throw error;

      // Fetch court counts per complex
      const ids = (data || []).map((c: Complejo) => c.id);
      let countMap: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: courts } = await supabase
          .from("courts")
          .select("complex_id")
          .in("complex_id", ids)
          .eq("activa", true);
        (courts || []).forEach((c: { complex_id: string }) => {
          countMap[c.complex_id] = (countMap[c.complex_id] || 0) + 1;
        });
      }

      const enriched = (data || []).map((c: Complejo) => ({ ...c, _canchas_count: countMap[c.id] || 0 }));
      setComplejos(enriched);
    } catch (err) {
      console.error("Error fetching complejos:", err);
      setFetchError(true);
    } finally {
      setLoadingData(false);
    }
  };

  const filtrados = useMemo(() => {
    return complejos.filter((c) => {
      const coincideBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase());
      if (deporte === "Todos") return coincideBusqueda;
      // Match by deporte_principal or deportes array
      const deportesLabel = [c.deporte_principal, ...(c.deportes || [])].map(d => DEPORTE_MAP[d] || d);
      return coincideBusqueda && deportesLabel.some(d => d === deporte);
    });
  }, [busqueda, deporte, complejos]);

  const isLoading = cityLoading || loadingData;

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
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "22px", letterSpacing: "-0.01em", textTransform: "uppercase", lineHeight: 1 }} className="text-rodeo-cream">
            <span className="section-slash">/</span>Explorar
          </h1>
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

          {/* FILTROS + toggle vista */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-2 flex-wrap flex-1">
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
            {/* Toggle Lista / Mapa */}
            <div className="flex shrink-0" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 3 }}>
              {([["lista", List, "Lista"], ["mapa", MapPin, "Mapa"]] as const).map(([v, Icon, label]) => (
                <button key={v} onClick={() => setVista(v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all"
                  style={vista === v
                    ? { background: "rgba(200,255,0,0.2)", border: "1px solid rgba(200,255,0,0.35)", borderRadius: 7, color: "#C8FF00" }
                    : { borderRadius: 7, color: "rgba(225,212,194,0.4)", border: "1px solid transparent" }}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* RESULTADO */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" }} className="overflow-hidden">
                  <Skeleton className="h-44 w-full" rounded="sm" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-8 w-full mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : fetchError ? (
            <div
              style={{ background: "rgba(255,60,60,0.06)", border: "1px solid rgba(255,60,60,0.2)", borderRadius: "20px" }}
              className="p-10 text-center"
            >
              <p className="text-3xl mb-3">⚠️</p>
              <p className="text-base font-black text-white mb-1">No se pudo cargar</p>
              <p className="text-sm text-rodeo-cream/50 mb-5">Hubo un problema al conectar. Verificá tu conexión.</p>
              <button
                onClick={fetchComplejos}
                style={{ background: "rgba(200,255,0,0.15)", border: "1px solid rgba(200,255,0,0.3)", borderRadius: "12px" }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-rodeo-lime"
              >
                <Loader size={14} /> Reintentar
              </button>
            </div>
          ) : complejos.length === 0 ? (
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
          ) : vista === "mapa" ? (
            <div className="relative">
              <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", height: "65vh", minHeight: 320 }}>
                <MapaLeaflet
                  complejos={filtrados.filter(c => c.lat && c.lng).map(c => ({
                    id: c.id,
                    nombre: c.nombre,
                    deporte: DEPORTE_MAP[c.deporte_principal] || c.deporte_principal,
                    descripcion: c.direccion,
                    horario: "",
                    telefono: "",
                    abierto: true,
                    distancia: "",
                    rating: c.rating_promedio ?? 0,
                    lat: c.lat as number,
                    lng: c.lng as number,
                    slug: c.slug,
                    ciudad: c.ciudad,
                  }))}
                  selectedId={selectedMapId}
                  onSelectComplejo={(c) => setSelectedMapId(prev => prev === c.id ? null : c.id)}
                />
              </div>
              {/* Info panel: aparece al seleccionar un marcador */}
              {selectedMapId && (() => {
                const c = filtrados.find(f => f.id === selectedMapId);
                if (!c) return null;
                const allDeportes = [...new Set([c.deporte_principal, ...(c.deportes || [])])].filter(Boolean);
                const img = c.imagen_principal || FALLBACK_IMGS[c.deporte_principal] || FALLBACK_IMGS.futbol;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    style={{ background: "rgba(13,26,10,0.97)", border: "1px solid rgba(200,255,0,0.25)", borderRadius: 16, backdropFilter: "blur(20px)" }}
                    className="absolute bottom-3 left-3 right-3 z-10 p-4 flex gap-3 items-center shadow-2xl"
                  >
                    <div className="relative w-16 h-16 shrink-0 rounded-[10px] overflow-hidden">
                      <Image src={img} alt={c.nombre} fill className="object-cover" sizes="64px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: 16, textTransform: "uppercase", lineHeight: 1.1 }} className="text-white truncate">{c.nombre}</h4>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {allDeportes.slice(0, 3).map(d => (
                          <span key={d} className="text-[10px] font-bold px-1.5 py-0.5 rounded-[5px]" style={{ background: "rgba(200,255,0,0.15)", color: "#C8FF00" }}>{DEPORTE_MAP[d] || d}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-rodeo-cream/50 mt-1">
                        <MapPin size={10} /><span className="truncate">{c.direccion}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Link href={`/complejo/${c.slug}`}
                        style={{ background: "#C8FF00", borderRadius: 9 }}
                        className="px-3 py-2 text-xs font-black text-rodeo-dark whitespace-nowrap">
                        Ver canchas →
                      </Link>
                      <button onClick={() => setSelectedMapId(null)}
                        style={{ background: "rgba(255,255,255,0.08)", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)" }}
                        className="px-3 py-1.5 text-xs text-rodeo-cream/60">
                        Cerrar
                      </button>
                    </div>
                  </motion.div>
                );
              })()}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtrados.map((complejo, i) => {
                const allDeportes = [...new Set([complejo.deporte_principal, ...(complejo.deportes || [])])].filter(Boolean);
                const deporteLabel = DEPORTE_MAP[allDeportes[0]] || allDeportes[0];
                const img = complejo.imagen_principal || FALLBACK_IMGS[complejo.deporte_principal] || FALLBACK_IMGS.futbol;
                const rating = complejo.rating_promedio ?? 0;
                return (
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
                        <Image src={img} alt={complejo.nombre} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 50vw" />
                        <div className="absolute inset-0 bg-gradient-to-t from-rodeo-dark via-transparent to-transparent" />
                        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                          {allDeportes.slice(0, 3).map(d => (
                            <span key={d} style={{ background: "rgba(200,255,0,0.2)", border: "1px solid rgba(200,255,0,0.4)", borderRadius: "8px" }}
                              className="inline-block px-2.5 py-1 text-rodeo-lime text-[11px] font-bold">
                              {DEPORTE_MAP[d] || d}
                            </span>
                          ))}
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
                          <h3 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "18px", letterSpacing: "-0.01em", textTransform: "uppercase", lineHeight: 1.05 }} className="text-white">{complejo.nombre}</h3>
                          <div className="flex items-center gap-1 text-xs text-rodeo-cream/50 mt-1">
                            <MapPin size={11} />{complejo.direccion}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <div className="flex items-center gap-1">
                            <Estrellas cantidad={Math.round(rating)} />
                            <span className="text-xs font-bold text-white ml-1">{rating > 0 ? rating.toFixed(1) : "—"}</span>
                            {complejo.total_reviews > 0 && (
                              <span className="text-xs text-rodeo-cream/40">({complejo.total_reviews})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-rodeo-cream/50">
                            <Users size={11} />{complejo._canchas_count} {complejo._canchas_count === 1 ? "cancha" : "canchas"}
                          </div>
                        </div>
                        <button style={{ background: "rgba(200,255,0,0.15)", border: "1px solid rgba(200,255,0,0.4)", borderRadius: "10px" }}
                          className="w-full py-2 text-rodeo-lime text-xs font-bold hover:bg-rodeo-lime/25 transition-all">
                          Ver Canchas →
                        </button>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
