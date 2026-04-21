"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MapPin,
  AlertTriangle,
  Compass,
  Map,
  Star,
  CheckCircle2,
  Zap,
  Trophy,
  CalendarDays,
  QrCode,
  BarChart3,
  MessageCircle,
  LogOut,
  LayoutDashboard,
  Users,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useCityContext } from "@/lib/context/CityContext";
import { supabase } from "@/lib/supabase";

const DEPORTE_LABEL: Record<string, string> = {
  futbol: "FÚTBOL", padel: "PÁDEL", tenis: "TENIS",
  voley: "VÓLEY", basquet: "BÁSQUET", hockey: "HOCKEY", squash: "SQUASH",
};

const FALLBACK_IMG_BY_DEPORTE: Record<string, string> = {
  futbol: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2000&auto=format&fit=crop",
  padel: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=2000&auto=format&fit=crop",
  tenis: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=2000&auto=format&fit=crop",
  voley: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=2000&auto=format&fit=crop",
  basquet: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2000&auto=format&fit=crop",
};

type ComplejoRow = {
  id: string;
  nombre: string;
  slug: string;
  deporte_principal: string;
  descripcion: string | null;
  imagen_principal: string | null;
  rating_promedio: number | null;
  ciudad: string;
};

// --- SLIDES PROMOCIONALES — fallback hardcodeado ---
// Los slides reales se cargan desde app_config (key: "home_promo_slides")
// Editables desde /admin/home-config
const PROMO_SLIDES = [
  {
    id: "p1",
    isPromo: true,
    title: "RESERVÁ EN SEGUNDOS",
    subtitle: "CONFIRMACIÓN VÍA WHATSAPP",
    description: "Elegí tu cancha, seleccioná el horario disponible y confirmá con el dueño directo por WhatsApp. Sin llamadas, sin esperas.",
    bgImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2000&auto=format&fit=crop",
    cardImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop",
    ctaLink: "/explorar",
    ctaLabel: "Explorar canchas",
  },
  {
    id: "p2",
    isPromo: true,
    title: "TORNEOS EN VIVO",
    subtitle: "INSCRIPCIÓN Y BRACKET ONLINE",
    description: "Anotate en torneos activos con tu equipo. Bracket, resultados y clasificaciones actualizados en tiempo real. Gratis para jugadores.",
    bgImage: "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?q=80&w=2000&auto=format&fit=crop",
    cardImage: "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?q=80&w=600&auto=format&fit=crop",
    ctaLink: "/torneos",
    ctaLabel: "Ver torneos",
  },
  {
    id: "p3",
    isPromo: true,
    title: "CANCHA LIBRE AHORA",
    subtitle: "DESCUENTOS DE ÚLTIMO MOMENTO",
    description: "Algunos complejos ofrecen descuentos express para horas libres. Aprovechá los mejores precios y jugá más por menos.",
    bgImage: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=2000&auto=format&fit=crop",
    cardImage: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=600&auto=format&fit=crop",
    ctaLink: "/explorar",
    ctaLabel: "Ver ofertas",
  },
  {
    id: "p4",
    isPromo: true,
    title: "MAPA INTERACTIVO",
    subtitle: "ENCONTRÁ CANCHAS CERCA",
    description: "Todos los complejos de tu ciudad en el mapa. Filtrá por deporte, horario y distancia. El GPS te muestra los más cercanos.",
    bgImage: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2000&auto=format&fit=crop",
    cardImage: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop",
    ctaLink: "/mapa",
    ctaLabel: "Ver mapa",
  },
];

const ALERTA_ACTIVA = { activa: false, nivel: "amarillo" as "amarillo" | "rojo", texto: "", tipo: "Mantenimiento" };

const ACCESO_RAPIDO = [
  { href: "/explorar",  icono: Compass,       titulo: "Explorar Complejos", descripcion: "Todos los complejos deportivos de tu ciudad",      colorIcono: "text-rodeo-lime" },
  { href: "/torneos",   icono: Star,           titulo: "Torneos",            descripcion: "Inscribite con tu equipo. Bracket en vivo.",        colorIcono: "text-yellow-400" },
  { href: "/partidos",  icono: Users,          titulo: "Armá Partido",       descripcion: "Publicá que te falta gente y jugá hoy mismo",       colorIcono: "text-orange-400" },
  { href: "/feed",      icono: MessageCircle,  titulo: "Feed Deportivo",     descripcion: "Novedades y promos de los complejos de tu ciudad",  colorIcono: "text-purple-400" },
];

const VENTAJAS = [
  { icono: Compass,      titulo: "Reserva en segundos",        descripcion: "Buscá tu cancha, elegí horario y confirmá directo por WhatsApp. Sin llamadas ni apps extra." },
  { icono: Trophy,       titulo: "Torneos con bracket online", descripcion: "Inscribite con tu equipo, seguí el fixture y resultados en tiempo real desde la app." },
  { icono: Zap,          titulo: "Descuentos express",         descripcion: "Canchas con descuento de último momento aparecen en el home. Jugás más por menos." },
  { icono: MapPin,       titulo: "Mapa inteligente",           descripcion: "Todos los complejos en el mapa. Filtrá por deporte y encontrá el más cercano." },
  { icono: BarChart3,    titulo: "Panel para dueños",          descripcion: "Gestioná tu complejo, canchas, torneos y reservas desde un panel completo." },
  { icono: CalendarDays, titulo: "Disponibilidad en vivo",     descripcion: "La disponibilidad de cada cancha se actualiza en tiempo real para que nunca pierdas un turno." },
];

function HeroUserButton() {
  const router = useRouter();
  const { user, profile, loading, signOut, isOwner, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSignOut = async () => { await signOut(); setOpen(false); router.push("/"); };

  // Render consistente server/client para evitar hydration mismatch
  if (!mounted || loading) return <div className="w-10 h-10 rounded-[12px] bg-white/10" />;

  if (!user) {
    return (
      <div className="relative">
        <button onClick={() => setOpen(!open)} style={{ background:"rgba(200,255,0,0.18)", border:"1px solid rgba(200,255,0,0.35)", borderRadius:"12px", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)" }}
          className="p-2.5 hover:bg-rodeo-lime/30 transition-all flex items-center justify-center">
          <User size={18} className="text-rodeo-lime" />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity:0, y:8, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:8, scale:0.95 }}
              className="absolute right-0 top-full mt-2 w-48 liquid-panel p-2 space-y-0.5 shadow-2xl z-50">
              <Link href="/login" onClick={() => setOpen(false)}>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] hover:bg-white/8 transition-colors text-white text-xs font-bold cursor-pointer">
                  <User size={13} className="text-rodeo-lime" /> Iniciar sesión
                </div>
              </Link>
              <Link href="/owner" onClick={() => setOpen(false)}>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] hover:bg-white/8 transition-colors text-rodeo-cream text-xs font-bold cursor-pointer mt-1 border-t border-white/10 pt-2">
                  <Building2 size={13} className="text-rodeo-lime" /> Panel Dueño
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} style={{ background:"rgba(200,255,0,0.18)", border:"1px solid rgba(200,255,0,0.35)", borderRadius:"12px", backdropFilter:"blur(20px)" }}
        className="p-2 flex items-center gap-1.5 hover:bg-rodeo-lime/30 transition-all">
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
          : <User size={16} className="text-rodeo-lime" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0, y:8, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:8, scale:0.95 }}
            className="absolute right-0 top-full mt-2 w-48 liquid-panel p-2 space-y-0.5 shadow-2xl z-50">
            <div className="px-3 py-2 border-b border-white/10 mb-1">
              <p className="text-xs font-bold text-white truncate">{profile?.nombre_completo || "Usuario"}</p>
              <p className="text-[10px] text-rodeo-cream/40 truncate">{user.email}</p>
            </div>
            {(isOwner || isAdmin) && (
              <Link href="/owner" onClick={() => setOpen(false)}>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] hover:bg-white/8 transition-colors text-rodeo-cream text-xs font-bold cursor-pointer">
                  <LayoutDashboard size={13} className="text-rodeo-lime" /> Panel Dueño
                </div>
              </Link>
            )}
            {!isOwner && !isAdmin && (
              <Link href="/perfil" onClick={() => setOpen(false)}>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] hover:bg-white/8 transition-colors text-rodeo-cream text-xs cursor-pointer">
                  <User size={13} className="text-rodeo-cream/60" /> Mi Perfil
                </div>
              </Link>
            )}
            <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] hover:bg-red-500/10 transition-colors text-red-400 text-xs font-bold text-left">
              <LogOut size={13} /> Cerrar sesión
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const { ciudadCorta, loading: cityLoading } = useCityContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [complejos, setComplejos] = useState<ComplejoRow[]>([]);
  const [stats, setStats] = useState({ complejos: 0, canchas: 0, deportes: 0 });
  const [torneosActivos, setTorneosActivos] = useState<{ id: string; nombre: string; slug: string; deporte: string; estado: string; fecha_inicio: string; imagen_url: string | null; complejo_nombre: string | null }[]>([]);
  const [canchasExpress, setCanchasExpress] = useState<{ id: string; nombre: string; deporte: string; precio_por_hora: number; descuento_pct: number; slug: string; complejo_nombre: string }[]>([]);
  const [promoSlides, setPromoSlides] = useState(PROMO_SLIDES);

  // Cargar slides desde app_config (admin puede editarlos desde /admin/home-config)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await (supabase as any).from("app_config").select("value").eq("key", "home_promo_slides").single();
        if (data?.value && Array.isArray(data.value) && (data.value as any[]).length > 0) {
          setPromoSlides((data.value as any[]).map((s: any) => ({
            id: s.id,
            isPromo: true,
            title: s.titulo ?? "",
            subtitle: s.subtitulo ?? "",
            description: s.descripcion ?? "",
            bgImage: s.imagen_url || PROMO_SLIDES[0].bgImage,
            cardImage: s.imagen_url || PROMO_SLIDES[0].cardImage,
            ctaLink: s.cta_link ?? "/explorar",
            ctaLabel: s.cta_label ?? "Explorar",
            video_url: s.video_url || null,
          })));
        }
      } catch { /* usa fallback hardcodeado */ }
    })();
  }, []);

  // Fetch complejos reales de la ciudad activa
  useEffect(() => {
    if (cityLoading) return;
    (async () => {
      const { data } = await supabase
        .from("complexes")
        .select("id, nombre, slug, deporte_principal, descripcion, imagen_principal, rating_promedio, ciudad")
        .eq("activo", true)
        .eq("ciudad", ciudadCorta)
        .order("rating_promedio", { ascending: false, nullsFirst: false })
        .limit(12);
      setComplejos((data as ComplejoRow[] | null) ?? []);
    })();
  }, [ciudadCorta, cityLoading]);

  // Fetch stats globales para la ciudad
  useEffect(() => {
    if (cityLoading) return;
    (async () => {
      const { data: comps } = await supabase
        .from("complexes")
        .select("id, deportes")
        .eq("activo", true)
        .eq("ciudad", ciudadCorta);

      const ids = (comps ?? []).map((c: { id: string }) => c.id);
      const { count: canchasCount } = ids.length
        ? await supabase.from("courts").select("id", { count: "exact", head: true }).in("complex_id", ids).eq("activa", true)
        : { count: 0 };

      const deportesSet = new Set<string>();
      (comps ?? []).forEach((c: { deportes?: string[] }) => (c.deportes ?? []).forEach(d => deportesSet.add(d)));

      setStats({ complejos: comps?.length ?? 0, canchas: canchasCount ?? 0, deportes: deportesSet.size });
    })();
  }, [ciudadCorta, cityLoading]);

  // Fetch torneos activos (registracion | en_curso) para la ciudad + realtime
  useEffect(() => {
    if (cityLoading) return;
    let mounted = true;

    const load = async () => {
      const { data: comps } = await supabase
        .from("complexes")
        .select("id, nombre")
        .eq("activo", true)
        .eq("ciudad", ciudadCorta);

      const complexMap: Record<string, string> = {};
      (comps ?? []).forEach((c: { id: string; nombre: string }) => { complexMap[c.id] = c.nombre; });
      const ids = Object.keys(complexMap);
      if (!ids.length) { if (mounted) setTorneosActivos([]); return; }

      const { data: tors } = await supabase
        .from("tournaments")
        .select("id, nombre, slug, deporte, estado, fecha_inicio, imagen_url, complex_id")
        .in("complex_id", ids)
        .in("estado", ["registracion", "en_curso"])
        .order("estado", { ascending: true }) // en_curso antes que registracion alfabeticamente
        .order("fecha_inicio", { ascending: true })
        .limit(8);

      if (mounted) {
        setTorneosActivos((tors ?? []).map((t: any) => ({
          ...t,
          complejo_nombre: complexMap[t.complex_id] ?? null,
        })));
      }
    };
    load();

    const channel = supabase
      .channel(`home-torneos-${ciudadCorta}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tournaments" }, () => load())
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [ciudadCorta, cityLoading]);

  // Fetch canchas express (descuento activo ahora)
  useEffect(() => {
    if (cityLoading) return;
    (async () => {
      const { data: comps } = await supabase
        .from("complexes")
        .select("id, nombre, slug")
        .eq("activo", true)
        .eq("ciudad", ciudadCorta);

      const ids = (comps ?? []).map((c: { id: string }) => c.id);
      if (!ids.length) return;

      const complexMap: Record<string, { nombre: string; slug: string }> = {};
      (comps ?? []).forEach((c: { id: string; nombre: string; slug: string }) => { complexMap[c.id] = { nombre: c.nombre, slug: c.slug }; });

      const { data: courts } = await supabase
        .from("courts")
        .select("id, nombre, deporte, precio_por_hora, descuento_pct, complex_id")
        .in("complex_id", ids)
        .eq("descuento_express", true)
        .eq("activa", true)
        .eq("estado", "disponible")
        .limit(8);

      setCanchasExpress(
        (courts ?? []).map((c: any) => ({
          ...c,
          slug: complexMap[c.complex_id]?.slug ?? "",
          complejo_nombre: complexMap[c.complex_id]?.nombre ?? "",
        }))
      );
    })();
  }, [ciudadCorta, cityLoading]);

  // Slider: intercala promos (desde app_config o fallback) con complejos reales
  const ALL_SLIDES = useMemo(() => {
    const realSlides = complejos.slice(0, promoSlides.length).map((c) => ({
      id: c.id,
      isPromo: false,
      title: c.nombre.toUpperCase(),
      subtitle: DEPORTE_LABEL[c.deporte_principal] ?? c.deporte_principal.toUpperCase(),
      description: c.descripcion ?? `Reservá canchas en ${c.nombre} en ${c.ciudad}.`,
      bgImage: c.imagen_principal ?? FALLBACK_IMG_BY_DEPORTE[c.deporte_principal] ?? FALLBACK_IMG_BY_DEPORTE.futbol,
      cardImage: c.imagen_principal ?? FALLBACK_IMG_BY_DEPORTE[c.deporte_principal] ?? FALLBACK_IMG_BY_DEPORTE.futbol,
      ctaLink: `/complejo/${c.slug}`,
      ctaLabel: "Reservar Cancha",
      video_url: null,
    }));
    return promoSlides.flatMap((promo, i) => {
      const complex = realSlides[i];
      return complex ? [promo, complex] : [promo];
    });
  }, [complejos, promoSlides]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (ALL_SLIDES.length ? (prev + 1) % ALL_SLIDES.length : 0));
  }, [ALL_SLIDES.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (ALL_SLIDES.length ? (prev - 1 + ALL_SLIDES.length) % ALL_SLIDES.length : 0));
  }, [ALL_SLIDES.length]);

  useEffect(() => {
    if (!ALL_SLIDES.length) return;
    const timer = setInterval(handleNext, 7000);
    return () => clearInterval(timer);
  }, [handleNext, ALL_SLIDES.length]);

  const activeItem = ALL_SLIDES[currentIndex] ?? PROMO_SLIDES[0];

  // Destacados: ordenados por rating (top 8)
  const destacados = useMemo(
    () => complejos.slice(0, 8).map(c => ({
      slug: c.slug,
      nombre: c.nombre,
      categoria: DEPORTE_LABEL[c.deporte_principal] ?? c.deporte_principal,
      rating: c.rating_promedio ?? 0,
      imagen: c.imagen_principal ?? FALLBACK_IMG_BY_DEPORTE[c.deporte_principal] ?? FALLBACK_IMG_BY_DEPORTE.futbol,
    })),
    [complejos]
  );

  const STATS_DISPLAY = [
    { valor: String(stats.complejos || 0), unidad: "+", descripcion: "Complejos deportivos disponibles" },
    { valor: String(stats.canchas || 0), unidad: "+", descripcion: "Canchas regulares" },
    { valor: String(stats.deportes || 0), unidad: "", descripcion: "Deportes diferentes" },
    { valor: "24/7", unidad: "", descripcion: "Reservas disponibles" },
  ];

  const alertaColor = ALERTA_ACTIVA.nivel === "rojo"
    ? { bg: "bg-red-500/20 border-y border-red-400/30", icono: "text-red-400", badge: "bg-red-500/20 text-red-400 border border-red-400/30" }
    : { bg: "bg-yellow-500/20 border-y border-yellow-400/30", icono: "text-yellow-400", badge: "bg-yellow-500/20 text-yellow-400 border border-yellow-400/30" };

  return (
    <div className="bg-rodeo-dark text-rodeo-cream font-sans">

      {/* HERO SLIDER */}
      <section className="relative h-screen overflow-hidden">
        <AnimatePresence mode="wait">
          {(activeItem as any).video_url ? (
            <motion.video
              key={activeItem.id + "-video"}
              src={(activeItem as any).video_url}
              autoPlay muted loop playsInline
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          ) : (
            <motion.img
              key={activeItem.id}
              src={activeItem.bgImage}
              alt="Background"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          )}
        </AnimatePresence>
        {/* Overlay multicapa — radial lime + gradient vertical, sin blur */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{
          background: [
            "radial-gradient(60% 50% at 75% 0%, rgba(200,255,0,0.12), transparent 70%)",
            "radial-gradient(40% 50% at 10% 100%, rgba(0,230,118,0.08), transparent 60%)",
            "linear-gradient(180deg, rgba(4,13,7,0.3) 0%, rgba(4,13,7,0.2) 50%, rgba(4,13,7,0.78) 100%)",
          ].join(", "),
        }} />
        {/* Grain texture */}
        <div className="absolute inset-0 z-0 opacity-40 bg-grain" />

        {/* NAVBAR — flotante sin fondo, elementos directamente sobre el hero */}
        <header className="absolute top-0 w-full px-6 md:px-12 py-5 flex justify-between items-center z-20">
          <img
            src="/assets/logo-main.png"
            alt="ElPiqueApp"
            style={{ filter: "drop-shadow(0 0 16px rgba(200,255,0,0.35))" }}
            className="h-28 md:h-36 w-auto"
          />
          <nav className="hidden md:flex gap-10 text-xs font-bold tracking-[0.2em] text-white/90"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}
          >
            <Link href="/explorar" className="hover:text-rodeo-lime transition-colors">EXPLORAR</Link>
            <Link href="/mapa" className="hover:text-rodeo-lime transition-colors">MAPA</Link>
            <Link href="/torneos" className="hover:text-rodeo-lime transition-colors">TORNEOS</Link>
            <Link href="/feed" className="hover:text-rodeo-lime transition-colors">FEED</Link>
            <Link href="/owner" className="text-rodeo-lime hover:text-white transition-colors">PANEL DUEÑO</Link>
          </nav>
          <div className="flex gap-2 items-center">
            <button
              style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:"12px", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)" }}
              className="p-2.5 hover:bg-white/25 transition-all"
            >
              <Search size={18} className="text-white" />
            </button>
            <HeroUserButton />
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="absolute inset-0 z-10 flex pt-36 pb-28">
          {/* PANEL IZQUIERDO */}
          <div className="w-full md:w-[45%] pl-6 md:pl-24 flex flex-col justify-center pr-6 md:pr-0 relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col gap-4"
              >
                <span className="eyebrow" style={{ color: "rgba(232,240,228,0.82)" }}>
                  {activeItem.subtitle}
                </span>
                <h1 className="font-display" style={{ fontSize: "clamp(48px, 8vw, 96px)", color: "#fff", margin: "10px 0 0", maxWidth: 640 }}>
                  {activeItem.title}
                </h1>
                <p className="text-base md:text-lg text-rodeo-cream/90 max-w-md mt-2 font-light leading-relaxed">
                  {activeItem.description}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <Link href={(activeItem as { ctaLink: string }).ctaLink} className="liquid-button inline-flex items-center gap-3 text-sm font-bold tracking-widest uppercase w-fit">
                    <MapPin size={18} />
                    {(activeItem as { ctaLabel: string }).ctaLabel}
                  </Link>
                  {(activeItem as { isPromo?: boolean }).isPromo && (
                    <span className="text-[10px] font-bold tracking-widest text-rodeo-lime/60 uppercase px-2 py-1 rounded-full border border-rodeo-lime/20 bg-rodeo-lime/5">
                      ElPiqueApp
                    </span>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* PANEL DERECHO: CARRUSEL */}
          <div
            className="hidden md:flex w-[55%] items-center pl-10 py-16"
            style={{ clipPath: 'inset(-80px -100vw -80px 0)' }}
          >
            <motion.div
              className="flex gap-6 items-center"
              animate={{ x: `calc(-${currentIndex * 320}px - ${currentIndex * 24}px)` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {ALL_SLIDES.map((slide, index) => {
                const isActive = index === currentIndex;
                const isPromo = (slide as { isPromo?: boolean }).isPromo;
                return (
                  <motion.div
                    key={slide.id}
                    animate={{ scale: isActive ? 1 : 0.82, opacity: isActive ? 1 : 0.45, y: isActive ? 0 : 12 }}
                    transition={{ duration: 0.4 }}
                    style={{ transformOrigin: "center center" }}
                    className="w-[320px] h-[460px] shrink-0 rounded-liquid-lg overflow-hidden relative cursor-pointer group shadow-glass border border-white/20"
                    onClick={() => setCurrentIndex(index)}
                  >
                    <img src={(slide as { cardImage: string }).cardImage} alt={slide.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className={`absolute inset-0 ${isPromo ? "bg-gradient-to-t from-black/90 via-rodeo-dark/60 to-rodeo-lime/10" : "bg-gradient-to-t from-black/80 via-black/20 to-transparent"}`} />
                    {isPromo && (
                      <div className="absolute top-4 left-4">
                        <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full bg-rodeo-lime text-rodeo-dark">
                          ElPiqueApp
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 p-8">
                      <span className="text-xs font-bold tracking-widest text-rodeo-cream/80 uppercase mb-2 block">{slide.subtitle}</span>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight">{slide.title}</h3>
                      {isPromo && (
                        <span className="mt-3 inline-block text-xs text-rodeo-lime font-bold">
                          {(slide as { ctaLabel: string }).ctaLabel} →
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </main>

        {/* CONTROLES — en mobile subimos para que no queden tapados por el BottomNav */}
        <footer className="absolute bottom-28 md:bottom-10 w-full px-6 md:px-24 flex justify-between items-end z-20">
          <div className="flex gap-4">
            <button onClick={handlePrev} className="w-12 h-12 rounded-full border border-white/30 bg-white/5 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-colors">
              <ChevronLeft size={24} />
            </button>
            <button onClick={handleNext} className="w-12 h-12 rounded-full border border-white/30 bg-white/5 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-colors">
              <ChevronRight size={24} />
            </button>
          </div>
          <div className="font-display" style={{ fontSize: "clamp(72px, 12vw, 128px)", color: "rgba(255,255,255,0.14)", letterSpacing: "-0.02em", lineHeight: "0.8" }}>
            0{currentIndex + 1}
          </div>
        </footer>

        <div className="absolute hidden md:flex bottom-6 left-1/2 -translate-x-1/2 z-20 flex-col items-center gap-1.5">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown size={20} className="text-white/40" />
          </motion.div>
          <span className="text-[10px] tracking-widest text-white/30 uppercase">Deslizá para conocer más</span>
        </div>
      </section>

      {/* ALERTA */}
      {ALERTA_ACTIVA.activa && (
        <section className={`${alertaColor.bg} px-6 py-4`}>
          <div className="max-w-4xl mx-auto flex items-start gap-4">
            <AlertTriangle size={20} className={`${alertaColor.icono} shrink-0 mt-0.5`} />
            <p className="text-sm text-rodeo-cream/90 leading-relaxed flex-1">{ALERTA_ACTIVA.texto}</p>
            <span className={`${alertaColor.badge} text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full shrink-0`}>{ALERTA_ACTIVA.tipo}</span>
          </div>
        </section>
      )}

      {/* ACCESO RÁPIDO */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display mb-6" style={{ fontSize: "clamp(28px, 4vw, 40px)", color: "#fff" }}>
            <span className="section-slash">/</span>Acceso Rápido
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ACCESO_RAPIDO.map((item) => {
              const Icono = item.icono;
              return (
                <Link key={item.href} href={item.href}>
                  <div className="liquid-panel p-5 flex flex-col gap-3 hover:bg-white/10 transition-colors cursor-pointer h-full">
                    <Icono size={28} className={item.colorIcono} />
                    <div>
                      <p className="text-sm font-bold text-white">{item.titulo}</p>
                      <p className="text-xs text-rodeo-cream/40 mt-0.5 leading-relaxed">{item.descripcion}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* TORNEOS EN VIVO / ABIERTOS */}
      {torneosActivos.length > 0 && (
        <section className="px-6 py-12 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display" style={{ fontSize: "clamp(28px, 4vw, 40px)", color: "#fff" }}>
                <span className="section-slash">/</span>Torneos Activos
              </h2>
              <Link href="/torneos" className="text-xs font-black text-rodeo-lime hover:underline">Ver todos →</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth scrollbar-thin">
              {torneosActivos.map((t) => {
                const esVivo = t.estado === "en_curso";
                return (
                  <Link key={t.id} href={`/torneos/${t.slug}`}
                    className="w-72 shrink-0 liquid-panel overflow-hidden hover:bg-white/10 transition-colors snap-start group">
                    <div className="h-32 overflow-hidden relative bg-white/5">
                      {t.imagen_url ? (
                        <img src={t.imagen_url} alt={t.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Trophy size={32} className="text-rodeo-lime/40"/>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-rodeo-dark/80 via-transparent to-transparent"/>
                      <div className="absolute top-2 left-2">
                        {esVivo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/90 text-white">
                            <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"/><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"/></span>
                            EN VIVO
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-green-500/90 text-rodeo-dark">INSCRIPCIÓN ABIERTA</span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] font-black tracking-widest uppercase text-rodeo-lime mb-1">{t.deporte}</p>
                      <h3 className="text-sm font-bold text-white leading-tight line-clamp-2">{t.nombre}</h3>
                      {t.complejo_nombre && (
                        <p className="text-[11px] text-rodeo-cream/50 mt-1.5 truncate">{t.complejo_nombre}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CANCHA LIBRE AHORA */}
      {canchasExpress.length > 0 && (
        <section className="px-6 py-12 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="font-display" style={{ fontSize: "clamp(28px, 4vw, 40px)", color: "#fff" }}>
                  <span className="section-slash">/</span>Cancha Libre Ahora
                </h2>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black"
                  style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.35)", color: "#FBbf24" }}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"/>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-400"/>
                  </span>
                  DESCUENTO EXPRESS
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {canchasExpress.map((cancha) => {
                const precioFinal = Math.round(cancha.precio_por_hora * (1 - cancha.descuento_pct / 100));
                return (
                  <Link key={cancha.id} href={`/complejo/${cancha.slug}`}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      style={{
                        background: "rgba(251,191,36,0.06)",
                        border: "1px solid rgba(251,191,36,0.25)",
                        borderRadius: "16px",
                      }}
                      className="p-4 flex flex-col gap-3 cursor-pointer hover:bg-yellow-400/10 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-black tracking-widest uppercase text-yellow-400/70">{cancha.deporte}</p>
                          <p className="text-sm font-bold text-white mt-0.5">{cancha.nombre}</p>
                          <p className="text-xs text-rodeo-cream/40 mt-0.5 truncate">{cancha.complejo_nombre}</p>
                        </div>
                        <span className="text-xs font-black px-2 py-1 rounded-lg shrink-0"
                          style={{ background: "rgba(251,191,36,0.2)", color: "#FBbf24" }}>
                          -{cancha.descuento_pct}%
                        </span>
                      </div>
                      <div className="flex items-end gap-2">
                        <p className="text-xl font-black text-white">${precioFinal.toLocaleString("es-AR")}</p>
                        <p className="text-xs text-rodeo-cream/35 line-through mb-0.5">${cancha.precio_por_hora.toLocaleString("es-AR")}</p>
                        <p className="text-xs text-rodeo-cream/40 mb-0.5">/h</p>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* STATS */}
      <section className="px-6 py-12 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display mb-8" style={{ fontSize: "clamp(28px, 4vw, 40px)", color: "#fff" }}>
            <span className="section-slash">/</span>ElPiqueApp en Números
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {STATS_DISPLAY.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} className="flex flex-col gap-1">
                <div className="font-display" style={{ fontSize: 44, color: "#fff", lineHeight: "0.95", letterSpacing: "-0.02em" }}>
                  {stat.valor}
                  {stat.unidad && <span style={{ fontSize: 28, color: "#C8FF00" }}>{stat.unidad}</span>}
                </div>
                <p className="text-xs text-rodeo-cream/50 leading-relaxed">{stat.descripcion}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPLEJOS DESTACADOS */}
      <section className="py-12 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display px-6 mb-6" style={{ fontSize: "clamp(28px, 4vw, 40px)", color: "#fff" }}>
            <span className="section-slash">/</span>Complejos Destacados
          </h2>
          {destacados.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto px-6 pb-4 snap-x snap-mandatory scroll-smooth scrollbar-thin">
              {destacados.map((lugar) => (
                <Link key={lugar.slug} href={`/complejo/${lugar.slug}`} className="w-64 shrink-0 liquid-panel overflow-hidden hover:bg-white/10 transition-colors snap-start">
                  <div className="h-40 overflow-hidden">
                    <img src={lugar.imagen} alt={lugar.nombre} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-rodeo-cream/40 mb-1">{lugar.categoria}</p>
                    <h3 className="text-sm font-bold text-white leading-tight">{lugar.nombre}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Star size={11} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-rodeo-cream/60">{lugar.rating ? lugar.rating.toFixed(1) : "—"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-6">
              <div className="liquid-panel p-8 text-center">
                <p className="text-rodeo-cream/60 text-sm">Todavía no hay complejos en {ciudadCorta}.</p>
                <Link href="/registro/dueno" className="inline-block mt-3 text-xs text-rodeo-lime font-bold hover:underline">
                  ¿Sos dueño? Registrá tu complejo →
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* QUÉ ES ELPIQUEAPP */}
      <section className="px-6 py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
          >
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rodeo-lime/10 border border-rodeo-lime/20 text-rodeo-lime text-xs font-bold tracking-widest uppercase">
                <Zap size={12} /> ¿Qué es ElPiqueApp?
              </div>
              <h2 className="font-display" style={{ fontSize: "clamp(32px, 5vw, 52px)", color: "#fff" }}>
                La app deportiva<br/>de Catamarca
              </h2>
              <p className="text-rodeo-cream/70 leading-relaxed">
                ElPiqueApp conecta jugadores con complejos deportivos de Catamarca. Encontrás la cancha, reservás por WhatsApp y te anotás en torneos — todo desde la app, sin llamadas ni complicaciones.
              </p>
              <p className="text-rodeo-cream/70 leading-relaxed">
                Para dueños de complejos es la herramienta completa: canchas, reservas, torneos con bracket online, descuentos express y feed para llegar a la comunidad — en un panel dedicado.
              </p>
              <div className="flex flex-col gap-3 pt-2">
                {[
                  "Reservas vía WhatsApp sin intermediarios",
                  "Torneos con inscripción y bracket online",
                  "Descuentos express para llenar horas vacías",
                  "Feed deportivo de tu ciudad",
                  "Mapa interactivo con todos los complejos",
                  "Panel completo para dueños",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-rodeo-lime shrink-0" />
                    <span className="text-sm text-rodeo-cream/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: MessageCircle, label: "Reservas por WhatsApp",     desc: "Confirmación instantánea sin intermediarios" },
                { icon: Trophy,        label: "Torneos con bracket",        desc: "Inscripción y resultados en tiempo real" },
                { icon: Zap,           label: "Descuentos express",         desc: "Horas libres con precio rebajado" },
                { icon: MapPin,        label: "Mapa interactivo",           desc: "Encontrá complejos cerca tuyo" },
                { icon: CalendarDays,  label: "Disponibilidad en vivo",     desc: "Ves qué horarios están libres ahora" },
                { icon: BarChart3,     label: "Panel para dueños",          desc: "Canchas, reservas y torneos en un lugar" },
              ].map((item, i) => {
                const Icono = item.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="liquid-panel p-4 space-y-2"
                  >
                    <Icono size={22} className="text-rodeo-lime" />
                    <p className="text-white text-xs font-bold leading-tight">{item.label}</p>
                    <p className="text-rodeo-cream/50 text-[11px] leading-relaxed">{item.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* PARA DUEÑOS — PRICING */}
      <section className="px-6 py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-rodeo-cream/60 text-xs font-bold tracking-widest uppercase">
              Para dueños de complejos
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
              Sumá tu complejo a ElPiqueApp
            </h2>
            <p className="text-rodeo-cream/60 max-w-xl mx-auto">
              Una sola licencia, todas las herramientas. Con un mes gratis para que lo pruebes sin comprometerte.
            </p>
          </motion.div>

          {/* Cards de precio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {/* Mensual */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="liquid-panel p-6 space-y-4"
            >
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40">Plan Mensual</p>
                <div className="flex items-end gap-1 mt-2">
                  <span className="text-4xl font-black text-white">$60.000</span>
                  <span className="text-rodeo-cream/50 text-sm mb-1">/mes</span>
                </div>
              </div>
              <p className="text-xs text-rodeo-cream/50">Cancelás cuando querés. Sin contratos.</p>
              <Link href="/login" className="liquid-button block text-center text-sm font-bold text-rodeo-cream">
                Empezar prueba gratis
              </Link>
            </motion.div>

            {/* Anual — destacado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="liquid-panel p-6 space-y-4 relative border-rodeo-lime/30 bg-gradient-to-br from-rodeo-lime/10 to-transparent"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-rodeo-lime text-rodeo-dark text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase">
                  Ahorrás 2 meses
                </span>
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-rodeo-lime/70">Plan Anual</p>
                <div className="flex items-end gap-1 mt-2">
                  <span className="text-4xl font-black text-white">$600.000</span>
                  <span className="text-rodeo-cream/50 text-sm mb-1">/año</span>
                </div>
                <p className="text-xs text-rodeo-lime/80 mt-1">≈ $50.000/mes — 2 meses gratis vs mensual</p>
              </div>
              <p className="text-xs text-rodeo-cream/50">Pago único anual. Máximo ahorro.</p>
              <Link href="/login" className="block text-center text-sm font-black py-3 rounded-liquid bg-rodeo-lime text-rodeo-dark hover:bg-rodeo-lime/80 transition-all">
                Empezar prueba gratis
              </Link>
            </motion.div>
          </div>

          {/* 1 mes gratis banner */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="liquid-panel p-5 max-w-2xl mx-auto flex items-center gap-4 border-rodeo-lime/20"
          >
            <div className="text-3xl shrink-0">🎁</div>
            <div>
              <p className="text-white font-bold text-sm">1 mes gratis para probar</p>
              <p className="text-rodeo-cream/60 text-xs mt-0.5">Registrá tu complejo, configurá todo y usá la plataforma completa sin pagar nada el primer mes. Sin tarjeta requerida.</p>
            </div>
          </motion.div>

          {/* Ventajas competitivas */}
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display mb-6 text-center" style={{ fontSize: "clamp(28px, 4vw, 40px)", color: "#fff" }}>
              <span className="section-slash">/</span>¿Por qué ElPiqueApp?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {[
                { icon: Zap, highlight: "Canchas ilimitadas", text: "Sin límite de canchas por complejo. Agregá todas las que tenés." },
                { icon: MessageCircle, highlight: "Feed publicitario gratis", text: "Publicá novedades, promos y torneos en el feed visible para todos los jugadores." },
                { icon: Trophy, highlight: "Torneos gratis incluidos", text: "Creá y gestioná torneos desde el panel sin costo adicional." },
                { icon: QrCode, highlight: "QR + link propio", text: "Tu complejo con URL propia y código QR descargable para compartir." },
                { icon: CalendarDays, highlight: "Disponibilidad en tiempo real", text: "Los jugadores ven qué canchas están libres en cada horario, sin llamadas." },
                { icon: MapPin, highlight: "Visibilidad en el mapa", text: "Aparecé en el mapa de ElPiqueApp con toda la info de tu complejo." },
                { icon: BarChart3, highlight: "Estadísticas y reportes", text: "Visualizá ocupación, canchas más reservadas y tendencias de uso." },
                { icon: Star, highlight: "Reseñas verificadas", text: "Acumulá reseñas reales de jugadores que refuercen tu reputación." },
              ].map((item, i) => {
                const Icono = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/5">
                    <div className="p-1.5 rounded-lg bg-rodeo-lime/15 mt-0.5">
                      <Icono size={14} className="text-rodeo-lime shrink-0" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.highlight}</p>
                      <p className="text-xs text-rodeo-cream/50 mt-0.5">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-12 pb-24 md:pb-12 bg-black/20">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <img src="/assets/logo-main.png" alt="ElPiqueApp" className="h-20 w-auto" style={{ filter: "drop-shadow(0 0 8px rgba(200,255,0,0.2))" }} />
          <p className="text-xs text-rodeo-cream/30 tracking-widest uppercase text-center">Reserva canchas deportivas en Catamarca · 24/7 disponible</p>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {[{ href: "/explorar", label: "Explorar" }, { href: "/mapa", label: "Mapa" }, { href: "/torneos", label: "Torneos" }, { href: "/perfil", label: "Mi Perfil" }, { href: "/owner", label: "Panel Dueño" }].map((link) => (
              <Link key={link.href} href={link.href} className="text-xs text-rodeo-cream/30 hover:text-rodeo-cream/70 transition-colors">{link.label}</Link>
            ))}
          </nav>
          <div className="flex gap-4 text-[11px] text-rodeo-cream/30">
            <Link href="/privacidad" className="hover:text-rodeo-cream/60 transition-colors">Privacidad</Link>
            <span>·</span>
            <Link href="/terminos" className="hover:text-rodeo-cream/60 transition-colors">Términos</Link>
          </div>
          <p className="text-[10px] text-rodeo-cream/20 text-center">© 2026 ElPiqueApp · Plataforma de Reservas Deportivas Catamarca</p>
        </div>
      </footer>
    </div>
  );
}
