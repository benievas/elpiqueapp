"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, LayoutDashboard, Building2, Users,
  CreditCard, BarChart3, Settings, LogOut, Newspaper, FileCheck,
  Trophy, Calendar, Star, Banknote, UserCircle,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

const ADMIN_MENU = [
  { icon: LayoutDashboard, label: "Dashboard",       href: "/admin",               group: null       },
  { icon: Building2,       label: "Complejos",       href: "/admin/complejos",     group: "Contenido" },
  { icon: UserCircle,      label: "Usuarios",        href: "/admin/jugadores",     group: "Contenido" },
  { icon: Users,           label: "Propietarios",    href: "/admin/duenos",        group: "Contenido" },
  { icon: Trophy,          label: "Torneos",         href: "/admin/torneos",       group: "Contenido" },
  { icon: Calendar,        label: "Reservas",        href: "/admin/reservas",      group: "Contenido" },
  { icon: Star,            label: "Reseñas",         href: "/admin/resenas",       group: "Contenido" },
  { icon: Newspaper,       label: "Feed / Anuncios", href: "/admin/feed",          group: "Contenido" },
  { icon: CreditCard,      label: "Suscripciones",   href: "/admin/suscripciones", group: "Pagos"     },
  { icon: FileCheck,       label: "Comprobantes",    href: "/admin/comprobantes",  group: "Pagos"     },
  { icon: Banknote,        label: "Historial Pagos", href: "/admin/pagos",         group: "Pagos"     },
  { icon: BarChart3,       label: "Reportes",        href: "/admin/reportes",      group: "Sistema"   },
  { icon: Settings,        label: "Configuración",   href: "/admin/settings",      group: "Sistema"   },
];

const GROUPS = [null, "Contenido", "Pagos", "Sistema"] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, isSuperAdmin, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const handleSignOut = async () => { await signOut(); router.push("/"); };

  const closeSidebar = () => { if (!isDesktop) setSidebarOpen(false); };

  const currentLabel = ADMIN_MENU.find(m =>
    m.href === "/admin" ? pathname === "/admin" : pathname.startsWith(m.href)
  )?.label ?? "Admin";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-rodeo-dark">
        <div className="w-6 h-6 border-2 border-rodeo-lime/30 border-t-rodeo-lime rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-rodeo-dark text-center px-6">
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-400/10 border border-red-400/20 flex items-center justify-center mx-auto">
            <span className="text-2xl">🔒</span>
          </div>
          <p className="text-red-400 font-black text-lg">Acceso denegado</p>
          <p className="text-rodeo-cream/50 text-sm">Necesitás rol <code className="text-rodeo-lime">superadmin</code> para entrar aquí.</p>
          <div className="flex flex-col gap-2">
            <a href="/"
              style={{ background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.2)", borderRadius: "12px" }}
              className="px-5 py-2.5 text-sm font-bold text-rodeo-lime hover:bg-rodeo-lime/15 transition-all">
              Volver al inicio
            </a>
            <a href="/api/auth/signout"
              style={{ background: "rgba(255,64,64,0.08)", border: "1px solid rgba(255,64,64,0.2)", borderRadius: "12px" }}
              className="px-5 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all">
              Cerrar sesión y reintentar
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "linear-gradient(160deg,#040D07 0%,#081810 40%,#050F09 70%,#030A06 100%)" }}>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-white/8 backdrop-blur-md"
        style={{ background: "rgba(4,13,7,0.9)" }}>
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

        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ x: sidebarOpen ? 0 : (isDesktop ? 0 : -240) }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="fixed md:relative inset-y-0 left-0 z-50 md:z-auto flex flex-col border-r border-white/8 backdrop-blur-xl shrink-0 overflow-hidden"
          style={{
            background: "rgba(4,13,7,0.98)",
            width: isDesktop ? (sidebarOpen ? 220 : 64) : 220,
            minHeight: "100vh",
          }}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/8 flex items-center justify-between" style={{ minHeight: 64 }}>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-rodeo-lime/20 border border-rodeo-lime/40 flex items-center justify-center shrink-0">
                  <LayoutDashboard size={15} className="text-rodeo-lime" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-rodeo-cream/40 uppercase tracking-widest font-bold">Superadmin</p>
                  <p className="text-sm font-black text-white leading-tight truncate">ElPiqueApp</p>
                </div>
              </motion.div>
            )}
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-white/8 rounded-lg transition-colors shrink-0">
              {sidebarOpen ? <X size={18} className="text-rodeo-cream/50" /> : <Menu size={18} className="text-rodeo-cream/50" />}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {GROUPS.map(group => {
              const items = ADMIN_MENU.filter(item => item.group === group);
              return (
                <div key={group ?? "root"}>
                  {group && sidebarOpen && (
                    <p className="text-[9px] font-black uppercase tracking-widest text-rodeo-cream/20 px-3 pt-3 pb-1">{group}</p>
                  )}
                  {items.map((item) => {
                    const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                    return (
                      <Link key={item.href} href={item.href} onClick={closeSidebar}>
                        <motion.div whileHover={{ x: sidebarOpen ? 2 : 0 }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-[10px] transition-all cursor-pointer ${isActive
                            ? "bg-rodeo-lime/15 border border-rodeo-lime/30 text-rodeo-lime"
                            : "hover:bg-white/5 border border-transparent text-rodeo-cream/55 hover:text-rodeo-cream"}`}
                          title={!sidebarOpen ? item.label : undefined}>
                          <item.icon size={16} className="shrink-0" />
                          {sidebarOpen && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
                              className="text-xs font-bold truncate">
                              {item.label}
                            </motion.span>
                          )}
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-white/8">
            <button onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/8 transition-all text-rodeo-cream/50 hover:text-white">
              <LogOut size={16} className="shrink-0" />
              {sidebarOpen && <span className="text-xs font-bold">Cerrar sesión</span>}
            </button>
          </div>
        </motion.aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="p-4 md:p-6 lg:p-10 max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
