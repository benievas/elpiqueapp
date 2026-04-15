"use client";

import { useState } from "react";
import Link from "next/link";

const navItems = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/explorar", label: "Explorar", icon: "🔍" },
  { href: "/mapa", label: "Mapa", icon: "🗺️" },
  { href: "/torneos", label: "Torneos", icon: "🏆" },
  { href: "/feed", label: "Feed", icon: "📰" },
];

export default function BottomNav() {
  const [hasNotification] = useState(true);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div className="liquid-panel rounded-t-liquid-lg rounded-b-none px-4 py-3 flex items-center justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 text-rodeo-cream/70 hover:text-rodeo-cream transition-colors relative"
          >
            <span className="text-xl leading-none">{item.icon}</span>
            {item.label === "Perfil" && hasNotification && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rodeo-terracotta rounded-full" />
            )}
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}

        {/* SOS Button */}
        <button
          onClick={() => alert("SOS: Llamando a emergencias...")}
          className="flex flex-col items-center gap-1"
          aria-label="SOS Emergencia"
        >
          <span className="w-10 h-10 rounded-full bg-red-600/90 border border-red-400/50 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            SOS
          </span>
        </button>
      </div>
    </nav>
  );
}
