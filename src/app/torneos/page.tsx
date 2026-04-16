"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Trophy, Users, Calendar, Filter, Loader, ChevronLeft, Rss } from "lucide-react";
import CityBanner from "@/components/CityBanner";
import { useCityContext } from "@/lib/context/CityContext";

interface Torneo {
  id: string;
  nombre: string;
  slug: string;
  deporte: string;
  descripcion: string;
  fecha_inicio: string;
  cupos_totales: number;
  cupos_ocupados: number;
  estado: "registracion" | "en_curso" | "finalizado";
  imagen_url: string | null;
}

export default function TorneosPage() {
  const router = useRouter();
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [filtroDeporte, setFiltroDeporte] = useState("todos");
  const [loading, setLoading] = useState(true);
  const { ciudadCorta: city } = useCityContext();

  useEffect(() => {
    fetchTorneos();
  }, [filtroDeporte, city]);

  const fetchTorneos = async () => {
    try {
      let query = supabase
        .from("tournaments")
        .select(`*, complex:complexes!inner(ciudad)`)
        .eq("complexes.ciudad", city)
        .order("fecha_inicio", { ascending: true });

      if (filtroDeporte !== "todos") {
        query = query.eq("deporte", filtroDeporte);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTorneos(data || []);
    } catch (err) {
      console.error("Error fetching tournaments:", err);
    } finally {
      setLoading(false);
    }
  };

  const deportes = [
    { value: "todos", label: "Todos" },
    { value: "futbol", label: "Fútbol" },
    { value: "padel", label: "Padel" },
    { value: "tenis", label: "Tenis" },
    { value: "voley", label: "Vóley" },
    { value: "basquet", label: "Básquetbol" },
  ];

  const getTorneoColor = (deporte: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      futbol: {
        bg: "from-green-900/20 to-green-800/10",
        border: "border-green-500/30",
        text: "text-green-400",
      },
      padel: {
        bg: "from-orange-900/20 to-orange-800/10",
        border: "border-orange-500/30",
        text: "text-orange-400",
      },
      tenis: {
        bg: "from-yellow-900/20 to-yellow-800/10",
        border: "border-yellow-500/30",
        text: "text-yellow-400",
      },
      voley: {
        bg: "from-cyan-900/20 to-cyan-800/10",
        border: "border-cyan-500/30",
        text: "text-cyan-400",
      },
      basquet: {
        bg: "from-orange-950/20 to-red-900/10",
        border: "border-orange-500/30",
        text: "text-orange-400",
      },
    };
    return colors[deporte] || colors.futbol;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-rodeo-dark">
        <Loader className="animate-spin text-rodeo-lime" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header con volver */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-4">
            <Link href="/"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px" }}
              className="w-10 h-10 flex items-center justify-center hover:bg-white/15 transition-all shrink-0"
            >
              <ChevronLeft size={20} className="text-white" />
            </Link>
            <div className="flex items-center gap-3">
              <Trophy className="text-rodeo-lime" size={28} />
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">Torneos</h1>
            </div>
            <Link href="/feed"
              style={{ background: "rgba(200,255,0,0.12)", border: "1px solid rgba(200,255,0,0.25)", borderRadius: "12px" }}
              className="ml-auto flex items-center gap-2 px-4 py-2 hover:bg-rodeo-lime/20 transition-all text-rodeo-lime text-xs font-bold"
            >
              <Rss size={14} />
              Feed
            </Link>
          </div>
          <p className="text-rodeo-cream/70 text-base">Participa en emocionantes torneos deportivos</p>
        </motion.div>
        
        <CityBanner />

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 flex-wrap"
        >
          <Filter size={20} className="text-rodeo-lime" />
          {deportes.map((deporte) => (
            <button
              key={deporte.value}
              onClick={() => setFiltroDeporte(deporte.value)}
              className={`px-4 py-2 rounded-liquid border transition-all font-bold ${
                filtroDeporte === deporte.value
                  ? "bg-rodeo-lime text-rodeo-dark border-rodeo-lime"
                  : "bg-white/5 border-white/10 text-rodeo-cream hover:bg-white/10"
              }`}
            >
              {deporte.label}
            </button>
          ))}
        </motion.div>

        {/* Torneos Grid */}
        {torneos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="liquid-panel p-12 text-center"
          >
            <p className="text-rodeo-cream/70">
              No hay torneos en este momento
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {torneos.map((torneo, idx) => {
              const color = getTorneoColor(torneo.deporte);
              const cuposDisponibles =
                torneo.cupos_totales - torneo.cupos_ocupados;
              const porcentajeOcupado = Math.round(
                (torneo.cupos_ocupados / torneo.cupos_totales) * 100
              );

              return (
                <motion.div
                  key={torneo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <Link href={`/torneos/${torneo.slug}`}>
                    <div
                      className={`liquid-panel p-6 h-full space-y-4 cursor-pointer bg-gradient-to-br ${color.bg} border ${color.border}`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-black text-white uppercase mb-1">
                            {torneo.nombre}
                          </h3>
                          <p className={`text-xs font-bold ${color.text}`}>
                            {torneo.deporte.toUpperCase()}
                          </p>
                        </div>
                        <div className="text-2xl">🏆</div>
                      </div>

                      {/* Info */}
                      <p className="text-sm text-rodeo-cream/70 line-clamp-2">
                        {torneo.descripcion}
                      </p>

                      {/* Stats */}
                      <div className="space-y-2 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar size={16} className="text-rodeo-lime" />
                          <span className="text-rodeo-cream/70">
                            {new Date(torneo.fecha_inicio).toLocaleDateString(
                              "es-AR"
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users size={16} className="text-rodeo-lime" />
                          <span className="text-rodeo-cream/70">
                            {torneo.cupos_ocupados}/{torneo.cupos_totales} cupos
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="pt-4">
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${porcentajeOcupado}%` }}
                            transition={{ duration: 0.5, delay: idx * 0.1 + 0.2 }}
                            className="h-full bg-rodeo-lime"
                          />
                        </div>
                        <p className="text-xs text-rodeo-cream/50 mt-2">
                          {cuposDisponibles} cupos disponibles
                        </p>
                      </div>

                      {/* Estado Badge */}
                      <div className="pt-2">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            torneo.estado === "registracion"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : torneo.estado === "en_curso"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {torneo.estado === "registracion"
                            ? "Abierto"
                            : torneo.estado === "en_curso"
                            ? "En curso"
                            : "Finalizado"}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
