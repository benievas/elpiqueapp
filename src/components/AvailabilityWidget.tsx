"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import TimelineAvailability from "./TimelineAvailability";
import DatePickerCustom from "./DatePickerCustom";

interface Court {
  id: number;
  nombre: string;
  deporte: string;
  precio: number;
  disponible: boolean;
}

interface AvailabilityWidgetProps {
  complejo: {
    nombre: string;
    whatsapp: string;
  };
  canchas: Court[];
}

// Genera mock availability data
function generarDisponibilidad(fecha: string, canchaid: number): Record<string, boolean> {
  const disponibilidad: Record<string, boolean> = {};
  for (let hora = 6; hora <= 23; hora++) {
    const horaStr = `${hora.toString().padStart(2, "0")}:00`;
    disponibilidad[horaStr] = (hora + canchaid) % 3 !== 0;
  }
  return disponibilidad;
}

// Obtiene próximos 14 días disponibles
function obtenerProximosDiasDisponibles(): string[] {
  const dias = [];
  const hoy = new Date();

  for (let i = 0; i < 14; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() + i);
    dias.push(fecha.toISOString().split("T")[0]);
  }
  return dias;
}

export default function AvailabilityWidget({
  complejo,
  canchas,
}: AvailabilityWidgetProps) {
  const proximosDias = useMemo(() => obtenerProximosDiasDisponibles(), []);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(proximosDias[0]);
  const [canchaSeleccionada, setCanchaSeleccionada] = useState<number>(
    canchas[0]?.id || 1
  );
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);

  const disponibilidad = generarDisponibilidad(
    fechaSeleccionada,
    canchaSeleccionada
  );
  const canchaNombre =
    canchas.find((c) => c.id === canchaSeleccionada)?.nombre || "";
  const fechaFormato = new Date(fechaSeleccionada + "T00:00:00").toLocaleDateString(
    "es-AR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    }
  );

  const cancha = canchas.find((c) => c.id === canchaSeleccionada);
  const precioTotal = cancha ? cancha.precio : 0;

  const generarLinkWhatsApp = () => {
    if (!horaSeleccionada) return "";

    const mensaje = encodeURIComponent(
      `Hola! Quiero reservar la cancha *${canchaNombre}* en *${complejo.nombre}*.\n` +
        `📅 Fecha: ${fechaFormato}\n` +
        `🕐 Hora: ${horaSeleccionada}\n` +
        `💰 Precio: $${precioTotal.toLocaleString()}\n` +
        `Confirmarme disponibilidad. ¡Gracias!`
    );
    return `https://wa.me/${complejo.whatsapp}?text=${mensaje}`;
  };

  return (
    <div className="space-y-6">
      {/* SELECTOR DE CANCHA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="liquid-panel p-6"
      >
        <h3 className="text-sm font-bold tracking-widest uppercase text-rodeo-cream/60 mb-4">
          Seleccionar Cancha
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {canchas
            .filter((c) => c.disponible)
            .map((cancha) => (
              <motion.button
                key={cancha.id}
                onClick={() => {
                  setCanchaSeleccionada(cancha.id);
                  setHoraSeleccionada(null);
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`p-4 rounded-liquid border transition-all text-sm font-bold ${
                  canchaSeleccionada === cancha.id
                    ? "bg-rodeo-lime text-rodeo-dark border-rodeo-lime shadow-lg shadow-rodeo-lime/40"
                    : "bg-white/5 border-white/10 text-rodeo-cream hover:bg-white/10"
                }`}
              >
                <div className="truncate">{cancha.nombre}</div>
                <div className="text-xs opacity-70 mt-1">
                  ${(cancha.precio / 1000).toFixed(0)}K/h
                </div>
              </motion.button>
            ))}
        </div>
      </motion.div>

      {/* SELECTOR DE FECHA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <DatePickerCustom
          selectedDate={fechaSeleccionada}
          onSelectDate={setFechaSeleccionada}
          availableDates={proximosDias}
        />
      </motion.div>

      {/* SELECTOR DE HORA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <TimelineAvailability
          disponibilidad={disponibilidad}
          selectedHora={horaSeleccionada}
          onSelectHora={setHoraSeleccionada}
        />
      </motion.div>

      {/* RESUMEN Y BOTÓN RESERVAR */}
      {horaSeleccionada && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="liquid-panel p-6 bg-rodeo-lime/10 border-rodeo-lime/40 space-y-6"
        >
          {/* Resumen en grid */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-rodeo-cream/60 mb-1">Cancha</p>
              <p className="text-sm font-bold text-rodeo-lime">{canchaNombre}</p>
            </div>
            <div>
              <p className="text-xs text-rodeo-cream/60 mb-1">Fecha</p>
              <p className="text-sm font-bold text-rodeo-lime">
                {new Date(fechaSeleccionada).getDate()}
              </p>
            </div>
            <div>
              <p className="text-xs text-rodeo-cream/60 mb-1">Hora</p>
              <p className="text-sm font-bold text-rodeo-lime">{horaSeleccionada}</p>
            </div>
          </div>

          {/* Precio */}
          <div className="flex justify-between items-center border-t border-white/10 pt-6">
            <span className="text-sm text-rodeo-cream/60">Total a pagar:</span>
            <span className="text-4xl font-black text-rodeo-lime">
              ${precioTotal.toLocaleString()}
            </span>
          </div>

          {/* CTA */}
          <a
            href={generarLinkWhatsApp()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 rounded-liquid bg-rodeo-lime text-rodeo-dark font-bold text-center hover:bg-rodeo-lime/90 transition-all flex items-center justify-center gap-2 text-base hover:shadow-lg hover:shadow-rodeo-lime/40"
          >
            Confirmar Reserva por WhatsApp 🚀
            <ArrowRight size={20} />
          </a>
        </motion.div>
      )}
    </div>
  );
}
