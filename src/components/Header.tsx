"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, Building2, ChevronDown, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import CitySelector from "./CitySelector";

export function Header() {
  const { user, profile, loading, signOut, isOwner, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    router.push("/");
  };

  // No mostrar header en el panel owner (tiene su propio layout)
  if (pathname?.startsWith("/owner")) return null;

  const NAV_LINKS = [
    { href: "/explorar", label: "Explorar" },
    { href: "/mapa", label: "Mapa" },
    { href: "/torneos", label: "Torneos" },
    { href: "/feed", label: "Feed" },
    ...(isOwner || isAdmin ? [{ href: "/owner", label: "Panel Dueño", highlight: true }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      <nav className="liquid-panel mx-2 sm:mx-4 my-3 px-6 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="relative h-10 w-10">
            <Image
              src="/assets/logo-main.png"
              alt="ElPiqueApp"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Nav Links (Desktop) */}
        <div className="hidden md:flex gap-6 items-center flex-1 justify-center">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-bold transition-colors ${
                link.highlight
                  ? "text-rodeo-lime hover:text-rodeo-lime/80"
                  : "text-rodeo-cream/70 hover:text-rodeo-cream"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex gap-2 items-center ml-auto md:ml-0 shrink-0">
          <CitySelector className="hidden sm:block" />

          {loading ? (
            <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
          ) : user ? (
            /* Usuario logueado → dropdown */
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-[12px] bg-white/8 border border-white/10
                  hover:bg-white/12 transition-all"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-rodeo-lime/20 border border-rodeo-lime/40 flex items-center justify-center">
                    <User size={12} className="text-rodeo-lime" />
                  </div>
                )}
                <span className="hidden sm:block text-xs font-bold text-rodeo-cream max-w-[80px] truncate">
                  {profile?.nombre_completo?.split(" ")[0] || user.email?.split("@")[0]}
                </span>
                <ChevronDown size={14} className={`text-rodeo-cream/50 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 liquid-panel p-2 space-y-0.5 shadow-2xl"
                  >
                    {/* Info usuario */}
                    <div className="px-3 py-2 mb-1 border-b border-white/10">
                      <p className="text-xs font-bold text-white truncate">
                        {profile?.nombre_completo || "Usuario"}
                      </p>
                      <p className="text-xs text-rodeo-cream/40 truncate">{user.email}</p>
                      {profile?.rol && (
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rodeo-lime/15 text-rodeo-lime">
                          {profile.rol === "propietario" ? "Dueño" :
                           profile.rol === "admin" ? "Admin" :
                           profile.rol === "superadmin" ? "Super Admin" : "Jugador"}
                        </span>
                      )}
                    </div>

                    {/* Panel dueño (si aplica) */}
                    {(isOwner || isAdmin) && (
                      <Link href="/owner" onClick={() => setMenuOpen(false)}>
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] hover:bg-white/8 transition-colors cursor-pointer">
                          <LayoutDashboard size={15} className="text-rodeo-lime" />
                          <span className="text-sm text-rodeo-cream font-bold">Panel Dueño</span>
                        </div>
                      </Link>
                    )}

                    {/* Perfil jugador */}
                    {!isOwner && !isAdmin && (
                      <Link href="/perfil" onClick={() => setMenuOpen(false)}>
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] hover:bg-white/8 transition-colors cursor-pointer">
                          <User size={15} className="text-rodeo-cream/60" />
                          <span className="text-sm text-rodeo-cream">Mi Perfil</span>
                        </div>
                      </Link>
                    )}

                    {/* Cerrar sesión */}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] hover:bg-red-500/10 transition-colors text-left"
                    >
                      <LogOut size={15} className="text-red-400" />
                      <span className="text-sm text-red-400 font-bold">Cerrar sesión</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* No logueado */
            <div className="flex gap-2 items-center">
              <Link
                href="/owner?mode=owner"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-[10px] border border-rodeo-lime/30
                  text-rodeo-lime text-xs font-bold hover:bg-rodeo-lime/10 transition-all"
              >
                <Building2 size={13} />
                Dueño
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-white/8 border border-white/10
                  text-rodeo-cream text-xs font-bold hover:bg-white/12 transition-all"
              >
                <User size={13} />
                <span className="hidden sm:inline">Iniciar sesión</span>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header;
