"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/explorar", label: "Explorar", icon: "🔍" },
  { href: "/mapa", label: "Mapa", icon: "🗺️" },
  { href: "/torneos", label: "Torneos", icon: "🏆" },
  { href: "/perfil", label: "Perfil", icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
      <div
        className="flex items-center justify-around px-2 py-3 rounded-[28px] relative overflow-hidden"
        style={{
          // Idéntico al pill del banner de instalación
          background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)",
          backdropFilter: "blur(40px) saturate(200%)",
          WebkitBackdropFilter: "blur(40px) saturate(200%)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25), 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {/* Línea reflectiva superior tipo Apple */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5) 20%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 80%, transparent)",
            borderRadius: "28px 28px 0 0",
          }}
        />
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all"
              style={isActive ? {
                background: "rgba(200,255,0,0.15)",
                border: "1px solid rgba(200,255,0,0.25)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
              } : {}}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span
                className="text-[10px] font-bold transition-colors"
                style={{ color: isActive ? "#C8FF00" : "rgba(255,255,255,0.55)" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
