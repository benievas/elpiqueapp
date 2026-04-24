"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Menu, X, LayoutDashboard, Building2, Users,
  CreditCard, BarChart3, Settings, LogOut, Newspaper, FileCheck,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

const ADMIN_MENU = [
  { icon: LayoutDashboard, label: "Dashboard",       href: "/admin" },
  { icon: Building2,       label: "Complejos",       href: "/admin/complejos" },
  { icon: Users,           label: "Propietarios",    href: "/admin/duenos" },
  { icon: CreditCard,      label: "Suscripciones",   href: "/admin/suscripciones" },
  { icon: FileCheck,       label: "Comprobantes",    href: "/admin/comprobantes" },
  { icon: Newspaper,       label: "Feed / Anuncios", href: "/admin/feed" },
  { icon: BarChart3,       label: "Reportes",        href: "/admin/reportes" },
  { icon: Settings,        label: "Configuración",   href: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, isSuperAdmin, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSignOut = async () => { await signOut(); router.push("/"); };

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
    <div className="flex min-h-screen" style={{ background: "linear-gradient(160deg,#040D07 0%,#081810 40%,#050F09 70%,#030A06 100%)" }}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 64 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="shrink-0 border-r border-white/8 bg-white/2 backdrop-blur-xl flex flex-col overflow-hidden"
        style={{ minHeight: "100vh" }}
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
        <nav className="flex-1 p-3 space-y-1">
          {ADMIN_MENU.map((item) => {
            const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <motion.div whileHover={{ x: sidebarOpen ? 3 : 0 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${isActive
                    ? "bg-rodeo-lime/15 border border-rodeo-lime/30 text-rodeo-lime"
                    : "hover:bg-white/5 border border-transparent text-rodeo-cream/60 hover:text-rodeo-cream"}`}
                  title={!sidebarOpen ? item.label : undefined}>
                  <item.icon size={17} className="shrink-0" />
                  {sidebarOpen && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
                      className="text-sm font-bold truncate">
                      {item.label}
                    </motion.span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/8">
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/8 transition-all text-rodeo-cream/50 hover:text-white">
            <LogOut size={17} className="shrink-0" />
            {sidebarOpen && <span className="text-sm font-bold">Cerrar sesión</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-10 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
