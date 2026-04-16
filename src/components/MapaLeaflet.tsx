"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

// Componentes Leaflet dinámicos (no SSR)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

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
}

export default function MapaLeaflet({
  complejos,
  onSelectComplejo,
  filtroDeporte = "todos",
}: MapaLeafletProps) {
  const [selectedComplejo, setSelectedComplejo] = useState<Complejo | null>(null);

  // Filtrar complejos si hay deporte seleccionado
  const complejosFiltrados = complejos.filter((c) => {
    if (filtroDeporte === "todos") return true;
    return c.deporte.toLowerCase() === filtroDeporte.toLowerCase();
  });

  // Centro del mapa en Catamarca
  const centerLat = -28.4696;
  const centerLng = -65.7852;

  const handleSelectComplejo = (complejo: Complejo) => {
    setSelectedComplejo(complejo);
    onSelectComplejo?.(complejo);
  };

  return (
    <div className="w-full h-full">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ minHeight: "500px" }}
      >
        {/* CartoDB Dark Matter - mapa oscuro sin API key */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Marcadores de complejos */}
        {complejosFiltrados.map((complejo) => (
          <Marker
            key={complejo.id}
            position={[complejo.lat, complejo.lng]}
            eventHandlers={{
              click: () => handleSelectComplejo(complejo),
            }}
          >
            <Popup>
              <div className="text-sm font-semibold text-gray-900">
                {complejo.nombre}
              </div>
              <div className="text-xs text-gray-600 mt-1">{complejo.deporte}</div>
              <div className="text-xs text-gray-600 mt-1">{complejo.descripcion}</div>
              <div className="text-xs text-gray-600">⭐ {complejo.rating}/5</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Indicador de complejo seleccionado */}
      {selectedComplejo && (
        <div className="absolute bottom-6 left-6 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10">
          <div className="flex items-start gap-3">
            <MapPin size={20} className="text-rodeo-terracotta mt-1 shrink-0" />
            <div>
              <h3 className="font-bold text-gray-900">{selectedComplejo.nombre}</h3>
              <p className="text-sm text-gray-600 mt-1">{selectedComplejo.descripcion}</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-600">
                <span>⭐ {selectedComplejo.rating}</span>
                <span>📍 {selectedComplejo.distancia}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
