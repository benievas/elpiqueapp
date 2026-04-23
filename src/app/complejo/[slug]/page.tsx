"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
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
  Trophy,
  QrCode,
} from "lucide-react";
import QRShareModal from "@/components/QRShareModal";
import AvailabilityWidget from "@/components/AvailabilityWidget";
import { supabase, supabaseMut } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";

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

  const { user, isAuthenticated } = useAuth();
  const [favorito, setFavorito] = useState(false);
  const [imagenActiva, setImagenActiva] = useState(0);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [reviewEstrellas, setReviewEstrellas] = useState(0);
  const [reviewTexto, setReviewTexto] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<{ id: string; estrellas: number; texto: string | null; created_at: string; autor?: string }[]>([]);
  const [aiResumen, setAiResumen] = useState<string | null>(null);
  const [torneos, setTorneos] = useState<{ id: string; nombre: string; slug: string; deporte: string; estado: string; fecha_inicio: string; imagen_url: string | null }[]>([]);
  // abierto se computa client-side para evitar hydration mismatch (#418)
  const [abierto, setAbierto] = useState<boolean | null>(null);
  useEffect(() => {
    if (!complejo) return;
    try {
      const now = new Date();
      const h = now.getHours() * 100 + now.getMinutes();
      const [openH, openM] = (complejo.horario_abierto || "08:00").split(":").map(Number);
      const [closeH, closeM] = (complejo.horario_cierre || "23:59").split(":").map(Number);
      setAbierto(h >= openH * 100 + openM && h < closeH * 100 + closeM);
    } catch {
      setAbierto(null);
    }
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

        // Fetch reviews
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select("id, estrellas, texto, created_at, profiles!user_id(nombre_completo)")
          .eq("complex_id", complexData.id)
          .order("created_at", { ascending: false })
          .limit(10);
        if (reviewsData) {
          // Mostrar ai_resumen del complejo si existe
          if ((complexData as any).ai_resumen) {
            setAiResumen((complexData as any).ai_resumen);
          }
          setReviews(reviewsData.map((r: any) => ({
            id: r.id,
            estrellas: r.estrellas,
            texto: r.texto,
            created_at: r.created_at,
            autor: Array.isArray(r.profiles) ? r.profiles[0]?.nombre_completo : r.profiles?.nombre_completo ?? "Jugador",
          })));
        }

        // Fetch tournaments (palmarés)
        const { data: torneosData } = await supabase
          .from("tournaments")
          .select("id, nombre, slug, deporte, estado, fecha_inicio, imagen_url")
          .eq("complex_id", complexData.id)
          .order("fecha_inicio", { ascending: false })
          .limit(12);
        if (torneosData) setTorneos(torneosData as typeof torneos);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchComplejo();
  }, [slug]);

  const handleShare = async () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : "https://elpiqueapp.com"}/complejo/${slug}`;
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
      <div className="relative min-h-screen bg-rodeo-dark">
        <Skeleton className="h-56 md:h-80 w-full" rounded="sm" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <div className="grid md:grid-cols-2 gap-3 mt-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        </div>
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
  const horario = complejo.horario_abierto && complejo.horario_cierre 
    ? `${complejo.horario_abierto} – ${complejo.horario_cierre}` 
    : "Consultar horario";
  const diasAtencion = complejo.dias_abiertos && complejo.dias_abiertos.length > 0 ? complejo.dias_abiertos.join(", ") : "Todos los días";
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
        <Image
          src={complejo.imagen_principal || "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2000"}
          alt="Fondo"
          fill
          style={{ filter: "blur(20px)" }}
          className="object-cover scale-110"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-rodeo-dark/85" />
      </div>

      {/* CONTENIDO */}
      <div className="relative z-10 min-h-screen overflow-y-auto pb-28 md:pb-0">

        {/* GALERÍA HERO — full width */}
        <div className="relative h-56 md:h-80 overflow-hidden">
          <Image
            src={todasLasImagenes[imagenActiva] || "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2000"}
            alt={complejo.nombre}
            fill
            className="object-cover"
            sizes="100vw"
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
                onClick={() => setShowQR(true)}
                title="Código QR"
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <QrCode size={18} className="text-white" />
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
                className={`relative w-12 h-9 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${imagenActiva === i ? "border-rodeo-lime" : "border-white/20 opacity-50"}`}
              >
                <Image src={img} alt="" fill className="object-cover" sizes="48px" />
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
              <p className="eyebrow text-rodeo-lime mb-2">{complejo.deporte_principal}</p>
              <h1
                style={{
                  fontFamily: "'Barlow Condensed', system-ui, sans-serif",
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                  lineHeight: 0.95,
                  fontSize: "clamp(36px, 7vw, 56px)",
                }}
                className="text-white"
              >
                {complejo.nombre}
              </h1>
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
              <h3 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "20px", letterSpacing: "-0.01em", textTransform: "uppercase", lineHeight: 1 }} className="text-white">
                <span className="section-slash">/</span>Sobre el complejo
              </h3>
              <p className="text-sm text-rodeo-cream/75 leading-relaxed">{complejo.descripcion}</p>
            </div>

            {/* CANCHAS */}
            <div
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" }}
              className="p-5"
            >
              <h3 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "20px", letterSpacing: "-0.01em", textTransform: "uppercase", lineHeight: 1 }} className="text-white mb-4">
                <span className="section-slash">/</span>Todas las canchas
              </h3>
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
                          <h4 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 800, fontSize: "16px", letterSpacing: "-0.01em", textTransform: "uppercase", lineHeight: 1.1 }} className="text-white">{cancha.nombre}</h4>
                          <p className="text-xs text-rodeo-cream/50 mt-0.5">{cancha.deporte} • {jugadoresPorSide}v{jugadoresPorSide}</p>
                        </div>
                        <span style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "24px", letterSpacing: "-0.01em", lineHeight: 1 }} className="text-rodeo-lime">${(cancha.precio_por_hora / 1000).toFixed(0)}K</span>
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
              <h3 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "20px", letterSpacing: "-0.01em", textTransform: "uppercase", lineHeight: 1 }} className="text-white mb-3">
                <span className="section-slash">/</span>Servicios
              </h3>
              <div className="flex flex-wrap gap-2">
                {complejo.servicios.map((s) => (
                  <span key={s} className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-rodeo-cream/70">✓ {s}</span>
                ))}
              </div>
            </div>

            {/* PALMARÉS / TORNEOS */}
            {torneos.length > 0 && (
              <div
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" }}
                className="p-5 mb-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "20px", letterSpacing: "-0.01em", textTransform: "uppercase", lineHeight: 1 }} className="text-white">
                    <span className="section-slash">/</span>Palmarés
                  </h3>
                  <Link href="/torneos" className="text-[11px] font-black text-rodeo-lime hover:underline">Ver todos →</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {torneos.map((t) => {
                    const estMeta = t.estado === "en_curso"
                      ? { label: "EN CURSO", color: "#60A5FA", bg: "rgba(96,165,250,0.15)" }
                      : t.estado === "finalizado"
                        ? { label: "FINALIZADO", color: "#94A3B8", bg: "rgba(148,163,184,0.15)" }
                        : { label: "ABIERTO", color: "#4ADE80", bg: "rgba(74,222,128,0.15)" };
                    return (
                      <Link key={t.id} href={`/torneos/${t.slug}`}
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px" }}
                        className="flex items-center gap-3 p-3 hover:border-rodeo-lime/40 hover:bg-white/5 transition-all group">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 shrink-0 flex items-center justify-center">
                          {t.imagen_url ? (
                            <img src={t.imagen_url} alt={t.nombre} className="w-full h-full object-cover"/>
                          ) : (
                            <Trophy size={18} className="text-rodeo-lime"/>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate group-hover:text-rodeo-lime transition-colors">{t.nombre}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: estMeta.bg, color: estMeta.color }}>
                              {estMeta.label}
                            </span>
                            <span className="text-[10px] text-rodeo-cream/40 truncate">
                              {t.deporte} · {new Date(t.fecha_inicio).toLocaleDateString("es-AR", { month: "short", year: "numeric" })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RESEÑAS */}
            <div
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" }}
              className="p-5 flex flex-col gap-4 mb-6"
            >
              <h3 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "20px", letterSpacing: "-0.01em", textTransform: "uppercase", lineHeight: 1 }} className="text-white">
                <span className="section-slash">/</span>Reseñas
              </h3>

              {/* Resumen IA */}
              {aiResumen && (
                <div
                  className="flex gap-3 px-4 py-3 rounded-[14px]"
                  style={{ background: "rgba(200,255,0,0.05)", border: "1px solid rgba(200,255,0,0.15)" }}
                >
                  <span className="text-rodeo-lime text-base shrink-0">✦</span>
                  <p className="text-xs text-rodeo-cream/70 leading-relaxed italic">{aiResumen}</p>
                </div>
              )}

              {/* Reviews list */}
              {reviews.length > 0 && (
                <div className="space-y-3 mb-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="border-b border-white/5 pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-white">{r.autor}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} size={11} className={i <= r.estrellas ? "text-yellow-400 fill-yellow-400" : "text-white/20"} />
                          ))}
                        </div>
                      </div>
                      {r.texto && <p className="text-xs text-rodeo-cream/60 leading-relaxed">{r.texto}</p>}
                    </div>
                  ))}
                </div>
              )}
              {reviews.length === 0 && (
                <p className="text-xs text-rodeo-cream/40 text-center py-2 mb-4">Aún no hay reseñas para este complejo.</p>
              )}

              {/* Review form */}
              {!reviewSaved ? (
                isAuthenticated ? (
                  <div className="space-y-3 pt-3 border-t border-white/8">
                    <p className="text-xs font-bold text-rodeo-cream/50 uppercase tracking-widest">Tu opinión</p>
                    {/* Stars */}
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(i => (
                        <button key={i} onClick={() => setReviewEstrellas(i)} className="transition-transform hover:scale-110">
                          <Star size={22} className={i <= reviewEstrellas ? "text-yellow-400 fill-yellow-400" : "text-white/25"} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reviewTexto}
                      onChange={e => setReviewTexto(e.target.value)}
                      placeholder="Contá tu experiencia (opcional)"
                      rows={3}
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#E8F0E4", resize: "none", outline: "none" }}
                      className="w-full px-4 py-3 text-sm placeholder:text-rodeo-cream/25"
                    />
                    {reviewError && (
                      <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-[10px] px-3 py-2">{reviewError}</p>
                    )}
                    <button
                      onClick={async () => {
                        if (!reviewEstrellas || !user) return;
                        setReviewSaving(true);
                        setReviewError(null);
                        const firstCourtId = canchas[0]?.id;
                        if (!firstCourtId) {
                          setReviewError("No hay canchas registradas en este complejo.");
                          setReviewSaving(false);
                          return;
                        }
                        const { error: reviewErr } = await supabaseMut.from("reviews").insert({
                          complex_id: complejo.id,
                          court_id: firstCourtId,
                          user_id: user.id,
                          estrellas: reviewEstrellas,
                          texto: reviewTexto.trim() || null,
                        });
                        setReviewSaving(false);
                        if (reviewErr) {
                          setReviewError("No se pudo enviar la reseña. Intentá de nuevo.");
                        } else {
                          setReviewSaved(true);
                          router.refresh(); // FORZAR REFRESCO PARA QUE EXPLORAR MUESTRE EL NUEVO RATING
                          // Regenerar resumen de IA si hay 5+ reseñas
                          if (reviews.length + 1 >= 5) {
                            fetch("/api/ai/review-summary", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ complex_id: complejo.id }),
                            })
                              .then((r) => r.json())
                              .then((d) => { if (d.resumen) setAiResumen(d.resumen); })
                              .catch(() => {});
                          }
                        }
                      }}
                      disabled={!reviewEstrellas || reviewSaving}
                      style={{ background: reviewEstrellas ? "rgba(200,255,0,0.9)" : "rgba(255,255,255,0.1)", borderRadius: "12px" }}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-black text-rodeo-dark disabled:opacity-50 transition-all"
                    >
                      {reviewSaving ? <div className="w-4 h-4 border-2 border-rodeo-dark/30 border-t-rodeo-dark rounded-full animate-spin" /> : null}
                      {reviewSaving ? "Enviando..." : "Enviar reseña"}
                    </button>
                  </div>
                ) : (
                  <div
                    style={{ background: "rgba(200,255,0,0.05)", border: "1px solid rgba(200,255,0,0.15)", borderRadius: "14px" }}
                    className="flex items-center gap-3 px-4 py-3 mt-3"
                  >
                    <MessageSquare size={16} className="text-rodeo-lime shrink-0" />
                    <p className="text-xs text-rodeo-cream/60">
                      <a href="/login" className="text-rodeo-lime font-bold hover:underline">Iniciá sesión</a> para dejar tu reseña y ayudar a otros jugadores.
                    </p>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 mt-3 rounded-[12px]" style={{ background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.2)" }}>
                  <span className="text-rodeo-lime">✓</span>
                  <p className="text-xs text-rodeo-lime font-bold">¡Gracias por tu reseña!</p>
                </div>
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

      <QRShareModal
        open={showQR}
        onClose={() => setShowQR(false)}
        url={typeof window !== "undefined" ? window.location.href : ""}
        title={complejo.nombre}
        subtitle={`${complejo.direccion}, ${complejo.ciudad}`}
      />
    </div>
  );
}
