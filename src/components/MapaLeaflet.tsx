"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

// Tipos
type Complejo = {
  id: number;
  nombre: string;
  deporte: string;
  descripcion: string;
  horario: string;
  telefono: string;
  abierto: boolean;
  distancia: string;
  rating: number;
  lat: number;
  lng: number;
  slug: string;
};

interface MapaLeafletProps {
  complejos: Complejo[];
  onSelectComplejo?: (complejo: Complejo) => void;
  filtroDeporte?: string;
  selectedId?: number | null;
}

// Colores por deporte
const DEPORTE_COLORS: Record<string, string> = {
  fútbol: "#C8FF00",
  padel: "#00E5FF",
  vóley: "#FF6B35",
  tenis: "#FFD600",
  básquetbol: "#FF4081",
  default: "#C8FF00",
};

function getColor(deporte: string) {
  return DEPORTE_COLORS[deporte.toLowerCase()] || DEPORTE_COLORS.default;
}

export default function MapaLeaflet({
  complejos,
  onSelectComplejo,
  filtroDeporte = "todos",
  selectedId,
}: MapaLeafletProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  const complejosFiltrados = complejos.filter((c) => {
    if (filtroDeporte === "todos") return true;
    return c.deporte.toLowerCase() === filtroDeporte.toLowerCase();
  });

  // Inicializar mapa solo una vez
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (leafletMapRef.current) return;
    if (!mapRef.current) return;

    // Importar Leaflet dinámicamente
    import("leaflet").then((L) => {
      // Fix Leaflet default icon path en Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [-28.4696, -65.4089],
        zoom: 13,
        scrollWheelZoom: true,
        zoomControl: false,
      });

      // Tile layer dark
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: "&copy; CARTO &copy; OpenStreetMap",
          maxZoom: 19,
        }
      ).addTo(map);

      // Zoom control en esquina inferior derecha
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // ── GPS: centrar en la posición del usuario ──────────────────────
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            map.flyTo([latitude, longitude], 14, { duration: 1.5 });

            // Marcador "Tu ubicación" — punto azul con halo pulsante
            const userIcon = L.divIcon({
              className: "",
              html: `
                <div style="position:relative; display:flex; align-items:center; justify-content:center; width:20px; height:20px;">
                  <div style="
                    position:absolute; width:32px; height:32px;
                    background:rgba(59,130,246,0.2);
                    border-radius:50%;
                    animation:userPulse 2s infinite;
                  "></div>
                  <div style="
                    width:14px; height:14px;
                    background:#3B82F6;
                    border:3px solid white;
                    border-radius:50%;
                    box-shadow:0 2px 8px rgba(59,130,246,0.6);
                    position:relative; z-index:1;
                  "></div>
                </div>
                <style>
                  @keyframes userPulse {
                    0%,100% { transform:scale(1); opacity:0.7; }
                    50% { transform:scale(1.8); opacity:0; }
                  }
                </style>
              `,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });

            L.marker([latitude, longitude], { icon: userIcon })
              .addTo(map)
              .bindTooltip("Tu ubicación", { direction: "top", permanent: false });
          },
          () => {
            // Permiso denegado o error — mantener vista de Catamarca
            console.log("Geolocalización no disponible");
          },
          { timeout: 5000, maximumAge: 60000 }
        );
      }

      leafletMapRef.current = map;
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualizar marcadores cuando cambian los complejos o la selección
  useEffect(() => {
    if (!leafletMapRef.current) return;
    if (typeof window === "undefined") return;

    import("leaflet").then((L) => {
      const map = leafletMapRef.current;

      // Limpiar markers anteriores
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      complejosFiltrados.forEach((complejo) => {
        const isSelected = selectedId === complejo.id;
        const color = getColor(complejo.deporte);

        // Marcador personalizado con DivIcon
        const html = `
          <div style="
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
            transform-origin: bottom center;
            ${isSelected ? "transform: scale(1.3);" : "transform: scale(1);"}
            transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
          ">
            <!-- Pin principal -->
            <div style="
              display: flex;
              align-items: center;
              gap: 5px;
              padding: 5px 10px;
              background: ${isSelected
                ? `linear-gradient(135deg, ${color}ee, ${color}bb)`
                : `linear-gradient(135deg, rgba(4,13,7,0.92), rgba(10,25,14,0.95))`};
              border: 1.5px solid ${color};
              border-radius: 20px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.6), 0 0 0 ${isSelected ? "3" : "0"}px ${color}40, inset 0 1px 0 rgba(255,255,255,0.15);
              backdrop-filter: blur(12px);
              -webkit-backdrop-filter: blur(12px);
              white-space: nowrap;
            ">
              <!-- Punto de estado -->
              <div style="
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: ${color};
                box-shadow: 0 0 ${isSelected ? "10px" : "6px"} ${color};
                flex-shrink: 0;
                ${complejo.abierto ? `animation: pulse-${complejo.id} 2s infinite;` : "opacity: 0.4;"}
              "></div>
              <!-- Texto -->
              <span style="
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 0.02em;
                color: ${isSelected ? "rgba(4,13,7,1)" : color};
                font-family: system-ui, -apple-system, sans-serif;
                max-width: 100px;
                overflow: hidden;
                text-overflow: ellipsis;
              ">${complejo.nombre}</span>
            </div>
            <!-- Aguja del pin -->
            <div style="
              width: 0;
              height: 0;
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-top: 7px solid ${color};
              margin-top: -1px;
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
            "></div>
          </div>
        `;

        const icon = L.divIcon({
          html,
          className: "",
          iconSize: [120, 42],
          iconAnchor: [60, 42],
          popupAnchor: [0, -42],
        });

        const marker = L.marker([complejo.lat, complejo.lng], { icon });

        marker.on("click", () => {
          onSelectComplejo?.(complejo);
        });

        // Tooltip con info al hover
        marker.bindTooltip(`
          <div style="
            background: rgba(4,13,7,0.95);
            border: 1px solid ${color}60;
            border-radius: 12px;
            padding: 8px 12px;
            font-family: system-ui, sans-serif;
            backdrop-filter: blur(20px);
          ">
            <div style="color:${color}; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em;">${complejo.deporte}</div>
            <div style="color:white; font-size:13px; font-weight:800; margin-top:2px;">${complejo.nombre}</div>
            <div style="color:rgba(255,255,255,0.5); font-size:11px; margin-top:3px;">⭐ ${complejo.rating} · ${complejo.distancia}</div>
            <div style="color:${complejo.abierto ? "#00E676" : "rgba(255,255,255,0.3)"}; font-size:10px; font-weight:700; margin-top:2px;">${complejo.abierto ? "● Abierto ahora" : "● Cerrado"}</div>
          </div>
        `, {
          direction: "top",
          offset: [0, -42],
          className: "leaflet-custom-tooltip",
          permanent: false,
          sticky: false,
        });

        marker.addTo(map);
        markersRef.current.push(marker);
      });

      // Ajustar vista para que entren todos los marcadores
      if (complejosFiltrados.length > 0) {
        const bounds = L.latLngBounds(
          complejosFiltrados.map((c) => [c.lat, c.lng] as [number, number])
        );
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complejosFiltrados.map((c) => c.id).join(","), selectedId]);

  return (
    <>
      <style>{`
        .leaflet-custom-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-custom-tooltip::before {
          display: none !important;
        }
        .leaflet-container {
          background: #040D07;
        }
      `}</style>
      <div ref={mapRef} className="w-full h-full" />
    </>
  );
}
