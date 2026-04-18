"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Heart,
  Share2,
  Check,
  Star,
  MapPin,
  Clock,
  Navigation,
  MessageSquare,
  Users,
  Calendar,
  Zap,
} from "lucide-react";
import AvailabilityWidget from "@/components/AvailabilityWidget";
import { supabase } from "@/lib/supabase";

// --- Tipos DB ---
interface DBCourt {
  id: string;
  nombre: string;
  deporte: string;
  descripcion: string | null;
  imagen_principal: string | null;
  precio_por_hora: number;
  capacidad_jugadores: number;
  tiene_iluminacion: boolean;
  superficie: string;
  estado: string; // "disponible" | "ocupada" | "mantenimiento"
  activa: boolean;
}

interface DBComplejo {
  id: string;
  nombre: string;
  slug: string;
  deporte_principal: string;
  deportes: string[];
  descripcion: string | null;
  imagen_principal: string | null;
  galeria: string[];
  lat: number;
  lng: number;
  ciudad: string;
  direccion: string;
  telefono: string | null;
  whatsapp: string;
  horario_abierto: string;
  horario_cierre: string;
  dias_abiertos: string[];
  servicios: string[];
  rating_promedio: number | null;
  total_reviews: number;
  activo: boolean;
  canchas?: DBCourt[];
}

// --- Componente de estrellas estáticas ---
function Estrellas({ cantidad }: { cantidad: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          className={
            i <= cantidad ? "text-yellow-400 fill-yellow-400" : "text-white/20"
          }
        />
      ))}
    </div>
  );
}

// --- Componente principal ---
export default function ComplejoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const [complejo, setComplejo] = useState<DBComplejo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [favorito, setFavorito] = useState(false);
  const [imagenActiva, setImagenActiva] = useState(0);
  const [linkCopiado, setLinkCopiado] = useState(false);
  // abierto se computa client-side para evitar hydration mismatch (#418)
  const [abierto, setAbierto] = useState<boolean | null>(null);
  useEffect(() => {
    if (!complejo) return;
    const now = new Date();
    const h = now.getHours() * 100 + now.getMinutes();
    const [openH, openM] = complejo.horario_abierto.split(":").map(Number);
    const [closeH, closeM] = complejo.horario_cierre.split(":").map(Number);
    setAbierto(h >= openH * 100 + openM && h < closeH * 100 + closeM);
  }, [complejo]);

  useEffect(() => {
    const fetchComplejo = async () => {
      try {
        const { data: complexData, error } = await supabase
          .from("complexes")
          .select("*")
          .eq("slug", slug)
          .maybeSingle() as { data: Omit<DBComplejo, "canchas"> | null; error: unknown };

        if (error || !complexData) {
          setNotFound(true);
          return;
        }

        // Fetch courts separately
        const { data: courtsData } = await supabase
          .from("courts")
          .select("*")
          .eq("complex_id", complexData.id)
          .eq("activa", true)
          .order("nombre") as { data: DBCourt[] | null };

        setComplejo({ ...complexData, canchas: courtsData || [] });
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchComplejo();
  }, [slug]);

  const handleShare = async () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : "https://elpique.app"}/complejo/${slug}`;
    if (navigator.share) {
      await navigator.share({ title: complejo?.nombre, text: `Reservá canchas en ${complejo?.nombre}`, url });
    } else {
      await navigator.clipboard.writeText(url);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    }
  };

  const todasLasImagenes = complejo
    ? [complejo.imagen_principal || "", ...(complejo.galeria || [])].filter(Boolean)
    : [];

  // Generar link de WhatsApp
  const generarLinkWhatsApp = (cancha: DBCourt) => {
    const mensaje = encodeURIComponent(
      `Hola! Quiero reservar la cancha *${cancha.nombre}* en *${complejo!.nombre}*. ¿Cuál es la disponibilidad?`
    );
    return `https://wa.me/${complejo!.whatsapp}?text=${mensaje}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-rodeo-dark">
        <div className="w-8 h-8 border-2 border-rodeo-lime/30 border-t-rodeo-lime rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !complejo) {
    return (
      <div className="relative min-h-screen bg-rodeo-dark text-rodeo-cream font-sans flex flex-col items-center justify-center gap-6">
        <p className="text-2xl font-black text-white uppercase">Complejo no encontrado</p>
        <button
          onClick={() => router.back()}
          className="liquid-button inline-flex items-center gap-2 text-sm font-bold"
        >
          <ChevronLeft size={18} />
          Volver
        </button>
      </div>
    );
  }

  // Compute derived values
  const horario = `${complejo.horario_abierto} – ${complejo.horario_cierre}`;
  const diasAtencion = complejo.dias_abiertos?.join(", ") || "Todos los días";
  const ubicacion = `${complejo.direccion}, ${complejo.ciudad}`;
  const tags = complejo.deportes?.map((d) => d.charAt(0).toUpperCase() + d.slice(1)) || [];
  const rating = complejo.rating_promedio || 0;
  const canchas = complejo.canchas || [];

  // Adapt courts for AvailabilityWidget
  const canchasWidget = canchas.map((c, idx) => ({
    id: idx + 1,
    realId: c.id,
    nombre: c.nombre,
    deporte: c.deporte,
    precio: c.precio_por_hora,
    disponible: c.estado === "disponible",
  }));

  return (
    <div className="relative min-h-screen bg-rodeo-dark text-rodeo-cream font-sans">
      {/* FONDO FIXED */}
      <div className="fixed inset-0 z-0">
        <img
          src={complejo.imagen_principal || "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2000"}
          alt="Fondo"
          style={{ filter: "blur(20px)" }}
          className="w-full h-full object-cover scale-110"
        />
        <div className="absolute inset-0 bg-rodeo-dark/85" />
      </div>

      {/* CONTENIDO */}
      <div className="relative z-10 min-h-screen overflow-y-auto pb-28 md:pb-0">

        {/* GALERÍA HERO — full width */}
        <div className="relative h-56 md:h-80 overflow-hidden">
          <img
            src={todasLasImagenes[imagenActiva] || "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2000"}
            alt={complejo.nombre}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-rodeo-dark/90 via-transparent to-transparent" />
          {/* Botones flotantes */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <ChevronLeft size={20} className="text-white" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setFavorito(!favorito)}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <Heart size={18} className={favorito ? "fill-red-400 text-red-400" : "text-white"} />
              </button>
              <button
                onClick={handleShare}
                title={linkCopiado ? "¡Link copiado!" : "Compartir"}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                {linkCopiado ? <Check size={18} className="text-rodeo-lime" /> : <Share2 size={18} className="text-white" />}
              </button>
            </div>
          </div>
          {/* Badge estado */}
          <div className="absolute top-16 left-4">
            <span className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border ${abierto ? "bg-green-500/20 border-green-400/40 text-green-400" : "bg-red-500/20 border-red-400/40 text-red-400"}`}>
              {abierto ? "● Abierto" : "● Cerrado"}
            </span>
          </div>
          {/* Miniaturas */}
          <div className="absolute bottom-3 left-4 flex gap-2">
            {todasLasImagenes.slice(0, 4).map((img, i) => (
              <button
                key={i}
                onClick={() => setImagenActiva(i)}
                className={`w-12 h-9 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${imagenActiva === i ? "border-rodeo-lime" : "border-white/20 opacity-50"}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* ── LAYOUT PRINCIPAL ─────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:grid md:grid-cols-[1fr_380px] md:gap-8 md:items-start">

          {/* ── COLUMNA IZQUIERDA ─── */}
          <div className="flex flex-col gap-6">

            {/* INFO PRINCIPAL */}
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-rodeo-cream/50 mb-1">{complejo.deporte_principal}</p>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white leading-tight">{complejo.nombre}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5">
                  <Estrellas cantidad={Math.round(rating)} />
                  <span className="text-sm font-bold text-white">{rating}</span>
                  <span className="text-xs text-rodeo-cream/40">({complejo.total_reviews} reseñas)</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-rodeo-cream/40">
                  <MapPin size={12} />
                  {ubicacion}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-rodeo-cream/70">
                  <Clock size={12} /> {horario}
                </span>
                <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-rodeo-cream/70">
                  <Calendar size={12} /> {diasAtencion}
                </span>
                <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-rodeo-cream/70">
                  <Navigation size={12} />
                  <a href={`tel:${complejo.telefono}`} className="hover:text-rodeo-lime">{complejo.telefono}</a>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span key={tag} className="text-[10px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-rodeo-lime/15 text-rodeo-lime border border-rodeo-lime/25">{tag}</span>
                ))}
              </div>
            </div>

            {/* DESCRIPCIÓN */}
            <div
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" }}
              className="p-5 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-rodeo-lime" />
                <h3 className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/60">Sobre el complejo</h3>
              </div>
              <p className="text-sm text-rodeo-cream/75 leading-relaxed">{complejo.descripcion}</p>
            </div>

            {/* CANCHAS */}
            <div
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" }}
              className="p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap size={15} className="text-rodeo-lime" />
                <h3 className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/60">Todas las Canchas</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {canchas.map((cancha) => {
                  const disponible = cancha.estado === "disponible";
                  const jugadoresPorSide = Math.floor(cancha.capacidad_jugadores / 2);
                  return (
                    <div
                      key={cancha.id}
                      className={`rounded-2xl border p-4 flex flex-col gap-3 ${disponible ? "border-rodeo-lime/30 bg-rodeo-lime/5" : "border-white/10 bg-white/2 opacity-60"}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-white">{cancha.nombre}</h4>
                          <p className="text-xs text-rodeo-cream/50">{cancha.deporte} • {jugadoresPorSide}v{jugadoresPorSide}</p>
                        </div>
                        <span className="text-xl font-black text-rodeo-lime">${(cancha.precio_por_hora / 1000).toFixed(0)}K</span>
                      </div>
                      {disponible && (
                        <a
                          href={generarLinkWhatsApp(cancha)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="liquid-button py-2 text-sm font-bold text-center transition-all hover:bg-white/20"
                        >
                          Reservar por WhatsApp →
                        </a>
                      )}
                      {!disponible && (
                        <div className="text-xs text-rodeo-cream/50 text-center py-1 border-t border-white/10">No disponible ahora</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SERVICIOS */}
            <div
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" }}
              className="p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Users size={15} className="text-rodeo-lime" />
                <h3 className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/60">Servicios</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {complejo.servicios.map((s) => (
                  <span key={s} className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-rodeo-cream/70">✓ {s}</span>
                ))}
              </div>
            </div>

            {/* RESEÑAS */}
            <div
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" }}
              className="p-5 flex flex-col gap-4 mb-6"
            >
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-rodeo-lime" />
                <h3 className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/60">Reseñas</h3>
              </div>
              {([] as { autor: string; estrellas: number; texto: string }[]).map((r, i) => (
                <div key={i} className="flex flex-col gap-2 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{r.autor}</span>
                    <Estrellas cantidad={r.estrellas} />
                  </div>
                  <p className="text-xs text-rodeo-cream/60 leading-relaxed">{r.texto}</p>
                </div>
              ))}
              {complejo.total_reviews === 0 && (
                <p className="text-xs text-rodeo-cream/40 text-center py-2">Aún no hay reseñas para este complejo.</p>
              )}
            </div>
          </div>

          {/* ── COLUMNA DERECHA (sticky en desktop, inline en mobile) ─── */}
          <div className="md:sticky md:top-6">
            {/* Widget reservas — solo visible en desktop en la columna */}
            <div className="hidden md:block">
              <AvailabilityWidget complejo={complejo} complexId={complejo.id} canchas={canchasWidget} />
            </div>
            {/* En mobile, Availability Widget va inline entre secciones */}
            <div className="md:hidden">
              <AvailabilityWidget complejo={complejo} complexId={complejo.id} canchas={canchasWidget} />
            </div>

            {/* CTA WhatsApp (solo desktop en columna) */}
            <div className="hidden md:block mt-4">
              <a
                href={`https://wa.me/${complejo.whatsapp}?text=${encodeURIComponent(`Hola! Tengo una consulta sobre ${complejo.nombre}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px" }}
                className="w-full py-3 flex items-center justify-center gap-3 text-sm font-bold text-white hover:bg-white/10 transition-all"
              >
                <MessageSquare size={18} />
                Contactar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* BOTÓN STICKY BOTTOM — solo móvil */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 px-5 py-4 bg-rodeo-dark/80 backdrop-blur-md border-t border-white/10">
        <a
          href={`https://wa.me/${complejo.whatsapp}?text=${encodeURIComponent(`Hola! Tengo una consulta sobre ${complejo.nombre}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="liquid-button w-full py-4 flex items-center justify-center gap-3 text-sm font-bold tracking-widest uppercase bg-rodeo-lime/20 hover:bg-rodeo-lime/30 border-rodeo-lime/50"
        >
          <MessageSquare size={18} />
          Contactar por WhatsApp
        </a>
      </div>
    </div>
  );
}
