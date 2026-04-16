"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark flex flex-col items-center justify-center px-6">
      <div className="space-y-8 text-center max-w-2xl">
        <h1 className="text-5xl font-black text-white uppercase tracking-tight">
          ElPiqueApp
        </h1>
        <p className="text-2xl text-rodeo-lime font-bold">
          Tu app deportiva
        </p>
        <p className="text-lg text-rodeo-cream/70">
          Reserva canchas deportivas en Catamarca
        </p>

        <div className="space-y-4 pt-8">
          <Link
            href="/explorar"
            className="block liquid-button py-4 text-lg font-bold hover:bg-white/20 transition"
          >
            Explorar Complejos
          </Link>
          <Link
            href="/mapa"
            className="block liquid-button py-4 text-lg font-bold hover:bg-white/20 transition"
          >
            Ver Mapa
          </Link>
          <Link
            href="/torneos"
            className="block liquid-button py-4 text-lg font-bold hover:bg-white/20 transition"
          >
            Torneos
          </Link>
        </div>
      </div>
    </div>
  );
}
