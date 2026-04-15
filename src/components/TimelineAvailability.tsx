"use client";

import { useRef } from "react";
import { motion } from "framer-motion";

interface TimelineAvailabilityProps {
  disponibilidad: Record<string, boolean>;
  selectedHora: string | null;
  onSelectHora: (hora: string) => void;
}

export default function TimelineAvailability({
  disponibilidad,
  selectedHora,
  onSelectHora,
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
        <motion.div
          ref={scrollRef}
          className="flex gap-1 min-w-max px-4 py-2 bg-white/2 rounded-liquid border border-white/10"
          drag="x"
          dragElastic={0.2}
        >
          {horas.map((hora) => {
            const disponible = disponibilidad[hora];
            const isNow = parseInt(hora) === ahora;
            const isSelected = selectedHora === hora;

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
        </motion.div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-rodeo-cream/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rodeo-lime" />
          Disponible
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          Ocupado
        </div>
      </div>
    </div>
  );
}
