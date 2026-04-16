"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/explorar", label: "Explorar", icon: "🔍" },
  { href: "/mapa", label: "Mapa", icon: "🗺️" },
  { href: "/feed", label: "Feed", icon: "📢" },
  { href: "/torneos", label: "Torneos", icon: "🏆" },
  { href: "/perfil", label: "Perfil", icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-3 right-3 z-40 md:hidden">
      <div
        className="flex items-center justify-around px-1 py-2.5 rounded-[28px] relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)",
          backdropFilter: "blur(40px) saturate(200%)",
          WebkitBackdropFilter: "blur(40px) saturate(200%)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)",
        }}
      >
        {/* Línea reflectiva superior */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5) 20%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 80%, transparent)",
          }}
        />
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all"
              style={isActive ? {
                background: "rgba(200,255,0,0.15)",
                border: "1px solid rgba(200,255,0,0.25)",
              } : {}}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span
                className="text-[9px] font-bold transition-colors"
                style={{ color: isActive ? "#C8FF00" : "rgba(255,255,255,0.5)" }}
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
