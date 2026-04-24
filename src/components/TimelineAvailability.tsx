"use client";

import { useRef } from "react";
import { motion } from "framer-motion";

interface TimelineAvailabilityProps {
  disponibilidad: Record<string, boolean>;
  selectedHora: string | null;
  onSelectHora: (hora: string) => void;
  horasEnRango?: string[];
  loading?: boolean;
}

export default function TimelineAvailability({
  disponibilidad,
  selectedHora,
  onSelectHora,
  horasEnRango,
  loading = false,
}: TimelineAvailabilityProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const ahora = new Date().getHours();

  const horas = Array.from({ length: 18 }, (_, i) => {
    const hora = 6 + i;
    return `${hora.toString().padStart(2, "0")}:00`;
  });

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold tracking-widest uppercase text-rodeo-cream/60">
        Seleccionar Horario
      </h3>

      {/* Timeline scroll */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-rodeo-lime/30 scrollbar-track-white/5">
        {loading ? (
          <div className="flex gap-1 px-4 py-2 min-w-max">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[60px] h-14 rounded-lg"
                style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.5s infinite" }}
              />
            ))}
          </div>
        ) : null}
        <div
          style={{ display: loading ? "none" : undefined }}
          ref={scrollRef}
          className="flex gap-1 min-w-max px-4 py-2 bg-white/2 rounded-liquid border border-white/10"
        >
          {horas.map((hora) => {
            const disponible = disponibilidad[hora];
            const isNow = parseInt(hora) === ahora;
            const isSelected = selectedHora === hora;
            const isInRange = horasEnRango?.includes(hora) && !isSelected;

            return (
              <motion.button
                key={hora}
                onClick={() => disponible && onSelectHora(hora)}
                whileHover={disponible ? { scale: 1.1, y: -4 } : {}}
                whileTap={disponible ? { scale: 0.95 } : {}}
                disabled={!disponible}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-lg
                  transition-all min-w-[60px] font-bold
                  ${
                    isSelected
                      ? "bg-rodeo-lime text-rodeo-dark border border-rodeo-lime shadow-lg shadow-rodeo-lime/40"
                      : isInRange
                      ? "bg-rodeo-lime/70 text-rodeo-dark/80 border border-rodeo-lime/60"
                      : disponible
                      ? "bg-rodeo-lime/10 border border-rodeo-lime/40 text-rodeo-lime hover:bg-rodeo-lime/20"
                      : "bg-red-500/10 border border-red-500/30 text-red-400/50 cursor-not-allowed opacity-50"
                  }
                  ${isNow ? "ring-2 ring-rodeo-cream/50" : ""}
                `}
              >
                <span className="text-xs">{hora}</span>
                <div
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    background: disponible ? "#C8FF00" : "#FF4040",
                    boxShadow: disponible
                      ? "0 0 8px rgba(200,255,0,0.5)"
                      : "none",
                  }}
                />
                {isNow && (
                  <span className="text-[10px] text-rodeo-cream/60 font-black">
                    HOY
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-rodeo-cream/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rodeo-lime" />
          Disponible
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rodeo-lime/70" />
          En reserva
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          Ocupado
        </div>
      </div>
    </div>
  );
}
