"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { detectarCiudad, limpiarCacheGeo, GeoCity } from "@/lib/hooks/useGeoCity";

interface CityContextType {
  geoCity: GeoCity | null;
  ciudadCorta: string;
  provincia: string;
  lat: number | null;
  lng: number | null;
  loading: boolean;
  cambiarCiudad: (city: ManualCity) => void;
  resetearCiudad: () => void;
  esManual: boolean;
}

export interface ManualCity {
  ciudadCorta: string;
  ciudad: string;
  provincia: string;
  lat: number;
  lng: number;
}

// Ciudades disponibles en el sistema
export const CIUDADES_DISPONIBLES: ManualCity[] = [
  { ciudadCorta: "Catamarca", ciudad: "San Fernando del Valle de Catamarca", provincia: "Catamarca", lat: -28.4696, lng: -65.7852 },
  { ciudadCorta: "Tucumán", ciudad: "San Miguel de Tucumán", provincia: "Tucumán", lat: -26.8083, lng: -65.2176 },
  { ciudadCorta: "Córdoba", ciudad: "Córdoba", provincia: "Córdoba", lat: -31.4201, lng: -64.1888 },
  { ciudadCorta: "Salta", ciudad: "Salta", provincia: "Salta", lat: -24.7821, lng: -65.4232 },
  { ciudadCorta: "Buenos Aires", ciudad: "Ciudad Autónoma de Buenos Aires", provincia: "Buenos Aires", lat: -34.6037, lng: -58.3816 },
  { ciudadCorta: "Mendoza", ciudad: "Mendoza", provincia: "Mendoza", lat: -32.8895, lng: -68.8458 },
  { ciudadCorta: "Rosario", ciudad: "Rosario", provincia: "Santa Fe", lat: -32.9468, lng: -60.6393 },
];

const CityContext = createContext<CityContextType>({
  geoCity: null,
  ciudadCorta: "Catamarca",
  provincia: "Catamarca",
  lat: null,
  lng: null,
  loading: true,
  cambiarCiudad: () => {},
  resetearCiudad: () => {},
  esManual: false,
});

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [geoCity, setGeoCity] = useState<GeoCity | null>(null);
  const [manualCity, setManualCity] = useState<ManualCity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Chequear si hay ciudad manual guardada
    try {
      const saved = localStorage.getItem("elpique_manual_city");
      if (saved) setManualCity(JSON.parse(saved));
    } catch { /* ignore */ }

    detectarCiudad().then((city) => {
      setGeoCity(city);
      setLoading(false);
    });
  }, []);

  const cambiarCiudad = (city: ManualCity) => {
    setManualCity(city);
    try {
      localStorage.setItem("elpique_manual_city", JSON.stringify(city));
    } catch { /* ignore */ }
  };

  const resetearCiudad = () => {
    setManualCity(null);
    limpiarCacheGeo();
    try { localStorage.removeItem("elpique_manual_city"); } catch { /* ignore */ }
    setLoading(true);
    detectarCiudad().then((city) => {
      setGeoCity(city);
      setLoading(false);
    });
  };

  const ciudad = manualCity ?? {
    ciudadCorta: geoCity?.ciudadCorta ?? "Catamarca",
    ciudad: geoCity?.ciudad ?? "San Fernando del Valle de Catamarca",
    provincia: geoCity?.provincia ?? "Catamarca",
    lat: geoCity?.lat ?? -28.4696,
    lng: geoCity?.lng ?? -65.7852,
  };

  return (
    <CityContext.Provider value={{
      geoCity,
      ciudadCorta: ciudad.ciudadCorta,
      provincia: ciudad.provincia,
      lat: ciudad.lat,
      lng: ciudad.lng,
      loading,
      cambiarCiudad,
      resetearCiudad,
      esManual: !!manualCity,
    }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCityContext() {
  return useContext(CityContext);
}
