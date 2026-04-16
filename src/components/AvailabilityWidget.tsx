"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
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

// Agrega N horas a una hora en formato "HH:00"
function sumarHoras(hora: string, cantidad: number): string {
  const h = parseInt(hora.split(":")[0]);
  const nuevaHora = h + cantidad;
  return `${nuevaHora.toString().padStart(2, "0")}:00`;
}

// Verifica que todas las horas en el rango estén disponibles
function rangoDisponible(
  horaInicio: string,
  duracion: number,
  disponibilidad: Record<string, boolean>
): boolean {
  for (let i = 0; i < duracion; i++) {
    const h = sumarHoras(horaInicio, i);
    if (!disponibilidad[h]) return false;
  }
  return true;
}

const DURACIONES = [
  { valor: 1, label: "1 hora" },
  { valor: 1.5, label: "1h 30m" },
  { valor: 2, label: "2 horas" },
  { valor: 2.5, label: "2h 30m" },
  { valor: 3, label: "3 horas" },
];

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
  const [duracion, setDuracion] = useState(1);

  const disponibilidad = generarDisponibilidad(fechaSeleccionada, canchaSeleccionada);

  const canchaNombre = canchas.find((c) => c.id === canchaSeleccionada)?.nombre || "";
  const fechaFormato = new Date(fechaSeleccionada + "T00:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const cancha = canchas.find((c) => c.id === canchaSeleccionada);
  const precioTotal = cancha ? cancha.precio * duracion : 0;

  // Calcular hora de fin
  const horaFin = horaSeleccionada ? sumarHoras(horaSeleccionada, duracion) : null;

  // Verificar si el rango seleccionado es válido
  const rangoValido = horaSeleccionada
    ? rangoDisponible(horaSeleccionada, Math.ceil(duracion), disponibilidad)
    : false;

  const generarLinkWhatsApp = () => {
    if (!horaSeleccionada || !horaFin) return "";
    const mensaje = encodeURIComponent(
      `Hola! Quiero reservar la cancha *${canchaNombre}* en *${complejo.nombre}*.\n` +
        `📅 Fecha: ${fechaFormato}\n` +
        `🕐 Horario: ${horaSeleccionada} a ${horaFin} (${duracion}h)\n` +
        `💰 Precio estimado: $${precioTotal.toLocaleString()}\n` +
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
        <div className="flex flex-col gap-2">
          {canchas
            .filter((c) => c.disponible)
            .map((cancha) => (
              <motion.button
                key={cancha.id}
                onClick={() => {
                  setCanchaSeleccionada(cancha.id);
                  setHoraSeleccionada(null);
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`w-full px-4 py-3 rounded-liquid border transition-all text-left flex items-center justify-between gap-3 ${
                  canchaSeleccionada === cancha.id
                    ? "bg-rodeo-lime text-rodeo-dark border-rodeo-lime shadow-lg shadow-rodeo-lime/40"
                    : "bg-white/5 border-white/10 text-rodeo-cream hover:bg-white/10"
                }`}
              >
                <span className="text-sm font-bold">{cancha.nombre}</span>
                <span className={`text-xs font-bold shrink-0 ${
                  canchaSeleccionada === cancha.id ? "text-rodeo-dark/70" : "text-rodeo-lime"
                }`}>
                  ${(cancha.precio / 1000).toFixed(0)}K/h
                </span>
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
          onSelectDate={(d) => { setFechaSeleccionada(d); setHoraSeleccionada(null); }}
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

      {/* SELECTOR DE DURACIÓN */}
      {horaSeleccionada && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-panel p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-rodeo-lime" />
            <h3 className="text-sm font-bold tracking-widest uppercase text-rodeo-cream/60">
              ¿Cuántas horas?
            </h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {DURACIONES.map((d) => {
              const esValido = rangoDisponible(
                horaSeleccionada,
                Math.ceil(d.valor),
                disponibilidad
              );
              const fueraDeRango = horaSeleccionada
                ? parseInt(sumarHoras(horaSeleccionada, d.valor).split(":")[0]) > 24
                : false;

              return (
                <button
                  key={d.valor}
                  onClick={() => esValido && !fueraDeRango && setDuracion(d.valor)}
                  disabled={!esValido || fueraDeRango}
                  style={
                    duracion === d.valor
                      ? {
                          background: "linear-gradient(135deg, #C8FF00, #A8D800)",
                          borderRadius: "12px",
                          boxShadow: "0 4px 16px rgba(200,255,0,0.35)",
                          border: "1px solid rgba(200,255,0,0.6)",
                        }
                      : !esValido || fueraDeRango
                      ? {
                          background: "rgba(255,60,60,0.06)",
                          border: "1px solid rgba(255,60,60,0.15)",
                          borderRadius: "12px",
                          opacity: 0.4,
                        }
                      : {
                          background: "rgba(200,255,0,0.08)",
                          border: "1px solid rgba(200,255,0,0.2)",
                          borderRadius: "12px",
                        }
                  }
                  className={`px-4 py-2 text-sm font-bold transition-all ${
                    duracion === d.valor
                      ? "text-rodeo-dark"
                      : !esValido || fueraDeRango
                      ? "text-red-400 cursor-not-allowed"
                      : "text-rodeo-lime hover:bg-rodeo-lime/15"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
          {!rangoValido && horaSeleccionada && (
            <p className="text-xs text-red-400/80 mt-3 flex items-center gap-1.5">
              <span>⚠</span>
              Hay horarios ocupados en ese rango. Elegí una duración más corta o cambiá la hora.
            </p>
          )}
        </motion.div>
      )}

      {/* RESUMEN Y BOTÓN RESERVAR */}
      {horaSeleccionada && rangoValido && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="liquid-panel p-6 bg-rodeo-lime/10 border-rodeo-lime/40 space-y-6"
        >
          {/* Resumen */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-xs text-rodeo-cream/60 mb-1">Cancha</p>
              <p className="text-sm font-bold text-rodeo-lime truncate">{canchaNombre}</p>
            </div>
            <div>
              <p className="text-xs text-rodeo-cream/60 mb-1">Fecha</p>
              <p className="text-sm font-bold text-rodeo-lime">
                {new Date(fechaSeleccionada + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
              </p>
            </div>
            <div>
              <p className="text-xs text-rodeo-cream/60 mb-1">Inicio</p>
              <p className="text-sm font-bold text-rodeo-lime">{horaSeleccionada}</p>
            </div>
            <div>
              <p className="text-xs text-rodeo-cream/60 mb-1">Fin</p>
              <p className="text-sm font-bold text-rodeo-lime">{horaFin}</p>
            </div>
          </div>

          {/* Duración + Precio */}
          <div
            style={{
              background: "rgba(200,255,0,0.06)",
              border: "1px solid rgba(200,255,0,0.15)",
              borderRadius: "16px",
            }}
            className="flex justify-between items-center px-5 py-4"
          >
            <div>
              <p className="text-xs text-rodeo-cream/50">Duración total</p>
              <p className="text-white font-bold">{duracion} hora{duracion !== 1 ? "s" : ""}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-rodeo-cream/50">Total estimado</p>
              <p className="text-3xl font-black text-rodeo-lime">
                ${precioTotal.toLocaleString()}
              </p>
            </div>
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
          <p className="text-center text-xs text-rodeo-cream/40">
            El precio es estimado. El dueño lo confirmará por WhatsApp.
          </p>
        </motion.div>
      )}
    </div>
  );
}
