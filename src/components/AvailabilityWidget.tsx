"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock, Minus, Plus, Check, X, MessageCircle } from "lucide-react";
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

// Retorna el array de horas cubiertas por el rango (sin incluir la hora de fin)
function horasEnRango(inicio: string, duracion: number): string[] {
  const slots: string[] = [];
  for (let i = 0; i < duracion; i++) {
    slots.push(sumarHoras(inicio, i));
  }
  return slots;
}

// Verifica que todas las horas en el rango estén disponibles
function horasLibres(
  inicio: string,
  duracion: number,
  disponibilidad: Record<string, boolean>
): boolean {
  for (let i = 0; i < duracion; i++) {
    const h = sumarHoras(inicio, i);
    if (!disponibilidad[h]) return false;
  }
  return true;
}

const MAX_DURACION = 6;
const MIN_DURACION = 1;

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reservaSent, setReservaSent] = useState(false);

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

  // Array de horas cubiertas por el rango actual
  const horasEnRangoActual: string[] = horaSeleccionada
    ? horasEnRango(horaSeleccionada, duracion)
    : [];

  // Verificar si el rango seleccionado es válido
  const rangoValido = horaSeleccionada
    ? horasLibres(horaSeleccionada, duracion, disponibilidad)
    : false;

  // Cambiar duración solo si el nuevo rango está disponible
  function handleSetDuracion(delta: number) {
    if (!horaSeleccionada) return;
    const nuevaDuracion = duracion + delta;
    if (nuevaDuracion < MIN_DURACION || nuevaDuracion > MAX_DURACION) return;
    const fueraDeRango =
      parseInt(sumarHoras(horaSeleccionada, nuevaDuracion).split(":")[0]) > 24;
    if (fueraDeRango) return;
    if (horasLibres(horaSeleccionada, nuevaDuracion, disponibilidad)) {
      setDuracion(nuevaDuracion);
    }
  }

  const generarLinkWhatsApp = () => {
    if (!horaSeleccionada || !horaFin) return "";
    const mensaje = encodeURIComponent(
      `Hola! Quiero reservar la cancha *${canchaNombre}* en *${complejo.nombre}*.\n` +
        `📅 Fecha: ${fechaFormato}\n` +
        `🕐 Horario: de ${horaSeleccionada} a ${horaFin} (${duracion}h)\n` +
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
            .map((c) => (
              <motion.button
                key={c.id}
                onClick={() => {
                  setCanchaSeleccionada(c.id);
                  setHoraSeleccionada(null);
                  setDuracion(1);
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`w-full px-4 py-3 rounded-liquid border transition-all text-left flex items-center justify-between gap-3 ${
                  canchaSeleccionada === c.id
                    ? "bg-rodeo-lime text-rodeo-dark border-rodeo-lime shadow-lg shadow-rodeo-lime/40"
                    : "bg-white/5 border-white/10 text-rodeo-cream hover:bg-white/10"
                }`}
              >
                <span className="text-sm font-bold">{c.nombre}</span>
                <span className={`text-xs font-bold shrink-0 ${
                  canchaSeleccionada === c.id ? "text-rodeo-dark/70" : "text-rodeo-lime"
                }`}>
                  ${(c.precio / 1000).toFixed(0)}K/h
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
          onSelectDate={(d) => {
            setFechaSeleccionada(d);
            setHoraSeleccionada(null);
            setDuracion(1);
          }}
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
          onSelectHora={(hora) => {
            setHoraSeleccionada(hora);
            setDuracion(1);
          }}
          horasEnRango={horasEnRangoActual}
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

          {/* Contador +/- */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => handleSetDuracion(-1)}
              disabled={duracion <= MIN_DURACION}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                duracion <= MIN_DURACION
                  ? "border-white/10 text-rodeo-cream/20 cursor-not-allowed"
                  : "border-rodeo-lime/40 text-rodeo-lime hover:bg-rodeo-lime/10 active:scale-95"
              }`}
            >
              <Minus size={16} />
            </button>

            <div className="flex-1 text-center">
              <span className="text-2xl font-black text-rodeo-lime">
                {duracion}
              </span>
              <span className="text-rodeo-cream/50 text-sm ml-1.5">
                hora{duracion !== 1 ? "s" : ""}
              </span>
            </div>

            <button
              onClick={() => handleSetDuracion(1)}
              disabled={
                duracion >= MAX_DURACION ||
                !horasLibres(horaSeleccionada, duracion + 1, disponibilidad) ||
                parseInt(sumarHoras(horaSeleccionada, duracion + 1).split(":")[0]) > 24
              }
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                duracion >= MAX_DURACION ||
                !horasLibres(horaSeleccionada, duracion + 1, disponibilidad) ||
                parseInt(sumarHoras(horaSeleccionada, duracion + 1).split(":")[0]) > 24
                  ? "border-white/10 text-rodeo-cream/20 cursor-not-allowed"
                  : "border-rodeo-lime/40 text-rodeo-lime hover:bg-rodeo-lime/10 active:scale-95"
              }`}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Barra visual 1-6 horas */}
          <div className="flex gap-1">
            {Array.from({ length: MAX_DURACION }, (_, i) => i + 1).map((slot) => {
              const isFilled = slot <= duracion;
              const isReachable =
                horasLibres(horaSeleccionada, slot, disponibilidad) &&
                parseInt(sumarHoras(horaSeleccionada, slot).split(":")[0]) <= 24;

              return (
                <button
                  key={slot}
                  onClick={() => {
                    if (isReachable) setDuracion(slot);
                  }}
                  disabled={!isReachable}
                  title={`${slot}h`}
                  className={`flex-1 h-2.5 rounded-full transition-all ${
                    isFilled && isReachable
                      ? "bg-rodeo-lime shadow-sm shadow-rodeo-lime/40"
                      : isReachable
                      ? "bg-rodeo-lime/20 hover:bg-rodeo-lime/40"
                      : "bg-red-500/20 cursor-not-allowed"
                  }`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-rodeo-cream/30 px-0.5">
            <span>1h</span>
            <span>6h</span>
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
          {/* Resumen — 4 celdas: Cancha / Inicio / Fin / Duración */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-xs text-rodeo-cream/60 mb-1">Cancha</p>
              <p className="text-sm font-bold text-rodeo-lime truncate">{canchaNombre}</p>
            </div>
            <div>
              <p className="text-xs text-rodeo-cream/60 mb-1">Inicio</p>
              <p className="text-sm font-bold text-rodeo-lime">{horaSeleccionada}</p>
            </div>
            <div>
              <p className="text-xs text-rodeo-cream/60 mb-1">Fin</p>
              <p className="text-sm font-bold text-rodeo-lime">{horaFin}</p>
            </div>
            <div>
              <p className="text-xs text-rodeo-cream/60 mb-1">Duración</p>
              <p className="text-sm font-bold text-rodeo-lime">{duracion}h</p>
            </div>
          </div>

          {/* Precio por hora × N = total */}
          <div
            style={{
              background: "rgba(200,255,0,0.06)",
              border: "1px solid rgba(200,255,0,0.15)",
              borderRadius: "16px",
            }}
            className="flex justify-between items-center px-5 py-4"
          >
            <div>
              <p className="text-xs text-rodeo-cream/50">Precio</p>
              <p className="text-white font-bold">
                ${cancha?.precio.toLocaleString()}/h × {duracion}h
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-rodeo-cream/50">Total estimado</p>
              <p className="text-3xl font-black text-rodeo-lime">
                ${precioTotal.toLocaleString()}
              </p>
            </div>
          </div>

          {/* CTA */}
          {reservaSent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-4"
            >
              <div className="w-12 h-12 rounded-full bg-rodeo-lime/20 border border-rodeo-lime/40 flex items-center justify-center">
                <Check size={22} className="text-rodeo-lime" />
              </div>
              <p className="text-sm font-bold text-white text-center">¡Solicitud enviada!</p>
              <p className="text-xs text-rodeo-cream/50 text-center">El dueño te confirmará la disponibilidad por WhatsApp.</p>
              <button
                onClick={() => { setReservaSent(false); setHoraSeleccionada(null); setDuracion(1); }}
                className="text-xs text-rodeo-lime/70 hover:text-rodeo-lime underline transition-colors"
              >
                Hacer otra reserva
              </button>
            </motion.div>
          ) : (
            <a
              href={generarLinkWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowConfirmModal(true)}
              className="w-full py-4 rounded-liquid bg-rodeo-lime text-rodeo-dark font-bold text-center hover:bg-rodeo-lime/90 transition-all flex items-center justify-center gap-2 text-base hover:shadow-lg hover:shadow-rodeo-lime/40"
            >
              Confirmar Reserva por WhatsApp 🚀
              <ArrowRight size={20} />
            </a>
          )}
          <p className="text-center text-xs text-rodeo-cream/40">
            El precio es estimado. El dueño lo confirmará por WhatsApp.
          </p>
        </motion.div>
      )}

      {/* Modal confirmación post-WhatsApp */}
      <AnimatePresence>
        {showConfirmModal && !reservaSent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{
                background: "rgba(26,18,11,0.98)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "24px",
                maxWidth: 380,
                width: "100%",
              }}
              className="p-6 space-y-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center shrink-0">
                  <MessageCircle size={22} className="text-green-400" />
                </div>
                <div>
                  <p className="text-base font-black text-white">¿Enviaste el mensaje?</p>
                  <p className="text-xs text-rodeo-cream/50 mt-1 leading-relaxed">
                    Se abrió WhatsApp con tu solicitud para <span className="text-rodeo-lime font-bold">{canchaNombre}</span>. ¿Pudiste enviarlo?
                  </p>
                </div>
              </div>

              <div
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px" }}
                className="px-4 py-3 text-xs text-rodeo-cream/60 space-y-1"
              >
                <p>📅 {fechaFormato}</p>
                <p>🕐 {horaSeleccionada} → {horaFin} ({duracion}h)</p>
                <p>💰 Total estimado: <span className="text-rodeo-lime font-bold">${precioTotal.toLocaleString()}</span></p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 rounded-[14px] text-sm font-bold text-rodeo-cream/60 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <X size={14} className="inline mr-1.5" />
                  No pude
                </button>
                <button
                  onClick={() => { setShowConfirmModal(false); setReservaSent(true); }}
                  className="flex-1 py-3 rounded-[14px] text-sm font-black text-rodeo-dark transition-all"
                  style={{ background: "rgba(200,255,0,0.95)" }}
                >
                  <Check size={14} className="inline mr-1.5" />
                  Sí, enviado
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
