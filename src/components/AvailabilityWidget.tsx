"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock, Minus, Plus, Check, X, MessageCircle, LogIn } from "lucide-react";
import TimelineAvailability from "./TimelineAvailability";
import DatePickerCustom from "./DatePickerCustom";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase, supabaseMut } from "@/lib/supabase";

interface Court {
  id: number;        // índice visual (1, 2, 3...)
  realId: string;    // UUID real en DB
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
  complexId: string;
  canchas: Court[];
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

function sumarHoras(hora: string, cantidad: number): string {
  const h = parseInt(hora.split(":")[0]);
  const nuevaHora = h + cantidad;
  return `${nuevaHora.toString().padStart(2, "0")}:00`;
}

function horasEnRango(inicio: string, duracion: number): string[] {
  const slots: string[] = [];
  for (let i = 0; i < duracion; i++) {
    slots.push(sumarHoras(inicio, i));
  }
  return slots;
}

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

// Horario por defecto si el complejo no tiene datos (06:00–23:00)
function disponibilidadDefault(): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (let h = 6; h <= 23; h++) {
    result[`${h.toString().padStart(2, "0")}:00`] = true;
  }
  return result;
}

async function fetchDisponibilidadReal(courtRealId: string, fecha: string): Promise<Record<string, boolean>> {
  const result = disponibilidadDefault();
  try {
    // Bloquear slots con reservas pendientes o confirmadas
    const { data: reservas } = await supabase
      .from("reservations")
      .select("hora_inicio, hora_fin")
      .eq("court_id", courtRealId)
      .eq("fecha", fecha)
      .in("estado", ["pendiente", "confirmada"]) as { data: { hora_inicio: string; hora_fin: string }[] | null };

    if (reservas) {
      for (const r of reservas) {
        const start = parseInt(r.hora_inicio);
        const end = parseInt(r.hora_fin);
        for (let h = start; h < end; h++) {
          result[`${h.toString().padStart(2, "0")}:00`] = false;
        }
      }
    }

    // Aplicar slots explícitos de court_availability (bloques manuales del owner)
    const { data: slots } = await supabase
      .from("court_availability")
      .select("hora_inicio, disponible")
      .eq("court_id", courtRealId)
      .eq("fecha", fecha) as { data: { hora_inicio: string; disponible: boolean }[] | null };

    if (slots) {
      for (const slot of slots) {
        const h = parseInt(slot.hora_inicio);
        if (h >= 6 && h <= 23) {
          result[`${h.toString().padStart(2, "0")}:00`] = slot.disponible;
        }
      }
    }
  } catch {
    // Si hay error de red, devuelve todo disponible
  }
  return result;
}

const MAX_DURACION = 6;
const MIN_DURACION = 1;

export default function AvailabilityWidget({
  complejo,
  complexId,
  canchas,
}: AvailabilityWidgetProps) {
  const { user, isAuthenticated } = useAuth();
  const proximosDias = useMemo(() => obtenerProximosDiasDisponibles(), []);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(proximosDias[0]);
  const [canchaSeleccionada, setCanchaSeleccionada] = useState<number>(
    canchas[0]?.id || 1
  );
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);
  const [duracion, setDuracion] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reservaSent, setReservaSent] = useState(false);
  const [savingReserva, setSavingReserva] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // Disponibilidad real desde DB
  const [disponibilidad, setDisponibilidad] = useState<Record<string, boolean>>(disponibilidadDefault());
  const [loadingSlots, setLoadingSlots] = useState(false);

  const cancha = canchas.find((c) => c.id === canchaSeleccionada);

  const cargarDisponibilidad = useCallback(async () => {
    if (!cancha?.realId) return;
    setLoadingSlots(true);
    setHoraSeleccionada(null);
    setDuracion(1);
    const data = await fetchDisponibilidadReal(cancha.realId, fechaSeleccionada);
    setDisponibilidad(data);
    setLoadingSlots(false);
  }, [cancha?.realId, fechaSeleccionada]);

  useEffect(() => {
    cargarDisponibilidad();
  }, [cargarDisponibilidad]);

  const canchaNombre = cancha?.nombre || "";
  const fechaFormato = new Date(fechaSeleccionada + "T00:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const precioTotal = cancha ? cancha.precio * duracion : 0;
  const horaFin = horaSeleccionada ? sumarHoras(horaSeleccionada, duracion) : null;

  const horasEnRangoActual: string[] = horaSeleccionada
    ? horasEnRango(horaSeleccionada, duracion)
    : [];

  const rangoValido = horaSeleccionada
    ? horasLibres(horaSeleccionada, duracion, disponibilidad)
    : false;

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

  // Guarda la reserva como pendiente en DB (solo si logueado)
  async function handleConfirmarEnvio() {
    setSavingReserva(true);
    setSaveError(false);
    if (isAuthenticated && user && cancha && horaSeleccionada && horaFin) {
      const { error } = await supabaseMut.from("reservations").insert({
        court_id: cancha.realId,
        complex_id: complexId,
        user_id: user.id,
        fecha: fechaSeleccionada,
        hora_inicio: horaSeleccionada,
        hora_fin: horaFin,
        precio_total: precioTotal,
        estado: "pendiente",
        confirmada_por_propietario: false,
        whatsapp_link: generarLinkWhatsApp(),
        notas_usuario: `Solicitud vía web — ${fechaFormato}, ${horaSeleccionada}–${horaFin} (${duracion}h)`,
      });
      if (error) {
        setSavingReserva(false);
        setSaveError(true);
        return;
      }
      // Refrescar disponibilidad para reflejar el slot recién ocupado
      await cargarDisponibilidad();
      // Email al dueño (fire-and-forget, no bloquea si falla)
      fetch("/api/notify/new-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complex_id: complexId,
          jugador_nombre: (user.user_metadata?.nombre_completo as string) || user.email?.split("@")[0] || "Jugador",
          jugador_email: user.email || "",
          cancha_nombre: canchaNombre,
          fecha: fechaSeleccionada,
          hora_inicio: horaSeleccionada,
          hora_fin: horaFin,
          precio_total: precioTotal,
        }),
      }).catch(() => { /* silencioso */ });
    }
    setSavingReserva(false);
    setShowConfirmModal(false);
    setReservaSent(true);
  }

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
          loading={loadingSlots}
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
              <span className="text-2xl font-black text-rodeo-lime">{duracion}</span>
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

          <div className="flex gap-1">
            {Array.from({ length: MAX_DURACION }, (_, i) => i + 1).map((slot) => {
              const isFilled = slot <= duracion;
              const isReachable =
                horasLibres(horaSeleccionada, slot, disponibilidad) &&
                parseInt(sumarHoras(horaSeleccionada, slot).split(":")[0]) <= 24;
              return (
                <button
                  key={slot}
                  onClick={() => { if (isReachable) setDuracion(slot); }}
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
              <p className="text-xs text-rodeo-cream/50 text-center">
                {isAuthenticated
                  ? "Tu reserva quedó registrada como pendiente. El dueño la confirmará pronto."
                  : "El dueño te confirmará la disponibilidad por WhatsApp."}
              </p>
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
                    Se abrió WhatsApp con tu solicitud para{" "}
                    <span className="text-rodeo-lime font-bold">{canchaNombre}</span>.
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

              {saveError && (
                <div
                  style={{ background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.25)", borderRadius: "12px" }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="text-red-400 text-sm">⚠</span>
                  <p className="text-xs text-red-300/80 leading-relaxed">
                    No se pudo registrar tu reserva. Tu mensaje de WhatsApp sí fue enviado — el dueño la confirmará igual.
                  </p>
                </div>
              )}

              {!isAuthenticated && !saveError && (
                <div
                  style={{ background: "rgba(200,255,0,0.06)", border: "1px solid rgba(200,255,0,0.2)", borderRadius: "12px" }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <LogIn size={16} className="text-rodeo-lime shrink-0" />
                  <p className="text-xs text-rodeo-cream/60 leading-relaxed">
                    <a href="/login" className="text-rodeo-lime font-bold hover:underline">Iniciá sesión</a>{" "}
                    para que tu reserva quede registrada y el dueño la confirme en el panel.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowConfirmModal(false); setSaveError(false); }}
                  className="flex-1 py-3 rounded-[14px] text-sm font-bold text-rodeo-cream/60 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <X size={14} className="inline mr-1.5" />
                  No pude
                </button>
                <button
                  onClick={handleConfirmarEnvio}
                  disabled={savingReserva}
                  className="flex-1 py-3 rounded-[14px] text-sm font-black text-rodeo-dark transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                  style={{ background: "rgba(200,255,0,0.95)" }}
                >
                  {savingReserva ? (
                    <div className="w-4 h-4 border-2 border-rodeo-dark/30 border-t-rodeo-dark rounded-full animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
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
