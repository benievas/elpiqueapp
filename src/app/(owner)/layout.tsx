"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Building2, BarChart3, Calendar, ClipboardList,
  Settings, LogOut, Crown, Wallet, QrCode, AlertTriangle, Zap, ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTrialStatus } from "@/lib/hooks/useTrialStatus";
import { ActiveComplexProvider, useActiveComplex } from "@/lib/context/ActiveComplexContext";

const OWNER_MENU = [
  { icon: BarChart3,     label: "Resumen",       href: "/owner" },
  { icon: Building2,     label: "Mi Complejo",   href: "/owner/complejo" },
  { icon: Calendar,      label: "Canchas",        href: "/owner/canchas" },
  { icon: ClipboardList, label: "Reservas",       href: "/owner/reservas" },
  { icon: Wallet,        label: "Caja y Cierre",  href: "/owner/caja" },
  { icon: QrCode,        label: "Mi Link / QR",   href: "/owner/mi-link" },
  { icon: Settings,      label: "Configuración",  href: "/owner/settings" },
  { icon: Crown,         label: "Suscripción",    href: "/owner/suscripcion" },
];

const BYPASS_PAGES = ["/owner/activar-trial", "/owner/suscripcion"];

function OwnerLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, profile, loading: authLoading, user, isOwner, isAdmin } = useAuth();
  const trial = useTrialStatus();
  const { complexes, activeComplexId, activeComplexName, setActiveComplexId } = useActiveComplex();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [trialBannerOpen, setTrialBannerOpen] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const [showComplexSelector, setShowComplexSelector] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!authLoading && trial.state !== "loading") setInitialized(true);
  }, [authLoading, trial.state]);

  useEffect(() => {
    if (initialized) return;
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, [initialized]);

  const isBypassPage = BYPASS_PAGES.some(p => pathname?.startsWith(p));

  useEffect(() => {
    if (authLoading || trial.state === "loading") return;
    if (!user) { router.replace("/login"); return; }
    if (profile && !isOwner && !isAdmin) { router.replace("/"); return; }
    if (!isBypassPage && trial.state === "sin_plan") { router.replace("/owner/activar-trial"); return; }
    if (!isBypassPage && trial.isBlocked) { router.replace("/owner/suscripcion"); }
  }, [authLoading, trial.state, trial.isBlocked, user, profile, isOwner, isAdmin, isBypassPage]);

  if (!initialized) {
    if (timedOut) { router.replace("/login"); return null; }
    return (
      <div className="flex items-center justify-center min-h-screen bg-rodeo-dark">
        <div className="w-8 h-8 border-2 border-rodeo-lime/30 border-t-rodeo-lime rounded-full animate-spin" />
      </div>
    );
  }

  if (isBypassPage) return <>{children}</>;

  const showTrialBanner = trial.state === "trial_activo" && trial.diasRestantes <= 7;
  const showGraciaBanner = trial.state === "gracia";
  const handleSignOut = async () => { await signOut(); router.push("/"); };
  const multiComplex = complexes.length > 1;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark">

      {/* Banner gracia */}
      <AnimatePresence>
        {showGraciaBanner && trialBannerOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-red-500/20 border-b border-red-500/30 px-6 py-3 flex items-center justify-between gap-4 z-50">
            <div className="flex items-center gap-3">
              <AlertTriangle size={16} className="text-red-400 shrink-0" />
              <p className="text-sm text-red-300">
                <span className="font-black">Tu prueba venció.</span>{" "}
                Te quedan <span className="font-black">{trial.diasGracia} día{trial.diasGracia !== 1 ? "s" : ""} de prórroga</span> para elegir un plan.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/owner/suscripcion" className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-red-500 text-white text-xs font-black hover:bg-red-600 transition-colors">
                <Zap size={12} /> Ver planes
              </Link>
              <button onClick={() => setTrialBannerOpen(false)} className="text-red-400/50 hover:text-red-400 transition-colors"><X size={16} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner trial activo */}
      <AnimatePresence>
        {showTrialBanner && trialBannerOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-yellow-400/10 border-b border-yellow-400/20 px-6 py-3 flex items-center justify-between gap-4 z-50">
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
              <button onClick={() => setTrialBannerOpen(false)} className="text-yellow-400/50 hover:text-yellow-400 transition-colors"><X size={16} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1">
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -300 }} animate={{ x: 0 }}
          className={`${sidebarOpen ? "w-64" : "w-20"} transition-all duration-300 border-r border-white/10 bg-white/2 backdrop-blur-xl flex flex-col shrink-0`}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2" style={{ minHeight: 72 }}>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-hidden">
                <p className="text-[10px] text-rodeo-cream/50 font-bold uppercase tracking-wider mb-1">
                  {isAdmin ? "Administrador" : "Propietario"}
                </p>
                {/* Complex selector — solo si tiene 2+ complejos */}
                {multiComplex ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowComplexSelector(v => !v)}
                      className="w-full flex items-center gap-2 text-sm font-black text-white hover:text-rodeo-lime transition-colors truncate"
                    >
                      <Building2 size={14} className="text-rodeo-lime shrink-0" />
                      <span className="truncate flex-1 text-left">{activeComplexName || "Seleccionar"}</span>
                      <ChevronDown size={13} className={`shrink-0 transition-transform ${showComplexSelector ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {showComplexSelector && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-full mt-2 w-full z-50 rounded-[12px] overflow-hidden"
                          style={{ background: "rgba(20,30,20,0.98)", border: "1px solid rgba(200,255,0,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
                        >
                          {complexes.map(c => (
                            <button
                              key={c.id}
                              onClick={() => { setActiveComplexId(c.id); setShowComplexSelector(false); }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold transition-colors text-left hover:bg-rodeo-lime/10 ${c.id === activeComplexId ? "text-rodeo-lime" : "text-rodeo-cream/70"}`}
                            >
                              <Building2 size={12} className="shrink-0" />
                              <span className="truncate">{c.nombre}</span>
                              {c.id === activeComplexId && <span className="ml-auto text-[10px] text-rodeo-lime/60">●</span>}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-rodeo-lime shrink-0" />
                    <p className="text-sm font-black text-white truncate">
                      {activeComplexName || profile?.nombre_completo || "Mi Complejo"}
                    </p>
                  </div>
                )}
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
              const isActive = item.href === "/owner" ? pathname === "/owner" : pathname?.startsWith(item.href);
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
              onClick={() => setShowSignOut(true)}
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

      {/* Modal cierre de sesión */}
      <AnimatePresence>
        {showSignOut && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }} transition={{ type: "spring", damping: 25, stiffness: 320 }}
              style={{ background: "rgba(26,18,11,0.97)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "20px", maxWidth: 360, width: "100%" }}
              className="p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                  <LogOut size={18} className="text-red-400" />
                </div>
                <div>
                  <p className="text-base font-black text-white">¿Cerrar sesión?</p>
                  <p className="text-xs text-rodeo-cream/50">Tendrás que volver a iniciar sesión</p>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowSignOut(false)}
                  className="flex-1 py-3 rounded-[12px] text-sm font-bold text-rodeo-cream/70 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Cancelar
                </button>
                <button onClick={handleSignOut}
                  className="flex-1 py-3 rounded-[12px] text-sm font-black text-white bg-red-500 hover:bg-red-600 transition-colors">
                  Cerrar sesión
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ActiveComplexProvider>
      <OwnerLayoutInner>{children}</OwnerLayoutInner>
    </ActiveComplexProvider>
  );
}
