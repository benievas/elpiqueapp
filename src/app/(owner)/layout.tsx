"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Building2, BarChart3, Calendar, ClipboardList,
  Settings, LogOut, Crown, Wallet, QrCode, AlertTriangle, Zap,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTrialStatus } from "@/lib/hooks/useTrialStatus";
import { supabase } from "@/lib/supabase";

const OWNER_MENU = [
  { icon: Building2, label: "Mi Complejo",   href: "/owner/complejo" },
  { icon: Calendar,    label: "Canchas",       href: "/owner/canchas" },
  { icon: ClipboardList, label: "Reservas",    href: "/owner/reservas" },
  { icon: Wallet,      label: "Caja y Cierre", href: "/owner/caja" },
  { icon: QrCode,      label: "Mi Link / QR",  href: "/owner/mi-link" },
  { icon: BarChart3,   label: "Estadísticas",  href: "/owner/stats" },
  { icon: Settings,    label: "Configuración", href: "/owner/settings" },
  { icon: Crown,       label: "Suscripción",   href: "/owner/suscripcion" },
];

// Página de activar trial: sin sidebar, sin guard
const BYPASS_PAGES = ["/owner/activar-trial", "/owner/suscripcion"];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, profile, loading: authLoading, user, isOwner, isAdmin } = useAuth();
  const trial = useTrialStatus();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [trialBannerOpen, setTrialBannerOpen] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [complexName, setComplexName] = useState<string | null>(null);

  // Timeout de seguridad: si después de 8s sigue cargando, redirigir al login
  useEffect(() => {
    if (!authLoading && trial.state !== "loading") return;
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, [authLoading, trial.state]);

  // Fetch nombre del complejo para el sidebar
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("complexes")
      .select("nombre")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (data) setComplexName((data as { nombre: string }).nombre); });
  }, [user?.id]);

  const isBypassPage = BYPASS_PAGES.some(p => pathname?.startsWith(p));

  // ── Guards ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || trial.state === "loading") return;

    // No logueado → login
    if (!user) { router.replace("/login"); return; }

    // No es owner/admin → home
    if (profile && !isOwner && !isAdmin) { router.replace("/"); return; }

    // Sin plan → activar trial (salvo que ya estemos ahí o en suscripcion)
    if (!isBypassPage && trial.state === "sin_plan") {
      router.replace("/owner/activar-trial");
      return;
    }

    // Trial expirado (> gracia) → suscripcion, bloquear todo menos esa página
    if (!isBypassPage && trial.isBlocked) {
      router.replace("/owner/suscripcion");
    }
  }, [authLoading, trial.state, trial.isBlocked, user, profile, isOwner, isAdmin, isBypassPage]);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (authLoading || trial.state === "loading") {
    if (timedOut) {
      router.replace("/login");
      return null;
    }
    return (
      <div className="flex items-center justify-center min-h-screen bg-rodeo-dark">
        <div className="w-8 h-8 border-2 border-rodeo-lime/30 border-t-rodeo-lime rounded-full animate-spin" />
      </div>
    );
  }

  // Si bypass (activar-trial, suscripcion) renderizamos sin layout
  if (isBypassPage) {
    return <>{children}</>;
  }

  // ── Banner de trial ──────────────────────────────────────────────────────────
  const showTrialBanner = trial.state === "trial_activo" && trial.diasRestantes <= 7;
  const showGraciaBanner = trial.state === "gracia";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark">

      {/* Banner gracia (urgente) */}
      <AnimatePresence>
        {showGraciaBanner && trialBannerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-500/20 border-b border-red-500/30 px-6 py-3 flex items-center justify-between gap-4 z-50"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle size={16} className="text-red-400 shrink-0" />
              <p className="text-sm text-red-300">
                <span className="font-black">Tu prueba venció.</span>{" "}
                Te quedan <span className="font-black">{trial.diasGracia} día{trial.diasGracia !== 1 ? "s" : ""} de prórroga</span> para elegir un plan y no perder el acceso.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/owner/suscripcion" className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-red-500 text-white text-xs font-black hover:bg-red-600 transition-colors">
                <Zap size={12} /> Ver planes
              </Link>
              <button onClick={() => setTrialBannerOpen(false)} className="text-red-400/50 hover:text-red-400 transition-colors">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner trial activo (≤7 días) */}
      <AnimatePresence>
        {showTrialBanner && trialBannerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-yellow-400/10 border-b border-yellow-400/20 px-6 py-3 flex items-center justify-between gap-4 z-50"
          >
            <div className="flex items-center gap-3">
              <Crown size={16} className="text-yellow-400 shrink-0" />
              <p className="text-sm text-yellow-200">
                Tu prueba vence en <span className="font-black">{trial.diasRestantes} día{trial.diasRestantes !== 1 ? "s" : ""}</span>.{" "}
                Elegí un plan para no perder el acceso.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/owner/suscripcion" className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-yellow-400 text-rodeo-dark text-xs font-black hover:brightness-110 transition-all">
                <Zap size={12} /> Suscribirme
              </Link>
              <button onClick={() => setTrialBannerOpen(false)} className="text-yellow-400/50 hover:text-yellow-400 transition-colors">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layout principal */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          className={`${sidebarOpen ? "w-64" : "w-20"} transition-all duration-300 border-r border-white/10 bg-white/2 backdrop-blur-xl flex flex-col shrink-0`}
        >
          {/* Header sidebar */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-[10px] bg-rodeo-lime/20 border border-rodeo-lime/40 flex items-center justify-center shrink-0">
                  <Building2 size={18} className="text-rodeo-lime" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] text-rodeo-cream/50 font-bold uppercase tracking-wider">
                    {profile?.nombre_completo || "Propietario"}
                  </p>
                  <p className="text-sm font-black text-white truncate">
                    {complexName || "Mi Complejo"}
                  </p>
                </div>
              </motion.div>
            )}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-white/8 rounded-lg transition-colors shrink-0">
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Trial badge */}
          {sidebarOpen && trial.state === "trial_activo" && (
            <div className="mx-4 mt-3 px-3 py-2 rounded-[10px] bg-yellow-400/10 border border-yellow-400/20">
              <div className="flex items-center gap-2">
                <Crown size={12} className="text-yellow-400" />
                <span className="text-[11px] font-bold text-yellow-300">Prueba gratuita</span>
              </div>
              <p className="text-[10px] text-yellow-400/70 mt-0.5">{trial.diasRestantes} días restantes</p>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
            {OWNER_MENU.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ x: sidebarOpen ? 3 : 0 }}
                    className={`p-3 rounded-[12px] transition-all flex items-center gap-3 cursor-pointer ${
                      isActive
                        ? "bg-rodeo-lime/20 border border-rodeo-lime/40 text-rodeo-lime"
                        : "hover:bg-white/6 border border-transparent text-rodeo-cream/70 hover:text-rodeo-cream"
                    }`}
                  >
                    <item.icon size={18} className="shrink-0" />
                    {sidebarOpen && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-bold truncate">
                        {item.label}
                      </motion.span>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-white/10">
            <button
              onClick={handleSignOut}
              className="w-full p-3 rounded-[12px] hover:bg-red-500/10 border border-transparent hover:border-red-500/20 flex items-center gap-3 transition-all text-rodeo-cream/60 hover:text-red-400"
            >
              <LogOut size={18} className="shrink-0" />
              {sidebarOpen && <span className="text-sm font-bold">Cerrar sesión</span>}
            </button>
          </div>
        </motion.aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-10 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
