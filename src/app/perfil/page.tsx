"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft, LogOut, Building2, User, Star,
  Calendar, MapPin, Loader, ArrowRight, Heart,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase";

type Tab = "reservas" | "resenas" | "favoritos";

export default function PerfilPage() {
  const { user, profile, loading, signOut, isOwner, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("reservas");
  const [loggingOut, setLoggingOut] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [reservaciones, setReservaciones] = useState<Array<{
    id: string; fecha: string; hora_inicio: string; hora_fin: string;
    estado: string; precio_total: number;
    court: { nombre: string; deporte: string } | null;
    complex: { nombre: string } | null;
  }>>([]);
  const [misReviews, setMisReviews] = useState<Array<{
    id: string; estrellas: number; texto: string | null; created_at: string;
    complex: { nombre: string } | null;
  }>>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [misFavoritos, setMisFavoritos] = useState<Array<{
    id: string; complex_id: string; complex: { nombre: string; slug: string; imagen_principal: string | null; deporte_principal: string } | null;
  }>>([]);

  useEffect(() => {
    if (!user?.id) return;
    setLoadingData(true);
    Promise.all([
      supabase
        .from("reservations")
        .select("id, fecha, hora_inicio, hora_fin, estado, precio_total, court:courts(nombre, deporte), complex:complexes(nombre)")
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
    ]).then(([resRes, revRes, favRes]) => {
      setReservaciones((resRes.data as any) ?? []);
      setMisReviews((revRes.data as any) ?? []);
      setMisFavoritos((favRes.data as any) ?? []);
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
          {([["reservas", "Reservas", Calendar], ["favoritos", "Favoritos", Heart], ["resenas", "Reseñas", Star]] as const).map(([t, label, Icon]) => (
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
              return (
                <div key={r.id} className="liquid-panel p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{c?.nombre ?? "Cancha"}</p>
                    <p className="text-xs text-rodeo-cream/50 truncate">{cx?.nombre}</p>
                    <p className="text-xs text-rodeo-cream/40 mt-0.5">{r.fecha} · {r.hora_inicio}–{r.hora_fin}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-white">${r.precio_total.toLocaleString()}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${estadoColor[r.estado]}18`, color: estadoColor[r.estado] }}>
                      {r.estado}
                    </span>
                  </div>
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
