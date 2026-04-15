"use client";

import { useEffect, useState } from "react";

type DeviceOS = "android" | "ios" | null;

function detectOS(): DeviceOS {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return null;
}

export default function DeviceDetection() {
  const [os, setOS] = useState<DeviceOS>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setOS(detectOS());
  }, []);

  if (!os || dismissed) return null;

  if (os === "android") {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-3 bg-rodeo-terracotta/90 backdrop-blur-md text-rodeo-cream text-sm md:hidden">
        <span>Descargá la App Nativa para una mejor experiencia.</span>
        <div className="flex gap-2 shrink-0">
          <a
            href="#"
            className="liquid-button text-xs py-1 px-3"
          >
            Descargar
          </a>
          <button
            onClick={() => setDismissed(true)}
            className="text-rodeo-cream/70 hover:text-rodeo-cream transition-colors px-1"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // ios
  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm md:hidden"
        onClick={() => setDismissed(true)}
      >
        <div
          className="liquid-panel mx-6 p-6 flex flex-col gap-4 max-w-sm w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-rodeo-cream font-bold text-lg">
            Instalá la App en tu iPhone
          </h2>
          <ol className="text-rodeo-cream/80 text-sm space-y-2 list-decimal list-inside">
            <li>
              Tocá el botón <strong>Compartir</strong> en Safari (ícono de
              cuadrado con flecha).
            </li>
            <li>
              Desplazate hacia abajo y elegí{" "}
              <strong>"Agregar a pantalla de inicio"</strong>.
            </li>
            <li>
              Tocá <strong>Agregar</strong>. ¡Listo!
            </li>
          </ol>
          <button
            onClick={() => setDismissed(true)}
            className="liquid-button text-sm text-center"
          >
            Entendido
          </button>
        </div>
      </div>
    </>
  );
}
