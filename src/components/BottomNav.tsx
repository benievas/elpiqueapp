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
        className="flex items-center justify-around px-2 py-3 rounded-[28px]"
        style={{
          background: "rgba(26, 18, 11, 0.75)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all"
              style={isActive ? { background: "rgba(255,255,255,0.1)" } : {}}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span
                className="text-[10px] font-semibold transition-colors"
                style={{ color: isActive ? "#C8FF00" : "rgba(225,212,194,0.6)" }}
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
