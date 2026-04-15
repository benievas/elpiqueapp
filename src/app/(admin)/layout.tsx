"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

const ADMIN_MENU = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Building2, label: "Complejos", href: "/admin/complejos" },
  { icon: Users, label: "Dueños", href: "/admin/duenos" },
  { icon: CreditCard, label: "Suscripciones", href: "/admin/suscripciones" },
  { icon: BarChart3, label: "Reportes", href: "/admin/reportes" },
  { icon: Settings, label: "Configuración", href: "/admin/settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, isSuperAdmin, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-rodeo-dark">
        <div className="text-rodeo-cream animate-pulse">Cargando...</div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-rodeo-dark">
        <div className="text-center space-y-4">
          <p className="text-red-400 font-bold">Acceso denegado</p>
          <p className="text-rodeo-cream/70">
            No tienes permisos para acceder al panel de administración
          </p>
          <button
            onClick={() => router.push("/")}
            className="liquid-button inline-block"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } transition-all duration-300 border-r border-white/10 bg-white/2 backdrop-blur-xl flex flex-col`}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-liquid bg-rodeo-lime/20 border border-rodeo-lime/40 flex items-center justify-center">
                <LayoutDashboard size={20} className="text-rodeo-lime" />
              </div>
              <div>
                <p className="text-xs text-rodeo-cream/50">Admin</p>
                <p className="text-sm font-bold text-white">ElPiqueApp</p>
              </div>
            </motion.div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {ADMIN_MENU.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`p-3 rounded-liquid transition-all flex items-center gap-3 cursor-pointer ${
                    isActive
                      ? "bg-rodeo-lime/20 border border-rodeo-lime/40 text-rodeo-lime"
                      : "hover:bg-white/5 border border-transparent text-rodeo-cream"
                  }`}
                >
                  <item.icon size={20} />
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm font-bold"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            onClick={handleSignOut}
            className="w-full p-3 rounded-liquid hover:bg-white/5 border border-transparent hover:border-white/10 flex items-center gap-3 transition-all text-rodeo-cream hover:text-white"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-sm font-bold">Cerrar sesión</span>}
          </button>
        </div>
      </motion.aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-12 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
