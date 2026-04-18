"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft, LogOut, Building2, User, Star,
  Calendar, MapPin, Loader, ArrowRight,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase";

type Tab = "reservas" | "resenas";

export default function PerfilPage() {
  const { user, profile, loading, signOut, isOwner, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("reservas");
  const [loggingOut, setLoggingOut] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

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
    return (
      <div className="min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark pb-32">
        <div className="max-w-md mx-auto px-6 pt-12 space-y-8">
          <Link href="/" className="inline-flex items-center gap-2 text-rodeo-cream/50 hover:text-rodeo-cream transition-colors text-sm">
            <ChevronLeft size={16} /> Inicio
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
              style={{ background: "rgba(200,255,0,0.1)", border: "2px solid rgba(200,255,0,0.2)" }}>
              <User size={36} className="text-rodeo-lime" />
            </div>
            <h1 className="text-2xl font-black text-white">Tu Perfil</h1>
            <p className="text-rodeo-cream/50 text-sm">Iniciá sesión para acceder a tus reservas, reseñas y panel de dueño.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="liquid-panel p-8 space-y-6"
          >
            <motion.button
              onClick={handleGoogleLogin}
              disabled={loginLoading}
              whileHover={!loginLoading ? { scale: 1.02, y: -2 } : {}}
              whileTap={!loginLoading ? { scale: 0.98 } : {}}
              className="w-full py-4 rounded-[22px] bg-white text-rodeo-dark font-bold flex items-center justify-center gap-3 transition-all hover:shadow-lg disabled:opacity-50"
            >
              {loginLoading ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar con Google
                </>
              )}
            </motion.button>

            <div
              className="px-4 py-3 rounded-[16px] text-center"
              style={{ background: "rgba(200,255,0,0.05)", border: "1px solid rgba(200,255,0,0.15)" }}
            >
              <p className="text-xs text-rodeo-cream/60">
                <span className="text-rodeo-lime font-bold">¿Dueño de un complejo?</span>{" "}
                Iniciá sesión con tu email de registro y accedé automáticamente al panel de gestión.
              </p>
            </div>

            <p className="text-xs text-rodeo-cream/30 text-center">
              Al continuar aceptás nuestros{" "}
              <Link href="/terminos" className="underline">Términos</Link>
              {" y "}
              <Link href="/privacidad" className="underline">Política de Privacidad</Link>
            </p>
          </motion.div>
        </div>
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
              <p className="text-lg font-black text-white truncate">
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
          {([["reservas", "Mis Reservas", Calendar], ["resenas", "Mis Reseñas", Star]] as const).map(([t, label, Icon]) => (
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="liquid-panel p-8 text-center space-y-3">
            <Calendar size={32} className="mx-auto text-rodeo-lime/40" />
            <p className="text-rodeo-cream/50 text-sm">No tenés reservas aún</p>
            <p className="text-xs text-rodeo-cream/30">Tus próximas reservas aparecerán aquí</p>
            <Link
              href="/explorar"
              className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-[14px] text-sm font-bold"
              style={{ background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.2)", color: "#C8FF00" }}
            >
              Explorar canchas <ArrowRight size={14} />
            </Link>
          </motion.div>
        )}

        {tab === "resenas" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="liquid-panel p-8 text-center space-y-3">
            <Star size={32} className="mx-auto text-rodeo-lime/40" />
            <p className="text-rodeo-cream/50 text-sm">No hay reseñas aún</p>
            <p className="text-xs text-rodeo-cream/30">Después de reservar podés calificar cada cancha</p>
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
