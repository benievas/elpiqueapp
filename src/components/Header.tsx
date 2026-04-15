"use client";

import Link from "next/link";
import Image from "next/image";
import CitySelector from "./CitySelector";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full">
      <nav className="liquid-panel mx-2 sm:mx-4 my-3 px-6 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-12 w-12">
            <Image
              src="/assets/logo-main.png"
              alt="ElPiqueApp"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="hidden sm:inline font-black text-lg text-rodeo-cream">
            ElPiqueApp
          </span>
        </Link>

        {/* Nav Links (Desktop) */}
        <div className="hidden md:flex gap-8 items-center">
          <Link href="/explorar" className="text-rodeo-cream/70 hover:text-rodeo-cream transition-colors text-sm font-bold">
            Explorar
          </Link>
          <Link href="/mapa" className="text-rodeo-cream/70 hover:text-rodeo-cream transition-colors text-sm font-bold">
            Mapa
          </Link>
          <Link href="/torneos" className="text-rodeo-cream/70 hover:text-rodeo-cream transition-colors text-sm font-bold">
            Torneos
          </Link>
          <Link href="/feed" className="text-rodeo-cream/70 hover:text-rodeo-cream transition-colors text-sm font-bold">
            Feed
          </Link>
        </div>

        {/* City Selector */}
        <CitySelector className="hidden sm:block ml-auto" />

        {/* Right Side (Login, etc.) */}
        <div className="flex gap-3 items-center ml-auto sm:ml-0">
          <Link
            href="/login"
            className="liquid-button hidden sm:block text-sm"
          >
            Iniciar sesión
          </Link>
          <button className="p-2 hover:bg-white/10 rounded-liquid transition-colors">
            👤
          </button>
        </div>
      </nav>
    </header>
  );
}

export default Header;
