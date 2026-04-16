"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, MapPin, Rss, Trophy, User } from "lucide-react";

const navItems = [
  { href: "/", label: "Inicio", Icon: Home },
  { href: "/explorar", label: "Explorar", Icon: Search },
  { href: "/mapa", label: "Mapa", Icon: MapPin },
  { href: "/feed", label: "Feed", Icon: Rss },
  { href: "/torneos", label: "Torneos", Icon: Trophy },
  { href: "/perfil", label: "Perfil", Icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  // No mostrar en panel owner/admin
  if (pathname.startsWith("/owner") || pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-4 left-3 right-3 z-40 md:hidden">
      {/* Contenedor principal con Apple Liquid Glass premium */}
      <div
        className="flex items-center justify-around px-1 py-2 relative overflow-hidden"
        style={{
          borderRadius: "30px",
          /* Fondo glass con gradiente especular como iOS */
          background: "linear-gradient(160deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.07) 40%, rgba(255,255,255,0.04) 100%)",
          backdropFilter: "blur(52px) saturate(220%) brightness(1.15)",
          WebkitBackdropFilter: "blur(52px) saturate(220%) brightness(1.15)",
          /* Borde con highlights direccionales */
          border: "1px solid rgba(255,255,255,0.26)",
          borderTopColor: "rgba(255,255,255,0.42)",
          borderLeftColor: "rgba(255,255,255,0.32)",
          borderBottomColor: "rgba(255,255,255,0.08)",
          /* Sombra multicapa */
          boxShadow: [
            "0 16px 48px rgba(0,0,0,0.6)",
            "0 4px 16px rgba(0,0,0,0.35)",
            "inset 0 2px 0 rgba(255,255,255,0.3)",
            "inset 0 -1px 0 rgba(0,0,0,0.18)",
            "inset 1px 0 0 rgba(255,255,255,0.14)",
          ].join(", "),
        }}
      >
        {/* Reflejo especular superior — efecto Apple exacto */}
        <div
          style={{
            position: "absolute",
            top: 0, left: "10%", right: "10%",
            height: "38%",
            borderRadius: "0 0 60% 60%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        {navItems.map(({ href, label, Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-[3px] relative"
              style={{ padding: "6px 10px", borderRadius: "18px", transition: "all 0.2s ease" }}
            >
              {/* Fondo activo con glass lime */}
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "18px",
                    background: "linear-gradient(160deg, rgba(200,255,0,0.22) 0%, rgba(200,255,0,0.1) 100%)",
                    border: "1px solid rgba(200,255,0,0.3)",
                    boxShadow: "inset 0 1px 0 rgba(200,255,0,0.3), 0 0 16px rgba(200,255,0,0.12)",
                  }}
                />
              )}
              {/* Reflejo especular sobre ítem activo */}
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0,
                    height: "50%",
                    borderRadius: "18px 18px 0 0",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)",
                    pointerEvents: "none",
                  }}
                />
              )}

              <Icon
                size={21}
                strokeWidth={isActive ? 2.4 : 1.7}
                style={{
                  color: isActive ? "#C8FF00" : "rgba(232,240,228,0.48)",
                  filter: isActive ? "drop-shadow(0 0 5px rgba(200,255,0,0.55))" : "none",
                  position: "relative",
                  transition: "all 0.2s ease",
                }}
              />
              <span
                style={{
                  fontSize: "9.5px",
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: "0.01em",
                  color: isActive ? "#C8FF00" : "rgba(232,240,228,0.42)",
                  position: "relative",
                  transition: "all 0.2s ease",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
