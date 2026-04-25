"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft, LogOut, Building2, User, Star,
  Calendar, MapPin, Loader, ArrowRight, Heart, Zap, Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase";

type Tab = "reservas" | "partidos" | "favoritos" | "resenas";

export default function PerfilPage() {
  const { user, profile, loading, signOut, isOwner, isAuthenticated } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("reservas");
  const [loggingOut, setLoggingOut] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [reservaciones, setReservaciones] = useState<Array<{
    id: string; fecha: string; hora_inicio: string; hora_fin: string;
    estado: string; precio_total: number; complex_id: string | null;
    court: { nombre: string; deporte: string } | null;
    complex: { nombre: string } | null;
  }>>([]);
  const [misReviews, setMisReviews] = useState<Array<{
    id: string; estrellas: number; texto: string | null; created_at: string;
    complex: { nombre: string } | null;
  }>>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [misPartidos, setMisPartidos] = useState<Array<{
    id: string; deporte: string; fecha: string; hora_inicio: string;
    estado: string; slots_totales: number; slots_ocupados: number;
    complejo_nombre: string | null; ciudad: string; creador_id: string;
    creador_nombre: string | null; fecha_confirmada: boolean;
  }>>([]);
  const [misFavoritos, setMisFavoritos] = useState<Array<{
    id: string; complex_id: string; complex: { nombre: string; slug: string; imagen_principal: string | null; deporte_principal: string } | null;
  }>>([]);

  useEffect(() => {
    if (!user?.id) return;
    setLoadingData(true);
    Promise.all([
      supabase
        .from("reservations")
        .select("id, fecha, hora_inicio, hora_fin, estado, precio_total, complex_id, court:courts(nombre, deporte), complex:complexes(nombre)")
        .eq("user_id", user.id)
        .order("fecha", { ascending: false })
        .limit(20),
      supabase
        .from("reviews")
        .select("id, estrellas, texto, created_at, complex:complexes(nombre)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      (supabase as any)
        .from("favoritos")
        .select("id, complex_id, complex:complexes(nombre, slug, imagen_principal, deporte_principal)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      // Partidos donde el usuario está inscripto
      supabase
        .from("partido_jugadores")
        .select("partido_id")
        .eq("user_id", user.id)
        .limit(30),
    ]).then(async ([resRes, revRes, favRes, pjRes]) => {
      setReservaciones((resRes.data as any) ?? []);
      setMisReviews((revRes.data as any) ?? []);
      setMisFavoritos((favRes.data as any) ?? []);

      const pids = ((pjRes.data as any) ?? []).map((r: any) => r.partido_id);
      if (pids.length > 0) {
        const { data: pData } = await supabase
          .from("partidos")
          .select("id, deporte, fecha, hora_inicio, estado, slots_totales, slots_ocupados, ciudad, complex_id, creador_id, fecha_confirmada")
          .in("id", pids)
          .order("fecha", { ascending: false });

        const rows = (pData ?? []) as any[];
        const creadorIds = [...new Set(rows.map((p: any) => p.creador_id).filter(Boolean))];
        const complexIds = [...new Set(rows.map((p: any) => p.complex_id).filter(Boolean))];

        const [perfilesRes, complejosRes] = await Promise.all([
          creadorIds.length ? supabase.from("profiles").select("id, nombre_completo").in("id", creadorIds) : Promise.resolve({ data: [] }),
          complexIds.length ? supabase.from("complexes").select("id, nombre").in("id", complexIds) : Promise.resolve({ data: [] }),
        ]);

        const perfilMap = Object.fromEntries(((perfilesRes.data ?? []) as any[]).map((p: any) => [p.id, p.nombre_completo]));
        const complejoMap = Object.fromEntries(((complejosRes.data ?? []) as any[]).map((c: any) => [c.id, c.nombre]));

        setMisPartidos(rows.map((p: any) => ({
          ...p,
          creador_nombre: perfilMap[p.creador_id] ?? null,
          complejo_nombre: p.complex_id ? (complejoMap[p.complex_id] ?? null) : null,
        })));
      }
    }).catch(() => {
      // datos quedan vacíos, la UI muestra el estado vacío normalmente
    }).finally(() => {
      setLoadingData(false);
    });
  }, [user?.id]);

  const handleGoogleLogin = async () => {
    try {
      setLoginLoading(true);
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    window.location.href = "/";
  };

  const iniciales = profile?.nombre_completo
    ? profile.nombre_completo.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "?";

  const rolLabel = profile?.rol === "propietario" ? "Propietario" : profile?.rol === "admin" ? "Admin" : "Jugador";
  const rolColor = profile?.rol === "propietario" ? "#C8FF00" : profile?.rol === "admin" ? "#FF6B35" : "#60A5FA";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark flex items-center justify-center">
        <Loader size={32} className="animate-spin text-rodeo-lime" />
      </div>
    );
  }

  // ── NO AUTENTICADO ──────────────────────────────────────────────
  if (!isAuthenticated) {
    if (typeof window !== "undefined") {
      window.location.href = "/login?redirect=/perfil";
    }
    return (
      <div className="min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark flex items-center justify-center">
        <Loader size={32} className="animate-spin text-rodeo-lime" />
      </div>
    );
  }

  // ── AUTENTICADO ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark pb-32">
      <div className="max-w-lg mx-auto px-6 pt-8 space-y-6">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-rodeo-cream/50 hover:text-rodeo-cream transition-colors text-sm">
          <ChevronLeft size={16} /> Inicio
        </Link>

        {/* Card de usuario */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="liquid-panel p-6">
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-rodeo-lime/40 object-cover" />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black"
                style={{ background: "linear-gradient(135deg, rgba(200,255,0,0.2), rgba(200,255,0,0.08))", border: "2px solid rgba(200,255,0,0.3)", color: "#C8FF00" }}
              >
                {iniciales}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "22px", letterSpacing: "-0.01em", textTransform: "uppercase", lineHeight: 1 }} className="text-white truncate">
                {profile?.nombre_completo || user?.email?.split("@")[0]}
              </p>
              <p className="text-sm text-rodeo-cream/50 truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: `${rolColor}18`, border: `1px solid ${rolColor}30`, color: rolColor }}
                >
                  {rolLabel}
                </span>
                {profile?.ciudad && (
                  <span className="flex items-center gap-1 text-xs text-rodeo-cream/40">
                    <MapPin size={11} /> {profile.ciudad}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botón panel dueño */}
          {isOwner && (
            <Link
              href="/owner"
              className="mt-4 flex items-center justify-between px-5 py-3 rounded-[18px] font-bold text-sm"
              style={{
                background: "linear-gradient(135deg, rgba(200,255,0,0.15) 0%, rgba(200,255,0,0.06) 100%)",
                border: "1px solid rgba(200,255,0,0.3)",
                color: "#C8FF00",
                boxShadow: "0 0 20px rgba(200,255,0,0.08)",
              }}
            >
              <div className="flex items-center gap-2">
                <Building2 size={16} />
                Panel de Gestión
              </div>
              <ArrowRight size={16} />
            </Link>
          )}
        </motion.div>

        {/* Tabs */}
        <div
          className="flex rounded-[16px] p-1"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {([["reservas", "Reservas", Calendar], ["partidos", "Partidos", Users], ["favoritos", "Favoritos", Heart], ["resenas", "Reseñas", Star]] as const).map(([t, label, Icon]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-sm font-bold transition-all"
              style={tab === t
                ? { background: "rgba(200,255,0,0.15)", border: "1px solid rgba(200,255,0,0.25)", color: "#C8FF00" }
                : { color: "rgba(232,240,228,0.5)" }
              }
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Contenido de tab */}
        {tab === "reservas" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {loadingData ? (
              <div className="liquid-panel p-8 flex justify-center">
                <Loader size={24} className="animate-spin text-rodeo-lime" />
              </div>
            ) : reservaciones.length === 0 ? (
              <div className="liquid-panel p-8 text-center space-y-3">
                <Calendar size={32} className="mx-auto text-rodeo-lime/40" />
                <p className="text-rodeo-cream/50 text-sm">No tenés reservas aún</p>
                <Link href="/explorar" className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-[14px] text-sm font-bold"
                  style={{ background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.2)", color: "#C8FF00" }}>
                  Explorar canchas <ArrowRight size={14} />
                </Link>
              </div>
            ) : reservaciones.map((r) => {
              const estadoColor: Record<string, string> = { pendiente: "#FFB300", confirmada: "#00E676", cancelada: "#FF4040", completada: "#40C4FF" };
              const c = r.court as any;
              const cx = r.complex as any;
              const today = new Date().toISOString().slice(0, 10);
              const puedeAbrirPartido = r.estado === "confirmada" && r.fecha >= today;
              const deporteCancha = c?.deporte ?? "futbol";
              return (
                <div key={r.id} className="liquid-panel p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{c?.nombre ?? "Cancha"}</p>
                      <p className="text-xs text-rodeo-cream/50 truncate">{cx?.nombre}</p>
                      <p className="text-xs text-rodeo-cream/40 mt-0.5">{r.fecha} · {r.hora_inicio}–{r.hora_fin}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-white">$ {r.precio_total.toLocaleString()}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${estadoColor[r.estado]}18`, color: estadoColor[r.estado] }}>
                        {r.estado}
                      </span>
                    </div>
                  </div>
                  {puedeAbrirPartido && (
                    <button
                      onClick={() => {
                        const params = new URLSearchParams({
                          fecha: r.fecha,
                          hora: r.hora_inicio,
                          deporte: deporteCancha,
                          ...(r.complex_id ? { complex_id: r.complex_id } : {}),
                        });
                        router.push(`/partidos?${params.toString()}`);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-[10px] text-xs font-black transition-all"
                      style={{ background: "rgba(200,255,0,0.08)", border: "1px solid rgba(200,255,0,0.2)", color: "#C8FF00" }}>
                      <Zap size={13} /> Abrir partido desde esta reserva
                    </button>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {tab === "partidos" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {loadingData ? (
              <div className="liquid-panel p-8 flex justify-center">
                <Loader size={24} className="animate-spin text-rodeo-lime" />
              </div>
            ) : misPartidos.length === 0 ? (
              <div className="liquid-panel p-8 text-center space-y-3">
                <Users size={32} className="mx-auto text-rodeo-lime/40" />
                <p className="text-rodeo-cream/50 text-sm">No participaste en ningún partido aún</p>
                <Link href="/partidos" className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-[14px] text-sm font-bold"
                  style={{ background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.2)", color: "#C8FF00" }}>
                  Ver partidos <ArrowRight size={14} />
                </Link>
              </div>
            ) : misPartidos.map((p) => {
              const today = new Date().toISOString().slice(0, 10);
              const esPasado = p.fecha < today;
              const DEPORTE_COLOR: Record<string, string> = {
                futbol: "#C8FF00", padel: "#00E5FF", tenis: "#FFD600",
                voley: "#FF6B35", basquet: "#FF4081", hockey: "#A78BFA",
              };
              const DEPORTE_EMOJI: Record<string, string> = {
                futbol: "⚽", padel: "🎾", tenis: "🏸", voley: "🏐", basquet: "🏀", hockey: "🏑",
              };
              const color = DEPORTE_COLOR[p.deporte] ?? "#C8FF00";
              const emoji = DEPORTE_EMOJI[p.deporte] ?? "🏅";
              const estadoMeta: Record<string, { label: string; color: string }> = {
                abierto:  { label: "Abierto",   color: "#C8FF00" },
                completo: { label: "Completo",  color: "#00E676" },
                cancelado:{ label: "Cancelado", color: "#FF4040" },
              };
              const estado = estadoMeta[p.estado] ?? estadoMeta.abierto;
              const isCreador = p.creador_id === user?.id;
              const libres = p.slots_totales - p.slots_ocupados;

              return (
                <div key={p.id} className="liquid-panel p-4 space-y-3"
                  style={{ borderLeft: `3px solid ${esPasado ? "rgba(255,255,255,0.08)" : color + "60"}`, opacity: esPasado ? 0.6 : 1 }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-black text-sm" style={{ color }}>{emoji} {p.deporte.charAt(0).toUpperCase() + p.deporte.slice(1)}</span>
                        {isCreador && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(225,212,194,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            TU PARTIDO
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${estado.color}15`, color: estado.color, border: `1px solid ${estado.color}30` }}>
                          {esPasado ? "Finalizado" : estado.label}
                        </span>
                      </div>
                      <p className="text-xs text-rodeo-cream/50">
                        {p.fecha_confirmada ? p.fecha : "Fecha a confirmar"} · {p.hora_inicio.slice(0, 5)} hs
                      </p>
                      {p.complejo_nombre && (
                        <p className="text-xs text-rodeo-cream/40 mt-0.5">{p.complejo_nombre}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black" style={{ color: libres === 0 ? "#00E676" : "rgba(225,212,194,0.6)" }}>
                        {p.slots_ocupados}/{p.slots_totales}
                      </p>
                      <p className="text-[10px] text-rodeo-cream/30">{libres > 0 ? `${libres} libres` : "completo"}</p>
                    </div>
                  </div>
                  {!esPasado && p.estado !== "cancelado" && (
                    <Link href="/partidos"
                      className="flex items-center justify-center gap-2 py-2 rounded-[10px] text-xs font-bold transition-all"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(225,212,194,0.5)" }}>
                      Ver en partidos →
                    </Link>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {tab === "favoritos" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {loadingData ? (
              <div className="liquid-panel p-8 flex justify-center">
                <Loader size={24} className="animate-spin text-rodeo-lime" />
              </div>
            ) : misFavoritos.length === 0 ? (
              <div className="liquid-panel p-8 text-center space-y-3">
                <Heart size={32} className="mx-auto text-rodeo-lime/40" />
                <p className="text-rodeo-cream/50 text-sm">No tenés favoritos aún</p>
                <p className="text-xs text-rodeo-cream/30">Tocá el corazón en el detalle de un complejo para guardarlo</p>
                <Link href="/explorar" className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-[14px] text-sm font-bold"
                  style={{ background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.2)", color: "#C8FF00" }}>
                  Explorar complejos <ArrowRight size={14} />
                </Link>
              </div>
            ) : misFavoritos.map((fav) => {
              const cx = fav.complex as any;
              return (
                <Link key={fav.id} href={`/complejo/${cx?.slug ?? ""}`}
                  className="liquid-panel p-4 flex items-center gap-4 hover:bg-white/6 transition-colors">
                  <div className="w-14 h-14 rounded-[12px] overflow-hidden shrink-0 bg-white/5">
                    {cx?.imagen_principal
                      ? <img src={cx.imagen_principal} alt={cx.nombre} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Building2 size={20} className="text-rodeo-cream/20" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{cx?.nombre ?? "Complejo"}</p>
                    <p className="text-xs text-rodeo-cream/40 capitalize mt-0.5">{cx?.deporte_principal ?? "Deporte"}</p>
                  </div>
                  <Heart size={16} className="fill-red-400 text-red-400 shrink-0" />
                </Link>
              );
            })}
          </motion.div>
        )}

        {tab === "resenas" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {loadingData ? (
              <div className="liquid-panel p-8 flex justify-center">
                <Loader size={24} className="animate-spin text-rodeo-lime" />
              </div>
            ) : misReviews.length === 0 ? (
              <div className="liquid-panel p-8 text-center space-y-3">
                <Star size={32} className="mx-auto text-rodeo-lime/40" />
                <p className="text-rodeo-cream/50 text-sm">No hay reseñas aún</p>
                <p className="text-xs text-rodeo-cream/30">Después de reservar podés calificar cada cancha</p>
              </div>
            ) : misReviews.map((r) => {
              const cx = r.complex as any;
              return (
                <div key={r.id} className="liquid-panel p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white">{cx?.nombre ?? "Complejo"}</p>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => <Star key={i} size={12} className={i <= r.estrellas ? "text-yellow-400 fill-yellow-400" : "text-white/20"} />)}
                    </div>
                  </div>
                  {r.texto && <p className="text-xs text-rodeo-cream/60">{r.texto}</p>}
                  <p className="text-[10px] text-rodeo-cream/30">{new Date(r.created_at).toLocaleDateString("es-AR")}</p>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Logout */}
        <motion.button
          onClick={handleLogout}
          disabled={loggingOut}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[18px] text-sm font-bold transition-all"
          style={{ background: "rgba(255,64,64,0.08)", border: "1px solid rgba(255,64,64,0.2)", color: "rgba(252,165,165,0.9)" }}
        >
          {loggingOut ? <Loader size={16} className="animate-spin" /> : <LogOut size={16} />}
          Cerrar sesión
        </motion.button>
      </div>
    </div>
  );
}
