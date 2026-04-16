/**
 * useGeoCity — Detecta la ciudad del usuario via GPS + Nominatim reverse geocoding.
 * Cachea el resultado en localStorage (TTL: 1 hora).
 */

export interface GeoCity {
  lat: number;
  lng: number;
  ciudad: string;        // "San Fernando del Valle de Catamarca"
  ciudadCorta: string;   // "Catamarca"
  provincia: string;     // "Catamarca"
  fuente: "gps" | "cache" | "default";
}

const CACHE_KEY = "elpique_geocity";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

const DEFAULT_CITY: GeoCity = {
  lat: -28.4696,
  lng: -65.7852,
  ciudad: "San Fernando del Valle de Catamarca",
  ciudadCorta: "Catamarca",
  provincia: "Catamarca",
  fuente: "default",
};

function acortarCiudad(ciudad: string, provincia: string): string {
  // Casos comunes de Argentina
  const mapeo: Record<string, string> = {
    "San Fernando del Valle de Catamarca": "Catamarca",
    "San Miguel de Tucumán": "Tucumán",
    "Ciudad Autónoma de Buenos Aires": "Buenos Aires",
    "Mar del Plata": "Mar del Plata",
    "San Carlos de Bariloche": "Bariloche",
    "San Salvador de Jujuy": "Jujuy",
    "Comodoro Rivadavia": "Comodoro Rivadavia",
    "Río Cuarto": "Río Cuarto",
    "San Juan": "San Juan",
    "San Luis": "San Luis",
    "Santa Fe": "Santa Fe",
    "Paraná": "Paraná",
    "Resistencia": "Resistencia",
    "Corrientes": "Corrientes",
    "Posadas": "Posadas",
    "Neuquén": "Neuquén",
    "Viedma": "Viedma",
    "Rawson": "Rawson",
    "Ushuaia": "Ushuaia",
    "Río Gallegos": "Río Gallegos",
    "Mendoza": "Mendoza",
    "Córdoba": "Córdoba",
    "Rosario": "Rosario",
    "La Plata": "La Plata",
    "Salta": "Salta",
    "Tucumán": "Tucumán",
  };
  return mapeo[ciudad] || ciudad.split(",")[0].trim() || provincia;
}

function leerCache(): (GeoCity & { timestamp: number }) | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function escribirCache(city: GeoCity) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...city, timestamp: Date.now() }));
  } catch { /* ignore */ }
}

/**
 * Obtiene la ciudad del usuario. Usa cache si está vigente, sino GPS + Nominatim.
 * Siempre retorna algo (fallback = Catamarca).
 */
export async function detectarCiudad(): Promise<GeoCity> {
  // 1. Intentar cache primero
  const cached = leerCache();
  if (cached) {
    return { ...cached, fuente: "cache" };
  }

  // 2. GPS
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return DEFAULT_CITY;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          // 3. Reverse geocode con Nominatim (gratuito, sin API key)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=es`,
            { headers: { "User-Agent": "ElPiqueApp/1.0" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const ciudad =
            addr.city || addr.town || addr.village || addr.county || addr.state || "Desconocida";
          const provincia = addr.state || "Argentina";
          const ciudadCorta = acortarCiudad(ciudad, provincia);

          const result: GeoCity = {
            lat: latitude,
            lng: longitude,
            ciudad,
            ciudadCorta,
            provincia,
            fuente: "gps",
          };
          escribirCache(result);
          resolve(result);
        } catch {
          // Nominatim error → al menos tenemos las coords
          resolve({
            lat: latitude,
            lng: longitude,
            ciudad: "Mi ubicación",
            ciudadCorta: "Mi ubicación",
            provincia: "Argentina",
            fuente: "gps",
          });
        }
      },
      () => resolve(DEFAULT_CITY), // GPS denegado
      { timeout: 6000, maximumAge: 60000 }
    );
  });
}

/** Limpia el cache para forzar re-detección */
export function limpiarCacheGeo() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CACHE_KEY);
  }
}
