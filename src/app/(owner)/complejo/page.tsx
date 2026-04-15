"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  MapPin,
  Phone,
  Clock,
  Users,
  Star,
  Edit,
  Plus,
  Loader,
} from "lucide-react";

interface Complex {
  id: string;
  nombre: string;
  descripcion: string;
  ciudad: string;
  direccion: string;
  telefono: string;
  whatsapp: string;
  horario_abierto: string;
  horario_cierre: string;
  rating_promedio: number;
  total_reviews: number;
}

export default function OwnerComplejoPage() {
  const { user, loading: authLoading } = useAuth();
  const [complejos, setComplejos] = useState<Complex[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchComplejos();
    }
  }, [user]);

  const fetchComplejos = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("complexes")
        .select("*")
        .eq("owner_id", user.id);

      if (error) throw error;
      setComplejos(data || []);
    } catch (err) {
      console.error("Error fetching complexes:", err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-rodeo-lime" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">
            Mi Complejo
          </h1>
          <button className="liquid-button inline-flex items-center gap-2">
            <Plus size={20} />
            Crear Complejo
          </button>
        </div>
        <p className="text-rodeo-cream/70">
          Gestiona los detalles y disponibilidad de tus complejos deportivos
        </p>
      </motion.div>

      {/* Complejos List */}
      {complejos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="liquid-panel p-12 text-center space-y-4"
        >
          <p className="text-rodeo-cream/70">
            No tienes complejos creados aún
          </p>
          <button className="lime-button inline-flex items-center gap-2">
            <Plus size={20} />
            Crear tu primer complejo
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-6">
          {complejos.map((complejo, idx) => (
            <motion.div
              key={complejo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="liquid-panel p-6 space-y-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-black text-white uppercase mb-2">
                    {complejo.nombre}
                  </h2>
                  <p className="text-rodeo-cream/70">{complejo.descripcion}</p>
                </div>
                <button className="p-3 hover:bg-white/10 rounded-liquid border border-white/10 transition-colors">
                  <Edit size={20} className="text-rodeo-lime" />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/2 rounded-liquid p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={16} className="text-rodeo-lime" />
                    <p className="text-xs text-rodeo-cream/50">Ubicación</p>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {complejo.ciudad}
                  </p>
                </div>

                <div className="bg-white/2 rounded-liquid p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-rodeo-lime" />
                    <p className="text-xs text-rodeo-cream/50">Horario</p>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {complejo.horario_abierto} - {complejo.horario_cierre}
                  </p>
                </div>

                <div className="bg-white/2 rounded-liquid p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={16} className="text-yellow-400" />
                    <p className="text-xs text-rodeo-cream/50">Rating</p>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {complejo.rating_promedio?.toFixed(1) || "N/A"}/5 (
                    {complejo.total_reviews})
                  </p>
                </div>

                <div className="bg-white/2 rounded-liquid p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone size={16} className="text-rodeo-lime" />
                    <p className="text-xs text-rodeo-cream/50">Contacto</p>
                  </div>
                  <p className="text-sm font-bold text-white">{complejo.whatsapp}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button className="flex-1 liquid-button text-sm">
                  Editar Complejo
                </button>
                <button className="flex-1 liquid-button text-sm">
                  Ver Canchas
                </button>
                <button className="flex-1 liquid-button text-sm">
                  Disponibilidad
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
