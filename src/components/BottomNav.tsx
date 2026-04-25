"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Home, Search, MapPin, Rss, Trophy, User, Building2, Plus, Users } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNotifications } from "@/lib/context/NotificationContext";
import { useState, useEffect, useRef } from "react";

const NAV_ITEMS = [
  { href: "/",         label: "Inicio",   Icon: Home },
  { href: "/explorar", label: "Explorar", Icon: Search },
  { href: "/torneos",  label: "Torneos",  Icon: Trophy },
  { href: "/partidos", label: "Partidos", Icon: Users },
  { href: "/feed",     label: "Feed",     Icon: Rss },
  { href: "/perfil",   label: "Perfil",   Icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOwner, isAdmin } = useAuth();
  const { unreadCount, markAllRead } = useNotifications();
  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);

  // Collapse nav on scroll down, expand on scroll up
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 80 && y > lastScrollY.current) setScrolled(true);
      else if (y < lastScrollY.current - 10) setScrolled(false);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (
    pathname.startsWith("/owner") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/complejo/") ||
    pathname === "/mapa"
  ) return null;

  const allItems = [
    ...NAV_ITEMS,
    ...(isOwner || isAdmin ? [{ href: "/owner", label: "Mi Panel", Icon: Building2 }] : []),
  ];

  return (
    <nav className="fixed bottom-3 left-0 right-0 z-40 md:hidden flex items-center justify-center gap-2.5 px-4">

      {/* Main nav pill */}
      <div
        className={`flex items-center gap-0.5 transition-all duration-300 ease-out ${scrolled ? "opacity-85 scale-95" : ""}`}
        style={{
          padding: scrolled ? "5px 6px" : "7px 8px",
          borderRadius: "28px",
          background: "linear-gradient(160deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.03) 100%)",
          backdropFilter: "blur(48px) saturate(200%)",
          WebkitBackdropFilter: "blur(48px) saturate(200%)",
          border: "1px solid rgba(255,255,255,0.22)",
          borderTopColor: "rgba(255,255,255,0.38)",
          boxShadow: "0 16px 44px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.28)",
        }}
      >
        {allItems.map(({ href, label, Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const showBadge = href === "/partidos" && unreadCount > 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => { if (href === "/partidos") markAllRead(); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: isActive ? 6 : 0,
                padding: scrolled ? "7px 8px" : "8px 10px",
                borderRadius: "20px",
                background: isActive
                  ? "linear-gradient(160deg, rgba(200,255,0,0.24), rgba(200,255,0,0.08))"
                  : "transparent",
                border: isActive
                  ? "1px solid rgba(200,255,0,0.35)"
                  : "1px solid transparent",
                boxShadow: isActive
                  ? "inset 0 1px 0 rgba(255,255,255,0.3), 0 0 16px rgba(200,255,0,0.18)"
                  : "none",
                color: isActive ? "#C8FF00" : "rgba(232,240,228,0.5)",
                transition: "all 360ms cubic-bezier(0.34, 1.3, 0.64, 1)",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ position: "relative", display: "inline-flex" }}>
                <Icon
                  size={scrolled ? 17 : 18}
                  strokeWidth={isActive ? 2.3 : 1.8}
                  style={{ flexShrink: 0, transition: "all 0.2s" }}
                />
                {showBadge && (
                  <span style={{
                    position: "absolute", top: -4, right: -5,
                    minWidth: 14, height: 14, borderRadius: "999px",
                    background: "#FF4040", border: "1.5px solid #040D07",
                    fontSize: "9px", fontWeight: 800, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 3px", lineHeight: 1,
                  }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              {/* Label only visible for active item */}
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  maxWidth: isActive && !scrolled ? "80px" : "0px",
                  opacity: isActive && !scrolled ? 1 : 0,
                  overflow: "hidden",
                  transition: "max-width 380ms cubic-bezier(0.34, 1.3, 0.64, 1), opacity 260ms",
                  letterSpacing: "0.01em",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* FAB — armá partido */}
      <button
        onClick={() => router.push("/partidos")}
        aria-label="Armá partido"
        style={{
          width: 48,
          height: 48,
          borderRadius: "999px",
          background: "linear-gradient(135deg, #C8FF00 0%, #A8D800 100%)",
          color: "#040D07",
          border: "1px solid rgba(255,255,255,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(200,255,0,0.45), inset 0 1px 0 rgba(255,255,255,0.5)",
          flexShrink: 0,
          transition: "transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08) rotate(8deg)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        onMouseDown={e => (e.currentTarget.style.transform = "scale(0.92)")}
        onMouseUp={e => (e.currentTarget.style.transform = "scale(1.08)")}
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>
    </nav>
  );
}
