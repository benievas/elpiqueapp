"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Building2, BarChart3, Calendar, ClipboardList,
  Settings, LogOut, Crown, Wallet, QrCode, AlertTriangle, Zap, ChevronDown,
  Newspaper, Trophy, Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTrialStatus } from "@/lib/hooks/useTrialStatus";
import { ActiveComplexProvider, useActiveComplex } from "@/lib/context/ActiveComplexContext";

const OWNER_MENU = [
  { icon: BarChart3,     label: "Resumen",       href: "/owner" },
  { icon: Building2,     label: "Mi Complejo",   href: "/owner/complejo" },
  { icon: Calendar,      label: "Canchas",        href: "/owner/canchas" },
  { icon: ClipboardList, label: "Reservas",       href: "/owner/reservas" },
  { icon: Trophy,        label: "Torneos",        href: "/owner/torneos" },
  { icon: Newspaper,     label: "Feed",           href: "/owner/feed" },
  { icon: Wallet,        label: "Caja y Cierre",  href: "/owner/caja" },
  { icon: ImageIcon,     label: "Flyer Instagram", href: "/owner/flyer" },
  { icon: QrCode,        label: "Mi Link / QR",   href: "/owner/mi-link" },
  { icon: Settings,      label: "Configuración",  href: "/owner/settings" },
  { icon: Crown,         label: "Suscripción",    href: "/owner/suscripcion" },
];

const BYPASS_PAGES = ["/owner/activar-trial", "/owner/suscripcion"];

function OwnerLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, profile, loading: authLoading, user, isOwner, isAdmin } = useAuth();
  const { complexes, activeComplexId, activeComplexName, setActiveComplexId, loading: complexLoading } = useActiveComplex();
  const trialComplexId = complexLoading ? null : (activeComplexId ?? undefined);
  const trial = useTrialStatus(trialComplexId);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trialBannerOpen, setTrialBannerOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hideTrialBanner") !== "true";
    }
    return true;
  });
  const [timedOut, setTimedOut] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const [showComplexSelector, setShowComplexSelector] = useState(false);
  const [initialized, setInitialized] = useState(false);
  // Track if we're on desktop to show sidebar by default
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktop(e.matches);
      setSidebarOpen(e.matches);
    };
    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const hideBanner = () => {
    setTrialBannerOpen(false);
    localStorage.setItem("hideTrialBanner", "true");
  };

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
    if (!isBypassPage && trial.state === "sin_plan") {
      const dest = activeComplexId
        ? `/owner/activar-trial?complex_id=${activeComplexId}`
        : "/owner/activar-trial";
      router.replace(dest);
      return;
    }
    if (!isBypassPage && trial.isBlocked) {
      const dest = activeComplexId
        ? `/owner/suscripcion?complex_id=${activeComplexId}`
        : "/owner/suscripcion";
      router.replace(dest);
    }
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

  const closeSidebar = () => { if (!isDesktop) setSidebarOpen(false); };

  const currentLabel = OWNER_MENU.find(m =>
    m.href === "/owner" ? pathname === "/owner" : pathname?.startsWith(m.href)
  )?.label ?? "Panel";

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark">

      {/* Banner gracia */}
      <AnimatePresence>
        {showGraciaBanner && trialBannerOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-red-500/20 border-b border-red-500/30 px-4 md:px-6 py-3 flex items-center justify-between gap-4 z-50">
            <div className="flex items-center gap-3 min-w-0">
              <AlertTriangle size={16} className="text-red-400 shrink-0" />
              <p className="text-xs md:text-sm text-red-300 truncate">
                <span className="font-black">Tu prueba venció.</span>{" "}
                <span className="hidden sm:inline">Te quedan </span><span className="font-black">{trial.diasGracia}d de prórroga</span>.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/owner/suscripcion" className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-red-500 text-white text-xs font-black hover:bg-red-600 transition-colors">
                <Zap size={12} /> Planes
              </Link>
              <button onClick={hideBanner} className="text-red-400/50 hover:text-red-400 transition-colors"><X size={16} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner trial activo */}
      <AnimatePresence>
        {showTrialBanner && trialBannerOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-yellow-400/10 border-b border-yellow-400/20 px-4 md:px-6 py-3 flex items-center justify-between gap-4 z-50">
            <div className="flex items-center gap-3 min-w-0">
              <Crown size={16} className="text-yellow-400 shrink-0" />
              <p className="text-xs md:text-sm text-yellow-200 truncate">
                Trial vence en <span className="font-black">{trial.diasRestantes}d</span>.{" "}
                <span className="hidden sm:inline">Elegí un plan para no perder el acceso.</span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/owner/suscripcion" className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-yellow-400 text-rodeo-dark text-xs font-black hover:brightness-110 transition-all">
                <Zap size={12} /> Plan
              </Link>
              <button onClick={hideBanner} className="text-yellow-400/50 hover:text-yellow-400 transition-colors"><X size={16} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-rodeo-dark/90 backdrop-blur-md border-b border-white/10">
        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-1 hover:bg-white/8 rounded-lg transition-colors">
          <Menu size={20} className="text-rodeo-cream" />
        </button>
        <span className="text-sm font-black text-white uppercase tracking-wide">{currentLabel}</span>
        <div className="w-9" />
      </div>

      <div className="flex flex-1 relative overflow-hidden">
        {/* Backdrop on mobile */}
        <AnimatePresence>
          {sidebarOpen && !isDesktop && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar — overlay on mobile, inline on desktop */}
        <motion.aside
          initial={false}
          animate={{ x: sidebarOpen ? 0 : (isDesktop ? 0 : -280) }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="fixed md:relative inset-y-0 left-0 z-50 md:z-auto flex flex-col border-r border-white/10 bg-rodeo-dark md:bg-white/2 backdrop-blur-xl shrink-0 overflow-hidden"
          style={{ width: isDesktop ? (sidebarOpen ? 256 : 80) : 256, minHeight: "100vh" }}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2" style={{ minHeight: 72 }}>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-hidden">
                <p className="text-[10px] text-rodeo-cream/50 font-bold uppercase tracking-wider mb-1">
                  {isAdmin ? "Administrador" : "Propietario"}
                </p>
                {multiComplex ? (
                  <div>
                    <button
                      onClick={() => setShowComplexSelector(v => !v)}
                      className="w-full flex items-center gap-2 text-sm font-black text-white hover:text-rodeo-lime transition-colors"
                    >
                      <Building2 size={14} className="text-rodeo-lime shrink-0" />
                      <span className="truncate flex-1 text-left">{activeComplexName || "Seleccionar"}</span>
                      <ChevronDown size={13} className={`shrink-0 transition-transform duration-200 ${showComplexSelector ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {showComplexSelector && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden mt-2"
                        >
                          <div className="rounded-[10px] overflow-hidden" style={{ background: "rgba(200,255,0,0.06)", border: "1px solid rgba(200,255,0,0.2)" }}>
                            {complexes.map(c => (
                              <button
                                key={c.id}
                                onClick={() => { setActiveComplexId(c.id); setShowComplexSelector(false); }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold transition-colors text-left hover:bg-rodeo-lime/10 ${c.id === activeComplexId ? "text-rodeo-lime bg-rodeo-lime/5" : "text-rodeo-cream/70"}`}
                              >
                                <Building2 size={11} className="shrink-0" />
                                <span className="truncate flex-1">{c.nombre}</span>
                                {c.id === activeComplexId && <span className="text-[10px] text-rodeo-lime">●</span>}
                              </button>
                            ))}
                          </div>
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
                <Link key={item.href} href={item.href} onClick={closeSidebar}>
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
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto">{children}</div>
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
