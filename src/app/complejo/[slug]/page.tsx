"use client";

import { useState, use } from "react";
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

// --- Tipos ---
interface Court {
  id: number;
  nombre: string;
  deporte: string;
  precio: number;
  disponible: boolean;
  imagen: string;
  jugadoresPorSide: number;
}

interface Review {
  autor: string;
  estrellas: number;
  texto: string;
}

interface Complejo {
  id: number;
  nombre: string;
  slug: string;
  deporte: string;
  descripcion: string[];
  rating: number;
  resenasCount: number;
  ubicacion: string;
  telefono: string;
  whatsapp: string;
  imagenPrincipal: string;
  galeria: string[];
  horario: string;
  diasAtencion: string;
  abierto: boolean;
  servicios: string[];
  tags: string[];
  resumenIA: string;
  reviewsDestacadas: Review[];
  canchas: Court[];
}

// --- MOCK DATA ---
const MOCK_COMPLEJOS: Record<string, Complejo> = {
  "sportivo-central": {
    id: 1,
    nombre: "Sportivo Central",
    slug: "sportivo-central",
    deporte: "Fútbol 5/11",
    descripcion: [
      "Sportivo Central es el complejo deportivo más moderno de Catamarca con 8 canchas de fútbol sintético de última generación, 4 canchas de padel y 2 de vóley.",
      "Nuestras instalaciones incluyen vestuarios completos, estacionamiento para 200 vehículos, bar y zona de espera climatizada. Perfecto para torneos, ligas y partidos amistosos.",
      "Con iluminación LED profesional, contamos con disponibilidad de 06:00 a 23:00 todos los días. Las reservas son confirmadas vía WhatsApp en menos de 2 minutos.",
    ],
    rating: 4.8,
    resenasCount: 312,
    ubicacion: "Av. Libertad 1234, Catamarca Capital",
    telefono: "+54 383 443-1234",
    whatsapp: "5493834431234",
    imagenPrincipal:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2000&auto=format&fit=crop",
    galeria: [
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800",
      "https://images.unsplash.com/photo-1506952331343-911001f9f6b2?q=80&w=800",
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800",
    ],
    horario: "06:00 – 23:00",
    diasAtencion: "Todos los días",
    abierto: true,
    servicios: ["Vestuarios", "Estacionamiento", "Bar/Snacks", "WiFi", "Aire acondicionado"],
    tags: ["Fútbol", "Padel", "Vóley", "Profesional", "24/7"],
    resumenIA:
      "Sportivo Central es la mejor opción para fútbol 5 en Catamarca. Canchas en perfecto estado, servicio rápido y ambiente profesional. Ideal para ligas y torneos.",
    reviewsDestacadas: [
      {
        autor: "Carlos M.",
        estrellas: 5,
        texto: "Excelente complejo. Las canchas están impecables y el servicio muy rápido. Recomendado 100%.",
      },
      {
        autor: "Lucía P.",
        estrellas: 5,
        texto: "Jugué un torneo acá y fue espectacular. Todo bien organizado y las instalaciones de primer nivel.",
      },
      {
        autor: "Andrés R.",
        estrellas: 4,
        texto: "Buena ubicación y canchas bien mantenidas. A veces hay que esperar en picos horarios.",
      },
    ],
    canchas: [
      {
        id: 1,
        nombre: "Cancha Premium 1",
        deporte: "Fútbol 5",
        precio: 15000,
        disponible: true,
        imagen:
          "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600",
        jugadoresPorSide: 5,
      },
      {
        id: 2,
        nombre: "Cancha Premium 2",
        deporte: "Fútbol 5",
        precio: 15000,
        disponible: true,
        imagen:
          "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600",
        jugadoresPorSide: 5,
      },
      {
        id: 3,
        nombre: "Cancha Fútbol 11",
        deporte: "Fútbol 11",
        precio: 25000,
        disponible: false,
        imagen:
          "https://images.unsplash.com/photo-1506952331343-911001f9f6b2?q=80&w=600",
        jugadoresPorSide: 11,
      },
      {
        id: 4,
        nombre: "Padel Court 1",
        deporte: "Padel",
        precio: 12000,
        disponible: true,
        imagen:
          "https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=600",
        jugadoresPorSide: 2,
      },
    ],
  },
  "padel-club-elite": {
    id: 2,
    nombre: "Padel Club Elite",
    slug: "padel-club-elite",
    deporte: "Padel",
    descripcion: [
      "Padel Club Elite es la cancha de padel más moderna de Catamarca con 6 canchas profesionales de césped sintético premium.",
      "Ubicada en zona céntrica, ofrece vestuarios modernos, sauna, estacionamiento cubierto y una cafetería abierta durante todo el día.",
      "Especializada en torneos profesionales y entrenamientos de alto nivel, contamos con instructores certificados.",
    ],
    rating: 4.9,
    resenasCount: 189,
    ubicacion: "Calle Rivadavia 567, Centro Catamarca",
    telefono: "+54 383 443-5678",
    whatsapp: "5493834435678",
    imagenPrincipal:
      "https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=2000&auto=format&fit=crop",
    galeria: [
      "https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=800",
      "https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=800",
    ],
    horario: "07:00 – 22:00",
    diasAtencion: "Todos los días",
    abierto: true,
    servicios: ["Vestuarios", "Sauna", "Estacionamiento cubierto", "Cafetería", "Instructores"],
    tags: ["Padel", "Premium", "Torneos", "Sauna", "Profesional"],
    resumenIA:
      "Padel Club Elite es el mejor lugar para padel en Catamarca. Canchas de nivel profesional y ambiente incomparable.",
    reviewsDestacadas: [
      {
        autor: "Marina V.",
        estrellas: 5,
        texto: "Las mejores canchas de padel que encontré. Ambiente excelente para jugar.",
      },
    ],
    canchas: [
      {
        id: 1,
        nombre: "Padel Court 1",
        deporte: "Padel",
        precio: 12000,
        disponible: true,
        imagen:
          "https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=600",
        jugadoresPorSide: 2,
      },
      {
        id: 2,
        nombre: "Padel Court 2",
        deporte: "Padel",
        precio: 12000,
        disponible: true,
        imagen:
          "https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=600",
        jugadoresPorSide: 2,
      },
    ],
  },
  "arena-voley": {
    id: 3,
    nombre: "Arena Vóley Catamarca",
    slug: "arena-voley",
    deporte: "Vóley",
    descripcion: [
      "Arena Vóley Catamarca es el estadio especializado en vóley más importante de la región, con 4 canchas profesionales y capacidad para ligas y torneos internacionales.",
      "Infraestructura de clase mundial con público, sistema de sonido profesional y transmisión de partidos.",
    ],
    rating: 4.7,
    resenasCount: 98,
    ubicacion: "Calle San Martín 890, Catamarca",
    telefono: "+54 383 443-9999",
    whatsapp: "5493834439999",
    imagenPrincipal:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2000&auto=format&fit=crop",
    galeria: [
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800",
    ],
    horario: "08:00 – 22:00",
    diasAtencion: "Todos los días",
    abierto: true,
    servicios: ["Vestuarios", "Tribunas", "Sonido profesional", "Estacionamiento"],
    tags: ["Vóley", "Básquetbol", "Estadio", "Profesional", "Torneos"],
    resumenIA:
      "Arena Vóley es el complejo de vóley profesional de Catamarca. Perfecto para torneos y entrenamientos serios.",
    reviewsDestacadas: [
      {
        autor: "Sofía L.",
        estrellas: 5,
        texto: "Cancha de clase mundial. Jugué un torneo provincial acá.",
      },
    ],
    canchas: [
      {
        id: 1,
        nombre: "Cancha 1",
        deporte: "Vóley",
        precio: 10000,
        disponible: true,
        imagen:
          "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600",
        jugadoresPorSide: 6,
      },
    ],
  },
};

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

  const complejo = MOCK_COMPLEJOS[slug];

  const [favorito, setFavorito] = useState(false);
  const [imagenActiva, setImagenActiva] = useState(0);
  const [linkCopiado, setLinkCopiado] = useState(false);

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
    ? [complejo.imagenPrincipal, ...complejo.galeria]
    : [];

  // Generar link de WhatsApp
  const generarLinkWhatsApp = (cancha: Court) => {
    const mensaje = encodeURIComponent(
      `Hola! Quiero reservar la cancha *${cancha.nombre}* en *${complejo.nombre}*. ¿Cuál es la disponibilidad?`
    );
    return `https://wa.me/${complejo.whatsapp}?text=${mensaje}`;
  };

  if (!complejo) {
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

  return (
    <div className="relative min-h-screen bg-rodeo-dark text-rodeo-cream font-sans">
      {/* FONDO FIXED */}
      <div className="fixed inset-0 z-0">
        <img
          src={complejo.imagenPrincipal}
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
            src={todasLasImagenes[imagenActiva]}
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
            <span className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border ${complejo.abierto ? "bg-green-500/20 border-green-400/40 text-green-400" : "bg-red-500/20 border-red-400/40 text-red-400"}`}>
              {complejo.abierto ? "● Abierto" : "● Cerrado"}
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
              <p className="text-xs font-semibold tracking-widest uppercase text-rodeo-cream/50 mb-1">{complejo.deporte}</p>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white leading-tight">{complejo.nombre}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5">
                  <Estrellas cantidad={Math.round(complejo.rating)} />
                  <span className="text-sm font-bold text-white">{complejo.rating}</span>
                  <span className="text-xs text-rodeo-cream/40">({complejo.resenasCount} reseñas)</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-rodeo-cream/40">
                  <MapPin size={12} />
                  {complejo.ubicacion}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-rodeo-cream/70">
                  <Clock size={12} /> {complejo.horario}
                </span>
                <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-rodeo-cream/70">
                  <Calendar size={12} /> {complejo.diasAtencion}
                </span>
                <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-rodeo-cream/70">
                  <Navigation size={12} />
                  <a href={`tel:${complejo.telefono}`} className="hover:text-rodeo-lime">{complejo.telefono}</a>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {complejo.tags.map((tag) => (
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
              {complejo.descripcion.map((parrafo, i) => (
                <p key={i} className="text-sm text-rodeo-cream/75 leading-relaxed">{parrafo}</p>
              ))}
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
                {complejo.canchas.map((cancha) => (
                  <div
                    key={cancha.id}
                    className={`rounded-2xl border p-4 flex flex-col gap-3 ${cancha.disponible ? "border-rodeo-lime/30 bg-rodeo-lime/5" : "border-white/10 bg-white/2 opacity-60"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white">{cancha.nombre}</h4>
                        <p className="text-xs text-rodeo-cream/50">{cancha.deporte} • {cancha.jugadoresPorSide}v{cancha.jugadoresPorSide}</p>
                      </div>
                      <span className="text-xl font-black text-rodeo-lime">${(cancha.precio / 1000).toFixed(0)}K</span>
                    </div>
                    {cancha.disponible && (
                      <a
                        href={generarLinkWhatsApp(cancha)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="liquid-button py-2 text-sm font-bold text-center transition-all hover:bg-white/20"
                      >
                        Reservar por WhatsApp →
                      </a>
                    )}
                    {!cancha.disponible && (
                      <div className="text-xs text-rodeo-cream/50 text-center py-1 border-t border-white/10">No disponible ahora</div>
                    )}
                  </div>
                ))}
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
              {complejo.reviewsDestacadas.map((r, i) => (
                <div key={i} className="flex flex-col gap-2 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{r.autor}</span>
                    <Estrellas cantidad={r.estrellas} />
                  </div>
                  <p className="text-xs text-rodeo-cream/60 leading-relaxed">{r.texto}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── COLUMNA DERECHA (sticky en desktop, inline en mobile) ─── */}
          <div className="md:sticky md:top-6">
            {/* Widget reservas — solo visible en desktop en la columna */}
            <div className="hidden md:block">
              <AvailabilityWidget complejo={complejo} canchas={complejo.canchas} />
            </div>
            {/* En mobile, Availability Widget va inline entre secciones */}
            <div className="md:hidden">
              <AvailabilityWidget complejo={complejo} canchas={complejo.canchas} />
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
