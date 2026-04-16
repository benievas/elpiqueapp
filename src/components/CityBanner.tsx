"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronDown, Navigation, X, Check } from "lucide-react";
import { useCityContext, CIUDADES_DISPONIBLES, ManualCity } from "@/lib/context/CityContext";

interface CityBannerProps {
  /** Si es true, el feed muestra toggle local/todas */
  showFeedToggle?: boolean;
  feedScope?: "local" | "todas";
  onFeedScopeChange?: (scope: "local" | "todas") => void;
}

export default function CityBanner({ showFeedToggle, feedScope, onFeedScopeChange }: CityBannerProps) {
  const { ciudadCorta, provincia, loading, cambiarCiudad, resetearCiudad, esManual, geoCity } = useCityContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [buscador, setBuscador] = useState("");

  const ciudadesFiltradas = CIUDADES_DISPONIBLES.filter(
    (c) =>
      c.ciudadCorta.toLowerCase().includes(buscador.toLowerCase()) ||
      c.provincia.toLowerCase().includes(buscador.toLowerCase())
  );

  const seleccionarCiudad = (city: ManualCity) => {
    cambiarCiudad(city);
    setModalOpen(false);
    setBuscador("");
  };

  if (loading) {
    return (
      <div
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }}
        className="flex items-center gap-2 px-3 py-2 w-fit"
      >
        <div className="w-3 h-3 rounded-full bg-rodeo-lime/40 animate-pulse" />
        <span className="text-xs text-rodeo-cream/40">Detectando ubicación...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        {/* Pill de ciudad actual */}
        <button
          onClick={() => setModalOpen(true)}
          style={{
            background: "rgba(200,255,0,0.08)",
            border: "1px solid rgba(200,255,0,0.2)",
            borderRadius: "12px",
          }}
          className="flex items-center gap-2 px-3 py-2 hover:bg-rodeo-lime/15 transition-all"
        >
          <MapPin size={13} className="text-rodeo-lime" />
          <span className="text-sm font-bold text-rodeo-lime">{ciudadCorta}</span>
          {provincia !== ciudadCorta && (
            <span className="text-xs text-rodeo-cream/40 hidden sm:inline">{provincia}</span>
          )}
          <ChevronDown size={13} className="text-rodeo-lime/60" />
        </button>

        {/* Badge GPS/Manual */}
        {esManual ? (
          <button
            onClick={resetearCiudad}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] text-rodeo-cream/50 hover:text-rodeo-cream hover:bg-white/10 transition-all"
          >
            <Navigation size={10} />
            Volver a mi ubicación
          </button>
        ) : geoCity?.fuente === "gps" ? (
          <span
            style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "8px" }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] text-blue-400"
          >
            <Navigation size={10} />
            GPS activo
          </span>
        ) : geoCity?.fuente === "cache" ? (
          <span className="text-[10px] text-rodeo-cream/30">📍 Ubicación guardada</span>
        ) : null}

        {/* Feed toggle */}
        {showFeedToggle && (
          <div
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
            className="flex ml-auto"
          >
            {(["local", "todas"] as const).map((scope) => (
              <button
                key={scope}
                onClick={() => onFeedScopeChange?.(scope)}
                className={`px-3 py-1.5 text-xs font-bold rounded-[9px] transition-all ${
                  feedScope === scope
                    ? "bg-rodeo-lime text-rodeo-dark"
                    : "text-rodeo-cream/50 hover:text-rodeo-cream"
                }`}
              >
                {scope === "local" ? "Mi ciudad" : "Todas"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal selector de ciudad */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 md:inset-0 md:flex md:items-center md:justify-center"
            >
              <div
                style={{
                  background: "linear-gradient(160deg, #0D1F10 0%, #0A1A0D 100%)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "24px 24px 0 0",
                  maxHeight: "80vh",
                }}
                className="w-full md:max-w-md md:rounded-3xl overflow-hidden flex flex-col"
              >
                {/* Header modal */}
                <div className="p-6 border-b border-white/8 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white">Seleccionar ciudad</h3>
                    <p className="text-xs text-rodeo-cream/50 mt-0.5">Mostrando contenido de tu ciudad</p>
                  </div>
                  <button
                    onClick={() => setModalOpen(false)}
                    style={{ background: "rgba(255,255,255,0.08)", borderRadius: "10px" }}
                    className="w-9 h-9 flex items-center justify-center hover:bg-white/15 transition-all"
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>

                {/* Buscador */}
                <div className="px-6 py-4">
                  <input
                    type="text"
                    placeholder="Buscar ciudad..."
                    value={buscador}
                    onChange={(e) => setBuscador(e.target.value)}
                    autoFocus
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    className="w-full px-4 py-2.5 text-sm text-rodeo-cream placeholder-rodeo-cream/30 focus:outline-none focus:border-rodeo-lime/40 transition-all"
                  />
                </div>

                {/* Opción GPS */}
                <button
                  onClick={resetearCiudad}
                  style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "12px", margin: "0 24px 8px" }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-blue-500/15 transition-all text-left"
                >
                  <Navigation size={16} className="text-blue-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-blue-400">Usar mi ubicación</p>
                    <p className="text-xs text-rodeo-cream/40">Detectar automáticamente</p>
                  </div>
                </button>

                {/* Lista ciudades */}
                <div className="overflow-y-auto flex-1 px-6 pb-8 space-y-2">
                  {ciudadesFiltradas.map((city) => {
                    const isActive = city.ciudadCorta === ciudadCorta;
                    return (
                      <button
                        key={city.ciudadCorta}
                        onClick={() => seleccionarCiudad(city)}
                        style={{
                          background: isActive ? "rgba(200,255,0,0.1)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${isActive ? "rgba(200,255,0,0.3)" : "rgba(255,255,255,0.08)"}`,
                          borderRadius: "12px",
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/8 transition-all text-left"
                      >
                        <div>
                          <p className={`text-sm font-bold ${isActive ? "text-rodeo-lime" : "text-white"}`}>
                            {city.ciudadCorta}
                          </p>
                          <p className="text-xs text-rodeo-cream/40">{city.provincia}</p>
                        </div>
                        {isActive && <Check size={16} className="text-rodeo-lime shrink-0" />}
                      </button>
                    );
                  })}
                  {ciudadesFiltradas.length === 0 && (
                    <p className="text-center text-rodeo-cream/40 text-sm py-8">
                      No encontramos esa ciudad aún 🚀
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
