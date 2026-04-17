"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageCircle,
  User,
  Phone,
  DollarSign,
  Calendar,
  Plus,
  Trash2,
  Building2,
} from "lucide-react";
import { supabase, supabaseMut } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Reservation, EstadoReserva } from "@/types/database";

// ─── Extended type with joins ─────────────────────────────────────────────────

interface ReservationWithDetails extends Reservation {
  court: { nombre: string; deporte: string } | null;
  jugador: {
    nombre_completo: string | null;
    email: string;
    telefono: string | null;
  } | null;
}

interface CourtOption {
  id: string;
  nombre: string;
  deporte: string;
  precio_por_hora: number;
  complex_id: string;
}

// ─── NewReservationModal ──────────────────────────────────────────────────────

const HORA_OPTIONS: string[] = [];
for (let h = 7; h <= 23; h++) {
  HORA_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 23) HORA_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

interface NewReservationModalProps {
  courts: CourtOption[];
  userId: string;
  onClose: () => void;
  onSaved: (r: ReservationWithDetails) => void;
}

function NewReservationModal({ courts, userId, onClose, onSaved }: NewReservationModalProps) {
  const [courtId, setCourtId] = useState(courts[0]?.id ?? "");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFin, setHoraFin] = useState("09:00");
  const [jugadorNombre, setJugadorNombre] = useState("");
  const [jugadorTelefono, setJugadorTelefono] = useState("");
  const [precioTotal, setPrecioTotal] = useState<number>(0);
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedCourt = courts.find((c) => c.id === courtId) ?? null;

  useEffect(() => {
    if (selectedCourt) {
      setPrecioTotal(selectedCourt.precio_por_hora);
    }
  }, [courtId]);

  async function handleSave() {
    if (!courtId || !fecha || !horaInicio || !horaFin || !jugadorNombre.trim()) {
      setSaveError("Completá cancha, fecha, horario y nombre del jugador.");
      return;
    }
    setSaving(true);
    setSaveError(null);

    const notasComposed = [
      "Reserva manual",
      jugadorNombre.trim(),
      jugadorTelefono.trim() ? `Tel: ${jugadorTelefono.trim()}` : null,
      notas.trim() || null,
    ]
      .filter(Boolean)
      .join(" · ");

    const { data, error } = await supabaseMut
      .from("reservations")
      .insert({
        court_id: courtId,
        complex_id: selectedCourt!.complex_id,
        user_id: userId,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        precio_total: precioTotal,
        estado: "confirmada",
        confirmada_por_propietario: true,
        notas_usuario: notasComposed,
      })
      .select(`*, court:courts(nombre, deporte), jugador:profiles!user_id(nombre_completo, email, telefono)`)
      .single();

    if (error) {
      setSaveError(error.message);
      setSaving(false);
      return;
    }

    onSaved(data as unknown as ReservationWithDetails);
    onClose();
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px",
    color: "#E1D4C2",
    outline: "none",
  } as React.CSSProperties;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        style={{
          background: "linear-gradient(145deg, rgba(41,28,14,0.97) 0%, rgba(26,18,11,0.99) 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "480px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        className="p-6 space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Building2 size={18} className="text-rodeo-lime" />
            Nueva reserva manual
          </h2>
          <button
            onClick={onClose}
            className="text-rodeo-cream/40 hover:text-white transition-colors text-xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Cancha */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">
            Cancha
          </label>
          <select
            value={courtId}
            onChange={(e) => setCourtId(e.target.value)}
            style={inputStyle}
            className="w-full px-3 py-2.5 text-sm"
          >
            {courts.map((c) => (
              <option key={c.id} value={c.id} style={{ background: "#291C0E" }}>
                {c.nombre} — {c.deporte}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">
            Fecha
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={inputStyle}
            className="w-full px-3 py-2.5 text-sm"
          />
        </div>

        {/* Horario */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">
              Hora inicio
            </label>
            <select
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              style={inputStyle}
              className="w-full px-3 py-2.5 text-sm"
            >
              {HORA_OPTIONS.map((h) => (
                <option key={h} value={h} style={{ background: "#291C0E" }}>{h}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">
              Hora fin
            </label>
            <select
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              style={inputStyle}
              className="w-full px-3 py-2.5 text-sm"
            >
              {HORA_OPTIONS.map((h) => (
                <option key={h} value={h} style={{ background: "#291C0E" }}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Jugador nombre */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">
            Nombre del jugador *
          </label>
          <input
            type="text"
            placeholder="Ej: Juan García"
            value={jugadorNombre}
            onChange={(e) => setJugadorNombre(e.target.value)}
            style={inputStyle}
            className="w-full px-3 py-2.5 text-sm placeholder:text-rodeo-cream/25"
          />
        </div>

        {/* Jugador telefono */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">
            Teléfono (opcional)
          </label>
          <input
            type="tel"
            placeholder="Ej: 3834123456"
            value={jugadorTelefono}
            onChange={(e) => setJugadorTelefono(e.target.value)}
            style={inputStyle}
            className="w-full px-3 py-2.5 text-sm placeholder:text-rodeo-cream/25"
          />
        </div>

        {/* Precio */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">
            Precio total (ARS)
          </label>
          <input
            type="number"
            min={0}
            value={precioTotal}
            onChange={(e) => setPrecioTotal(Number(e.target.value))}
            style={inputStyle}
            className="w-full px-3 py-2.5 text-sm"
          />
        </div>

        {/* Notas */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">
            Notas (opcional)
          </label>
          <textarea
            rows={2}
            placeholder="Observaciones, equipamiento, etc."
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            style={{ ...inputStyle, resize: "none" }}
            className="w-full px-3 py-2.5 text-sm placeholder:text-rodeo-cream/25"
          />
        </div>

        {saveError && (
          <p className="text-xs text-red-400 font-bold">{saveError}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
            }}
            className="flex-1 py-3 text-sm font-bold text-rodeo-cream/60 hover:text-white transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? "rgba(200,255,0,0.5)" : "rgba(200,255,0,0.9)",
              borderRadius: "12px",
            }}
            className="flex-1 py-3 text-sm font-black text-rodeo-dark hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-rodeo-dark/30 border-t-rodeo-dark rounded-full animate-spin" />
            ) : (
              <Plus size={15} />
            )}
            Guardar reserva
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<
  EstadoReserva,
  { label: string; color: string; bg: string; border: string; barColor: string }
> = {
  pendiente: {
    label: "Pendiente",
    color: "#FFB300",
    bg: "rgba(255,179,0,0.12)",
    border: "rgba(255,179,0,0.3)",
    barColor: "#FFB300",
  },
  confirmada: {
    label: "Confirmada",
    color: "#00E676",
    bg: "rgba(0,230,118,0.12)",
    border: "rgba(0,230,118,0.3)",
    barColor: "#00E676",
  },
  cancelada: {
    label: "Cancelada",
    color: "#FF4040",
    bg: "rgba(255,64,64,0.12)",
    border: "rgba(255,64,64,0.3)",
    barColor: "#FF4040",
  },
  completada: {
    label: "Completada",
    color: "#40C4FF",
    bg: "rgba(64,196,255,0.12)",
    border: "rgba(64,196,255,0.3)",
    barColor: "#40C4FF",
  },
};

type DateFilter = "hoy" | "semana" | "mes";
type StatusFilter = "todas" | EstadoReserva;

const DEPORTE_LABELS: Record<string, string> = {
  futbol: "Fútbol",
  padel: "Pádel",
  tenis: "Tenis",
  voley: "Vóley",
  basquet: "Básquet",
  hockey: "Hockey",
  squash: "Squash",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoney(n: number): string {
  return n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function getWeekStartISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
}

function getMonthStartISO(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function buildWhatsAppLink(
  phone: string,
  jugador: string,
  fecha: string,
  horaInicio: string,
  cancha: string
): string {
  const clean = phone.replace(/\D/g, "");
  const text = encodeURIComponent(
    `Hola ${jugador}, tu reserva de ${cancha} el ${fecha} a las ${horaInicio} está confirmada. ¡Nos vemos! 👋`
  );
  return `https://wa.me/549${clean}?text=${text}`;
}

// ─── DeleteButton (double-click confirmation) ─────────────────────────────────

function DeleteButton({
  busy,
  disabled,
  onDelete,
}: {
  busy: boolean;
  disabled: boolean;
  onDelete: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);

  function handleClick() {
    if (!confirmed) {
      setConfirmed(true);
      setTimeout(() => setConfirmed(false), 3000);
    } else {
      onDelete();
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={{
        background: confirmed ? "rgba(255,64,64,0.25)" : "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,64,64,0.35)",
        borderRadius: "10px",
        transition: "all 0.2s ease",
      }}
      className="flex items-center gap-2 px-4 py-2.5 text-xs font-black text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {busy ? (
        <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
      ) : (
        <Trash2 size={14} />
      )}
      {confirmed ? "¿Confirmar eliminación?" : "Eliminar"}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReservasPage() {
  const { user, loading: authLoading } = useAuth();

  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [courts, setCourts] = useState<CourtOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");
  const [dateFilter, setDateFilter] = useState<DateFilter>("mes");

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    async function fetchReservations() {
      setLoading(true);
      setError(null);

      try {
        // 1) Fetch owner complexes
        const { data: complejos, error: complejosError } = await supabase
          .from("complexes")
          .select("id, nombre")
          .eq("owner_id", user!.id);

        if (complejosError) throw complejosError;

        const complexIds = ((complejos as any[]) ?? []).map((c) => c.id);

        if (complexIds.length === 0) {
          setReservations([]);
          return;
        }

        // 2) Fetch courts for new-reservation modal
        const { data: courtsData } = await supabase
          .from("courts")
          .select("id, nombre, deporte, precio_por_hora, complex_id")
          .in("complex_id", complexIds)
          .eq("activa", true);
        setCourts((courtsData as any) ?? []);

        // 3) Fetch reservations with joins
        const { data, error: resError } = await supabase
          .from("reservations")
          .select(
            `
            *,
            court:courts(nombre, deporte),
            jugador:profiles!user_id(nombre_completo, email, telefono)
          `
          )
          .in("complex_id", complexIds)
          .order("fecha", { ascending: false })
          .order("hora_inicio", { ascending: false })
          .limit(100);

        if (resError) throw resError;

        setReservations((data as any) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar reservas");
      } finally {
        setLoading(false);
      }
    }

    fetchReservations();
  }, [user?.id, authLoading]);

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleConfirm(id: string) {
    setActionLoading(id + "_confirm");
    const { error } = await supabaseMut
      .from("reservations")
      .update({ estado: "confirmada", confirmada_por_propietario: true })
      .eq("id", id);

    if (!error) {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, estado: "confirmada" as EstadoReserva, confirmada_por_propietario: true }
            : r
        )
      );
    }
    setActionLoading(null);
  }

  async function handleCancel(id: string) {
    setActionLoading(id + "_cancel");
    const { error } = await supabaseMut
      .from("reservations")
      .update({ estado: "cancelada" })
      .eq("id", id);

    if (!error) {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, estado: "cancelada" as EstadoReserva } : r
        )
      );
    }
    setActionLoading(null);
  }

  async function handleComplete(id: string) {
    setActionLoading(id + "_complete");
    const { error } = await supabaseMut
      .from("reservations")
      .update({ estado: "completada" })
      .eq("id", id);
    if (!error) {
      setReservations((prev) =>
        prev.map((r) => r.id === id ? { ...r, estado: "completada" as EstadoReserva } : r)
      );
    }
    setActionLoading(null);
  }

  async function handleDelete(id: string) {
    setActionLoading(id + "_delete");
    const { error } = await supabaseMut.from("reservations").delete().eq("id", id);
    if (!error) {
      setReservations((prev) => prev.filter((r) => r.id !== id));
    }
    setActionLoading(null);
  }

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = reservations;

    // Date filter
    const today = getTodayISO();
    if (dateFilter === "hoy") {
      list = list.filter((r) => r.fecha === today);
    } else if (dateFilter === "semana") {
      const weekStart = getWeekStartISO();
      list = list.filter((r) => r.fecha >= weekStart && r.fecha <= today);
    } else {
      const monthStart = getMonthStartISO();
      list = list.filter((r) => r.fecha >= monthStart && r.fecha <= today);
    }

    // Status filter
    if (statusFilter !== "todas") {
      list = list.filter((r) => r.estado === statusFilter);
    }

    return list;
  }, [reservations, dateFilter, statusFilter]);

  // ── Stats (from date-filtered, not status-filtered) ───────────────────────

  const dateFiltered = useMemo(() => {
    let list = reservations;
    const today = getTodayISO();
    if (dateFilter === "hoy") {
      list = list.filter((r) => r.fecha === today);
    } else if (dateFilter === "semana") {
      const weekStart = getWeekStartISO();
      list = list.filter((r) => r.fecha >= weekStart && r.fecha <= today);
    } else {
      const monthStart = getMonthStartISO();
      list = list.filter((r) => r.fecha >= monthStart && r.fecha <= today);
    }
    return list;
  }, [reservations, dateFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      todas: dateFiltered.length,
      pendiente: 0,
      confirmada: 0,
      cancelada: 0,
      completada: 0,
    };
    dateFiltered.forEach((r) => {
      counts[r.estado]++;
    });
    return counts;
  }, [dateFiltered]);

  const ingresosHoy = useMemo(() => {
    const today = getTodayISO();
    return reservations
      .filter(
        (r) =>
          r.fecha === today &&
          (r.estado === "confirmada" || r.estado === "completada")
      )
      .reduce((sum, r) => sum + r.precio_total, 0);
  }, [reservations]);

  // ── Loading state ──────────────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-rodeo-lime/30 border-t-rodeo-lime rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle size={40} className="text-red-400/60" />
        <p className="text-rodeo-cream/60 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: "rgba(200,255,0,0.15)",
            border: "1px solid rgba(200,255,0,0.3)",
            borderRadius: "12px",
          }}
          className="px-5 py-2.5 text-rodeo-lime text-sm font-bold hover:bg-rodeo-lime/25 transition-all"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const today = getTodayISO();
  const todayFormatted = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-8 max-w-4xl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div className="space-y-1">
          <p className="text-xs text-rodeo-cream/50 font-bold tracking-widest uppercase">
            Panel de Control
          </p>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            Reservas
            {statusCounts.pendiente > 0 && (
              <span
                style={{
                  background: "rgba(255,179,0,0.2)",
                  border: "1px solid rgba(255,179,0,0.4)",
                  borderRadius: "999px",
                }}
                className="text-sm font-black text-amber-400 px-2.5 py-0.5"
              >
                {statusCounts.pendiente} pendiente{statusCounts.pendiente > 1 ? "s" : ""}
              </span>
            )}
          </h1>
          <p className="text-sm text-rodeo-cream/50 capitalize">{todayFormatted}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewModal(true)}
            style={{
              background: "rgba(200,255,0,0.9)",
              borderRadius: "12px",
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-black text-rodeo-dark hover:opacity-90 transition-all"
          >
            <Plus size={16} />
            Nueva reserva
          </button>
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "14px",
            }}
            className="flex items-center gap-2.5 px-4 py-3"
          >
            <ClipboardList size={16} className="text-rodeo-lime/70" />
            <div className="text-right">
              <p className="text-[10px] text-rodeo-cream/40 uppercase tracking-widest font-bold">
                Total
              </p>
              <p className="text-lg font-black text-white leading-none">
                {dateFiltered.length}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stats Strip ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          {
            label: "Pendientes",
            value: statusCounts.pendiente,
            color: "#FFB300",
            bg: "rgba(255,179,0,0.08)",
            icon: Clock,
          },
          {
            label: "Confirmadas",
            value: statusCounts.confirmada,
            color: "#00E676",
            bg: "rgba(0,230,118,0.08)",
            icon: CheckCircle2,
          },
          {
            label: "Completadas",
            value: statusCounts.completada,
            color: "#40C4FF",
            bg: "rgba(64,196,255,0.08)",
            icon: ClipboardList,
          },
          {
            label: "Ingresos hoy",
            value: formatMoney(ingresosHoy),
            color: "#C8FF00",
            bg: "rgba(200,255,0,0.08)",
            icon: DollarSign,
            isText: true,
          },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: card.bg,
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "16px",
            }}
            className="p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={14} style={{ color: card.color }} />
              <p className="text-[10px] font-bold text-rodeo-cream/40 uppercase tracking-widest">
                {card.label}
              </p>
            </div>
            <p
              className="text-xl font-black leading-none"
              style={{ color: card.color }}
            >
              {card.isText ? card.value : String(card.value)}
            </p>
          </div>
        ))}
      </motion.div>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        {/* Date filter */}
        <div className="flex gap-2">
          {(
            [
              { key: "hoy", label: "Hoy" },
              { key: "semana", label: "Esta semana" },
              { key: "mes", label: "Este mes" },
            ] as { key: DateFilter; label: string }[]
          ).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setDateFilter(opt.key)}
              style={
                dateFilter === opt.key
                  ? {
                      background: "rgba(200,255,0,0.9)",
                      borderRadius: "999px",
                    }
                  : {
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "999px",
                    }
              }
              className={`px-4 py-1.5 text-xs font-bold transition-all ${
                dateFilter === opt.key
                  ? "text-rodeo-dark"
                  : "text-rodeo-cream/60 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Status tabs — horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              { key: "todas", label: "Todas" },
              { key: "pendiente", label: "Pendientes" },
              { key: "confirmada", label: "Confirmadas" },
              { key: "cancelada", label: "Canceladas" },
              { key: "completada", label: "Completadas" },
            ] as { key: StatusFilter; label: string }[]
          ).map((tab) => {
            const count = statusCounts[tab.key];
            const isActive = statusFilter === tab.key;
            const meta =
              tab.key !== "todas" ? STATUS_META[tab.key as EstadoReserva] : null;

            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all shrink-0"
                style={
                  isActive
                    ? meta
                      ? {
                          color: meta.color,
                          background: meta.bg,
                          border: `1px solid ${meta.border}`,
                          borderRadius: "10px",
                        }
                      : {
                          color: "#C8FF00",
                          background: "rgba(200,255,0,0.12)",
                          border: "1px solid rgba(200,255,0,0.25)",
                          borderRadius: "10px",
                        }
                    : {
                        color: "rgba(225,212,194,0.5)",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "10px",
                      }
                }
              >
                {tab.label}
                <span
                  style={
                    isActive && meta
                      ? { background: meta.bg, color: meta.color, borderRadius: "999px" }
                      : {
                          background: "rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.4)",
                          borderRadius: "999px",
                        }
                  }
                  className="px-1.5 py-0.5 text-[10px] font-black"
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Reservations List ──────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "16px",
            }}
            className="p-12 text-center"
          >
            <ClipboardList size={36} className="text-rodeo-cream/15 mx-auto mb-3" />
            <p className="text-rodeo-cream/40 text-sm font-bold">
              {statusFilter === "todas"
                ? "No hay reservas en este período"
                : `No hay reservas ${STATUS_META[statusFilter as EstadoReserva]?.label.toLowerCase() ?? ""}`}
            </p>
            <p className="text-rodeo-cream/25 text-xs mt-1">
              Probá cambiar el filtro de fecha o estado
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <AnimatePresence initial={false}>
              {filtered.map((r, i) => {
                const meta = STATUS_META[r.estado];
                const jugadorNombre =
                  r.jugador?.nombre_completo || r.jugador?.email || "Jugador";
                const canchaLabel = r.court?.nombre ?? "Cancha eliminada";
                const deporteLabel = r.court?.deporte
                  ? DEPORTE_LABELS[r.court.deporte] ?? r.court.deporte
                  : null;
                const isToday = r.fecha === today;

                const confirmBusy = actionLoading === r.id + "_confirm";
                const cancelBusy = actionLoading === r.id + "_cancel";
                const completeBusy = actionLoading === r.id + "_complete";
                const deleteBusy = actionLoading === r.id + "_delete";

                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                    transition={{ delay: i * 0.02 }}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "16px",
                      overflow: "hidden",
                    }}
                    className="flex"
                  >
                    {/* Colored status bar */}
                    <div
                      style={{
                        width: "4px",
                        background: meta.barColor,
                        borderRadius: "16px 0 0 16px",
                        flexShrink: 0,
                      }}
                    />

                    <div className="flex-1 p-4 md:p-5 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        {/* Left: court + date + player */}
                        <div className="space-y-1.5 min-w-0">
                          {/* Court name + sport badge */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-white text-base leading-none">
                              {canchaLabel}
                            </p>
                            {deporteLabel && (
                              <span
                                style={{
                                  background: "rgba(200,255,0,0.1)",
                                  border: "1px solid rgba(200,255,0,0.2)",
                                  borderRadius: "999px",
                                }}
                                className="text-[10px] font-bold text-rodeo-lime px-2 py-0.5 uppercase tracking-wide"
                              >
                                {deporteLabel}
                              </span>
                            )}
                            {isToday && (
                              <span
                                style={{
                                  background: "rgba(255,179,0,0.1)",
                                  border: "1px solid rgba(255,179,0,0.25)",
                                  borderRadius: "999px",
                                }}
                                className="text-[10px] font-bold text-amber-400 px-2 py-0.5"
                              >
                                Hoy
                              </span>
                            )}
                          </div>

                          {/* Date + time */}
                          <div className="flex items-center gap-2 text-rodeo-cream/60">
                            <Calendar size={12} />
                            <span className="text-xs font-bold capitalize">
                              {formatDate(r.fecha)}
                            </span>
                            <Clock size={12} className="ml-1" />
                            <span className="text-xs font-bold">
                              {r.hora_inicio} – {r.hora_fin}
                            </span>
                          </div>

                          {/* Player */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 text-rodeo-cream/60">
                              <User size={12} />
                              <span className="text-xs font-bold text-rodeo-cream/80">
                                {jugadorNombre}
                              </span>
                            </div>
                            {r.jugador?.telefono && (
                              <div className="flex items-center gap-1 text-rodeo-cream/40">
                                <Phone size={11} />
                                <span className="text-xs">{r.jugador.telefono}</span>
                              </div>
                            )}
                          </div>

                          {/* Notes */}
                          {r.notas_usuario && (
                            <p className="text-xs text-rodeo-cream/40 italic truncate max-w-xs">
                              &ldquo;{r.notas_usuario}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Right: price + status + actions */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {/* Price */}
                          <p className="text-xl font-black text-white leading-none">
                            {formatMoney(r.precio_total)}
                          </p>

                          {/* Status pill */}
                          <span
                            style={{
                              background: meta.bg,
                              border: `1px solid ${meta.border}`,
                              borderRadius: "999px",
                              color: meta.color,
                            }}
                            className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1"
                          >
                            {meta.label}
                          </span>

                          {/* WhatsApp */}
                          {r.jugador?.telefono && (
                            <a
                              href={buildWhatsAppLink(
                                r.jugador.telefono,
                                jugadorNombre,
                                formatDate(r.fecha),
                                r.hora_inicio,
                                canchaLabel
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                background: "rgba(37,211,102,0.12)",
                                border: "1px solid rgba(37,211,102,0.25)",
                                borderRadius: "8px",
                              }}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-green-400 hover:bg-green-500/20 transition-all"
                            >
                              <MessageCircle size={12} />
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Confirm / Cancel actions for pending */}
                      {r.estado === "pendiente" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="flex gap-2 mt-4 pt-4"
                          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <button
                            onClick={() => handleConfirm(r.id)}
                            disabled={!!actionLoading}
                            style={{
                              background: confirmBusy
                                ? "rgba(0,230,118,0.1)"
                                : "rgba(0,230,118,0.15)",
                              border: "1px solid rgba(0,230,118,0.3)",
                              borderRadius: "10px",
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-black text-green-400 hover:bg-green-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {confirmBusy ? (
                              <div className="w-3.5 h-3.5 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}
                            Confirmar
                          </button>

                          <button
                            onClick={() => handleCancel(r.id)}
                            disabled={!!actionLoading}
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,64,64,0.25)",
                              borderRadius: "10px",
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-black text-red-400 hover:bg-red-500/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancelBusy ? (
                              <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                            ) : (
                              <XCircle size={14} />
                            )}
                            Cancelar
                          </button>
                        </motion.div>
                      )}

                      {/* Complete / Cancel actions for confirmada */}
                      {r.estado === "confirmada" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="flex gap-2 mt-4 pt-4"
                          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <button
                            onClick={() => handleComplete(r.id)}
                            disabled={!!actionLoading}
                            style={{
                              background: completeBusy
                                ? "rgba(64,196,255,0.1)"
                                : "rgba(64,196,255,0.15)",
                              border: "1px solid rgba(64,196,255,0.3)",
                              borderRadius: "10px",
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-black text-sky-400 hover:bg-sky-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {completeBusy ? (
                              <div className="w-3.5 h-3.5 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}
                            Completar
                          </button>

                          <button
                            onClick={() => handleCancel(r.id)}
                            disabled={!!actionLoading}
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,64,64,0.25)",
                              borderRadius: "10px",
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-black text-red-400 hover:bg-red-500/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancelBusy ? (
                              <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                            ) : (
                              <XCircle size={14} />
                            )}
                            Cancelar
                          </button>
                        </motion.div>
                      )}

                      {/* Delete action for cancelada */}
                      {r.estado === "cancelada" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="flex gap-2 mt-4 pt-4"
                          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <DeleteButton
                            busy={deleteBusy}
                            disabled={!!actionLoading}
                            onDelete={() => handleDelete(r.id)}
                          />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── New Reservation Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showNewModal && courts.length > 0 && user && (
          <NewReservationModal
            courts={courts}
            userId={user.id}
            onClose={() => setShowNewModal(false)}
            onSaved={(r) => {
              setReservations((prev) => [r, ...prev]);
              setShowNewModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
