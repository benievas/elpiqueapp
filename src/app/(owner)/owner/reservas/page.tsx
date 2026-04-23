"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Clock, CheckCircle2, XCircle, AlertCircle,
  MessageCircle, User, Phone, DollarSign, Calendar, Plus, Trash2,
  Building2, ChevronLeft, ChevronRight, List as ListIcon, LayoutGrid,
} from "lucide-react";
import { supabase, supabaseMut } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";
import { useActiveComplex } from "@/lib/context/ActiveComplexContext";
import type { Reservation, EstadoReserva } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReservationWithDetails extends Reservation {
  court: { nombre: string; deporte: string } | null;
  jugador: { nombre_completo: string | null; email: string; telefono: string | null } | null;
}

interface CourtOption {
  id: string;
  nombre: string;
  deporte: string;
  precio_por_hora: number;
  complex_id: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HORA_OPTIONS: string[] = [];
for (let h = 7; h <= 23; h++) {
  HORA_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 23) HORA_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

const HORAS_AGENDA = Array.from({ length: 17 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`); // 07–23

const STATUS_META: Record<EstadoReserva, { label: string; color: string; bg: string; border: string }> = {
  pendiente:  { label: "Pendiente",  color: "#FFB300", bg: "rgba(255,179,0,0.15)",  border: "rgba(255,179,0,0.4)" },
  confirmada: { label: "Confirmada", color: "#00E676", bg: "rgba(0,230,118,0.15)",  border: "rgba(0,230,118,0.4)" },
  cancelada:  { label: "Cancelada",  color: "#FF4040", bg: "rgba(255,64,64,0.12)",  border: "rgba(255,64,64,0.3)" },
  completada: { label: "Completada", color: "#40C4FF", bg: "rgba(64,196,255,0.12)", border: "rgba(64,196,255,0.3)" },
};

const DEPORTE_LABELS: Record<string, string> = {
  futbol: "Fútbol", padel: "Pádel", tenis: "Tenis",
  voley: "Vóley", basquet: "Básquet", hockey: "Hockey", squash: "Squash",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayISO() { return new Date().toISOString().slice(0, 10); }

function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatMoney(n: number) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function formatDateLong(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function buildWhatsAppLink(phone: string, jugador: string, fecha: string, hora: string, cancha: string) {
  const clean = phone.replace(/\D/g, "");
  const text = encodeURIComponent(`Hola ${jugador}, tu reserva de ${cancha} el ${fecha} a las ${hora} está confirmada. ¡Nos vemos! 👋`);
  return `https://wa.me/549${clean}?text=${text}`;
}

// ─── NewReservationModal ──────────────────────────────────────────────────────

interface ModalProps {
  courts: CourtOption[];
  userId: string;
  defaultCourtId?: string;
  defaultFecha?: string;
  defaultHora?: string;
  onClose: () => void;
  onSaved: (r: ReservationWithDetails) => void;
}

function NewReservationModal({ courts, userId, defaultCourtId, defaultFecha, defaultHora, onClose, onSaved }: ModalProps) {
  const [courtId, setCourtId] = useState(defaultCourtId || courts[0]?.id || "");
  const [fecha, setFecha] = useState(defaultFecha || getTodayISO());
  const [horaInicio, setHoraInicio] = useState(defaultHora || "08:00");
  const [horaFin, setHoraFin] = useState(() => {
    if (defaultHora) {
      const h = parseInt(defaultHora.split(":")[0]);
      return `${String(h + 1).padStart(2, "0")}:00`;
    }
    return "09:00";
  });
  const [jugadorNombre, setJugadorNombre] = useState("");
  const [jugadorTelefono, setJugadorTelefono] = useState("");
  const [precioTotal, setPrecioTotal] = useState(0);
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedCourt = courts.find((c) => c.id === courtId) ?? null;

  useEffect(() => {
    if (!selectedCourt) return;
    const [h1, m1] = horaInicio.split(":").map(Number);
    const [h2, m2] = horaFin.split(":").map(Number);
    const dur = ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
    setPrecioTotal(Math.round(selectedCourt.precio_por_hora * (dur > 0 ? dur : 1)));
  }, [courtId, horaInicio, horaFin, selectedCourt]);

  async function handleSave() {
    if (!courtId || !fecha || !horaInicio || !horaFin || !jugadorNombre.trim()) {
      setSaveError("Completá cancha, fecha, horario y nombre del jugador."); return;
    }
    setSaving(true); setSaveError(null);
    const notasComposed = ["Reserva manual", jugadorNombre.trim(),
      jugadorTelefono.trim() ? `Tel: ${jugadorTelefono.trim()}` : null,
      notas.trim() || null].filter(Boolean).join(" · ");

    const { data, error } = await supabaseMut.from("reservations").insert({
      court_id: courtId, complex_id: selectedCourt!.complex_id, user_id: userId,
      fecha, hora_inicio: horaInicio, hora_fin: horaFin,
      precio_total: precioTotal, estado: "confirmada",
      confirmada_por_propietario: true, notas_usuario: notasComposed,
    }).select(`*, court:courts(nombre, deporte), jugador:profiles!user_id(nombre_completo, email, telefono)`).single();

    if (error) { setSaveError(error.message); setSaving(false); return; }
    onSaved(data as unknown as ReservationWithDetails);
    onClose();
  }

  const input = {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px", color: "#E1D4C2", outline: "none",
  } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        style={{ background: "linear-gradient(145deg,rgba(41,28,14,0.97),rgba(26,18,11,0.99))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }}
        className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white uppercase flex items-center gap-2">
            <Building2 size={18} className="text-rodeo-lime" /> Nueva reserva manual
          </h2>
          <button onClick={onClose} className="text-rodeo-cream/40 hover:text-white transition-colors text-xl font-bold">×</button>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Cancha</label>
          <select value={courtId} onChange={(e) => setCourtId(e.target.value)} style={input} className="w-full px-3 py-2.5 text-sm">
            {courts.map((c) => <option key={c.id} value={c.id} style={{ background: "#291C0E" }}>{c.nombre} — {c.deporte}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={input} className="w-full px-3 py-2.5 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[["Hora inicio", horaInicio, setHoraInicio], ["Hora fin", horaFin, setHoraFin]].map(([lbl, val, set]) => (
            <div key={lbl as string} className="space-y-1.5">
              <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">{lbl as string}</label>
              <select value={val as string} onChange={(e) => (set as any)(e.target.value)} style={input} className="w-full px-3 py-2.5 text-sm">
                {HORA_OPTIONS.map((h) => <option key={h} value={h} style={{ background: "#291C0E" }}>{h}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Nombre del jugador *</label>
          <input type="text" placeholder="Ej: Juan García" value={jugadorNombre} onChange={(e) => setJugadorNombre(e.target.value)} style={input} className="w-full px-3 py-2.5 text-sm placeholder:text-rodeo-cream/25" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Teléfono (opcional)</label>
          <input type="tel" placeholder="Ej: 3834123456" value={jugadorTelefono} onChange={(e) => setJugadorTelefono(e.target.value)} style={input} className="w-full px-3 py-2.5 text-sm placeholder:text-rodeo-cream/25" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Precio total (ARS)</label>
          <input type="number" min={0} value={precioTotal} onChange={(e) => setPrecioTotal(Number(e.target.value))} style={input} className="w-full px-3 py-2.5 text-sm" />
          {selectedCourt && (() => {
            const [h1, m1] = horaInicio.split(":").map(Number);
            const [h2, m2] = horaFin.split(":").map(Number);
            const dur = ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
            return dur > 0 ? <p className="text-[11px] text-rodeo-cream/35">${selectedCourt.precio_por_hora.toLocaleString()}/h × {dur}h — podés editarlo</p> : null;
          })()}
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Notas (opcional)</label>
          <textarea rows={2} placeholder="Observaciones..." value={notas} onChange={(e) => setNotas(e.target.value)} style={{ ...input, resize: "none" } as React.CSSProperties} className="w-full px-3 py-2.5 text-sm placeholder:text-rodeo-cream/25" />
        </div>

        {saveError && <p className="text-xs text-red-400 font-bold">{saveError}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
            className="flex-1 py-3 text-sm font-bold text-rodeo-cream/60 hover:text-white transition-all">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            style={{ background: saving ? "rgba(200,255,0,0.5)" : "rgba(200,255,0,0.9)", borderRadius: "12px" }}
            className="flex-1 py-3 text-sm font-black text-rodeo-dark hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-rodeo-dark/30 border-t-rodeo-dark rounded-full animate-spin" /> : <Plus size={15} />}
            Guardar reserva
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── DeleteButton ──────────────────────────────────────────────────────────────

function DeleteButton({ busy, disabled, onDelete }: { busy: boolean; disabled: boolean; onDelete: () => void }) {
  const [confirmed, setConfirmed] = useState(false);
  function handleClick() {
    if (!confirmed) { setConfirmed(true); setTimeout(() => setConfirmed(false), 3000); }
    else { onDelete(); }
  }
  return (
    <button onClick={handleClick} disabled={disabled}
      style={{ background: confirmed ? "rgba(255,64,64,0.25)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,64,64,0.35)", borderRadius: "10px" }}
      className="flex items-center gap-2 px-4 py-2.5 text-xs font-black text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50">
      {busy ? <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : <Trash2 size={14} />}
      {confirmed ? "¿Confirmar?" : "Eliminar"}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ViewMode = "agenda" | "lista";
type ListFilter = "proximas" | "hoy" | "historial";
type StatusFilter = "todas" | EstadoReserva;

export default function ReservasPage() {
  const { user, loading: authLoading } = useAuth();
  const { activeComplexId } = useActiveComplex();

  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [courts, setCourts] = useState<CourtOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("agenda");
  const [agendaDate, setAgendaDate] = useState(getTodayISO());
  const [listFilter, setListFilter] = useState<ListFilter>("proximas");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalDefaults, setModalDefaults] = useState<{ courtId?: string; fecha?: string; hora?: string }>({});

  const openModal = (defaults = {}) => { setModalDefaults(defaults); setShowModal(true); };

  // ── Realtime ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.id || !activeComplexId) return;
    const channel = supabase.channel(`res-rt-${activeComplexId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations", filter: `complex_id=eq.${activeComplexId}` },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            setReservations((p) => p.filter((r) => r.id !== (payload.old as any).id)); return;
          }
          const { data } = await supabase.from("reservations")
            .select(`*, court:courts(nombre, deporte), jugador:profiles!user_id(nombre_completo, email, telefono)`)
            .eq("id", (payload.new as any).id).maybeSingle();
          if (!data) return;
          if (payload.eventType === "INSERT") setReservations((p) => p.some((r) => r.id === (data as any).id) ? p : [data as any, ...p]);
          else setReservations((p) => p.map((r) => r.id === (data as any).id ? data as any : r));
        }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, activeComplexId]);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (authLoading || !user) return;
    async function load() {
      if (!activeComplexId) { setLoading(false); return; }
      setLoading(true); setError(null);
      try {
        const since = addDays(getTodayISO(), -30);
        const until = addDays(getTodayISO(), 30);
        const [courtsRes, resRes] = await Promise.all([
          supabase.from("courts").select("id, nombre, deporte, precio_por_hora, complex_id").eq("complex_id", activeComplexId).eq("activa", true),
          supabase.from("reservations")
            .select(`*, court:courts(nombre, deporte), jugador:profiles!user_id(nombre_completo, email, telefono)`)
            .eq("complex_id", activeComplexId)
            .gte("fecha", since).lte("fecha", until)
            .order("fecha").order("hora_inicio").limit(400),
        ]);
        if (resRes.error) throw resRes.error;
        setCourts((courtsRes.data as any) ?? []);
        setReservations((resRes.data as any) ?? []);
      } catch (e) { setError(e instanceof Error ? e.message : "Error al cargar"); }
      finally { setLoading(false); }
    }
    load();
  }, [user?.id, authLoading, activeComplexId]);

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleConfirm(id: string) {
    setActionLoading(id + "_confirm");
    const { error } = await supabaseMut.from("reservations").update({ estado: "confirmada", confirmada_por_propietario: true }).eq("id", id);
    if (!error) setReservations((p) => p.map((r) => r.id === id ? { ...r, estado: "confirmada" as EstadoReserva, confirmada_por_propietario: true } : r));
    setActionLoading(null);
  }

  async function handleCancel(id: string) {
    setActionLoading(id + "_cancel");
    const { error } = await supabaseMut.from("reservations").update({ estado: "cancelada" }).eq("id", id);
    if (!error) setReservations((p) => p.map((r) => r.id === id ? { ...r, estado: "cancelada" as EstadoReserva } : r));
    setActionLoading(null);
  }

  async function handleComplete(id: string) {
    setActionLoading(id + "_complete");
    const { error } = await supabaseMut.from("reservations").update({ estado: "completada" }).eq("id", id);
    if (!error) setReservations((p) => p.map((r) => r.id === id ? { ...r, estado: "completada" as EstadoReserva } : r));
    setActionLoading(null);
  }

  async function handleDelete(id: string) {
    setActionLoading(id + "_delete");
    const { error } = await supabaseMut.from("reservations").delete().eq("id", id);
    if (!error) setReservations((p) => p.filter((r) => r.id !== id));
    setActionLoading(null);
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const today = getTodayISO();

  const ingresosHoy = useMemo(() =>
    reservations.filter((r) => r.fecha === today && (r.estado === "confirmada" || r.estado === "completada"))
      .reduce((s, r) => s + r.precio_total, 0),
    [reservations, today]);

  const pendientesCount = useMemo(() => reservations.filter((r) => r.estado === "pendiente").length, [reservations]);

  const listaFiltered = useMemo(() => {
    let list = reservations;
    if (listFilter === "hoy") list = list.filter((r) => r.fecha === today);
    else if (listFilter === "proximas") list = list.filter((r) => r.fecha >= today).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio));
    else list = list.filter((r) => r.fecha < today).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora_inicio.localeCompare(a.hora_inicio));
    if (statusFilter !== "todas") list = list.filter((r) => r.estado === statusFilter);
    return list;
  }, [reservations, listFilter, statusFilter, today]);

  // ── Loading / Error ────────────────────────────────────────────────────────

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-rodeo-lime/30 border-t-rodeo-lime rounded-full animate-spin" />
    </div>;
  }

  if (error) {
    return <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertCircle size={40} className="text-red-400/60" />
      <p className="text-rodeo-cream/60 text-sm">{error}</p>
      <button onClick={() => window.location.reload()} style={{ background: "rgba(200,255,0,0.15)", border: "1px solid rgba(200,255,0,0.3)", borderRadius: "12px" }} className="px-5 py-2.5 text-rodeo-lime text-sm font-bold">Reintentar</button>
    </div>;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-rodeo-cream/50 font-bold tracking-widest uppercase">Panel de Control</p>
          <h1 style={{ fontFamily: "'Barlow Condensed',system-ui,sans-serif", fontWeight: 900, fontSize: "44px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }} className="text-white flex items-center gap-3">
            Reservas
            {pendientesCount > 0 && (
              <span style={{ background: "rgba(255,179,0,0.2)", border: "1px solid rgba(255,179,0,0.4)", borderRadius: "999px" }} className="text-sm font-black text-amber-400 px-2.5 py-0.5">
                {pendientesCount} pendiente{pendientesCount > 1 ? "s" : ""}
              </span>
            )}
          </h1>
          <p className="text-sm text-rodeo-cream/50 capitalize mt-1">{formatDateLong(today)}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }} className="flex p-1">
            {([["agenda", LayoutGrid, "Agenda"], ["lista", ListIcon, "Lista"]] as const).map(([mode, Icon, label]) => (
              <button key={mode} onClick={() => setViewMode(mode as ViewMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] transition-all text-xs font-bold ${viewMode === mode ? "bg-rodeo-cream/10 text-white" : "text-rodeo-cream/40 hover:text-white"}`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
          <button onClick={() => openModal()} style={{ background: "rgba(200,255,0,0.9)", borderRadius: "12px" }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-black text-rodeo-dark hover:opacity-90 transition-all">
            <Plus size={16} /> Nueva reserva
          </button>
        </div>
      </motion.div>

      {/* Stats strip */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Pendientes",     value: reservations.filter(r => r.estado === "pendiente").length,  color: "#FFB300", bg: "rgba(255,179,0,0.08)",  icon: Clock },
          { label: "Hoy confirmadas", value: reservations.filter(r => r.fecha === today && r.estado === "confirmada").length, color: "#00E676", bg: "rgba(0,230,118,0.08)", icon: CheckCircle2 },
          { label: "Próximos 7 días", value: reservations.filter(r => r.fecha > today && r.fecha <= addDays(today, 7) && r.estado !== "cancelada").length, color: "#A78BFA", bg: "rgba(167,139,250,0.08)", icon: Calendar },
          { label: "Ingresos hoy",   value: formatMoney(ingresosHoy),                                   color: "#C8FF00", bg: "rgba(200,255,0,0.08)",   icon: DollarSign, isText: true },
        ].map((c) => (
          <div key={c.label} style={{ background: c.bg, border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px" }} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <c.icon size={14} style={{ color: c.color }} />
              <p className="text-[10px] font-bold text-rodeo-cream/40 uppercase tracking-widest">{c.label}</p>
            </div>
            <p className="text-xl font-black leading-none" style={{ color: c.color }}>{c.isText ? c.value : String(c.value)}</p>
          </div>
        ))}
      </motion.div>

      {/* ── AGENDA VIEW ──────────────────────────────────────────────────────── */}
      {viewMode === "agenda" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">

          {/* Date nav */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" }}
            className="flex items-center justify-between p-3 gap-3">
            <button onClick={() => setAgendaDate(addDays(agendaDate, -1))}
              style={{ background: "rgba(255,255,255,0.06)", borderRadius: "10px" }}
              className="w-9 h-9 flex items-center justify-center hover:bg-white/10 transition-all">
              <ChevronLeft size={18} className="text-rodeo-cream/60" />
            </button>

            <div className="flex items-center gap-3 flex-1 justify-center flex-wrap">
              {/* Quick day buttons */}
              {[
                { label: "Ayer",    date: addDays(today, -1) },
                { label: "Hoy",     date: today },
                { label: "Mañana",  date: addDays(today, 1) },
                { label: "+2 días", date: addDays(today, 2) },
                { label: "+3 días", date: addDays(today, 3) },
              ].map(({ label, date }) => (
                <button key={date} onClick={() => setAgendaDate(date)}
                  className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                  style={agendaDate === date
                    ? { background: "#C8FF00", color: "#1A120B" }
                    : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(225,212,194,0.6)" }
                  }>
                  {label}
                </button>
              ))}
              <input type="date" value={agendaDate} onChange={(e) => setAgendaDate(e.target.value)}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "#E1D4C2", fontSize: "12px" }}
                className="px-2 py-1 focus:outline-none focus:border-rodeo-lime/40" />
            </div>

            <button onClick={() => setAgendaDate(addDays(agendaDate, 1))}
              style={{ background: "rgba(255,255,255,0.06)", borderRadius: "10px" }}
              className="w-9 h-9 flex items-center justify-center hover:bg-white/10 transition-all">
              <ChevronRight size={18} className="text-rodeo-cream/60" />
            </button>
          </div>

          <p className="text-sm font-bold text-rodeo-cream/60 capitalize px-1">{formatDateLong(agendaDate)}</p>

          {/* Per-court grids */}
          {courts.length === 0 ? (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px" }} className="p-12 text-center">
              <Building2 size={32} className="text-rodeo-cream/15 mx-auto mb-3" />
              <p className="text-rodeo-cream/40 text-sm">No tenés canchas activas configuradas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courts.map((court) => {
                const dayRes = reservations.filter((r) => r.court_id === court.id && r.fecha === agendaDate && r.estado !== "cancelada");
                const totalIngresos = dayRes.filter(r => r.estado === "confirmada" || r.estado === "completada").reduce((s, r) => s + r.precio_total, 0);

                return (
                  <motion.div key={court.id} layout
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px" }}
                    className="overflow-hidden">

                    {/* Court header */}
                    <div style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                      className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div style={{ background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.2)", borderRadius: "10px" }}
                          className="w-9 h-9 flex items-center justify-center shrink-0">
                          <Building2 size={16} className="text-rodeo-lime" />
                        </div>
                        <div>
                          <p className="font-black text-white text-sm">{court.nombre}</p>
                          <p className="text-[11px] text-rodeo-lime/70 font-bold uppercase tracking-wide">
                            {DEPORTE_LABELS[court.deporte] ?? court.deporte} · ${court.precio_por_hora.toLocaleString()}/h
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="text-[10px] text-rodeo-cream/40 font-bold uppercase tracking-wider">Reservas</p>
                          <p className="text-lg font-black text-white leading-none">{dayRes.length}</p>
                        </div>
                        {totalIngresos > 0 && (
                          <div>
                            <p className="text-[10px] text-rodeo-cream/40 font-bold uppercase tracking-wider">Ingresos</p>
                            <p className="text-sm font-black text-rodeo-lime leading-none">{formatMoney(totalIngresos)}</p>
                          </div>
                        )}
                        <button onClick={() => openModal({ courtId: court.id, fecha: agendaDate })}
                          style={{ background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.25)", borderRadius: "10px" }}
                          className="flex items-center gap-1 px-3 py-2 text-xs font-black text-rodeo-lime hover:bg-rodeo-lime/20 transition-all">
                          <Plus size={12} /> Reservar
                        </button>
                      </div>
                    </div>

                    {/* Hour timeline */}
                    <div className="p-4 space-y-1.5">
                      {HORAS_AGENDA.map((hora) => {
                        const res: ReservationWithDetails | undefined = dayRes.find((r) => r.hora_inicio <= hora && r.hora_fin > hora);
                        const isFirst = res && res.hora_inicio === hora;
                        const isContinuation = res && res.hora_inicio !== hora;

                        if (isContinuation) return null; // rendered by the first slot

                        if (res && isFirst) {
                          // Calculate how many hours this reservation spans
                          const [hs] = res.hora_inicio.split(":").map(Number);
                          const [he] = res.hora_fin.split(":").map(Number);
                          const spanHours = he - hs;
                          const meta = STATUS_META[res.estado];
                          const jugadorNombre = res.jugador?.nombre_completo || res.jugador?.email || "Jugador";

                          return (
                            <div key={hora}
                              style={{ background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: "12px", gridRow: `span ${spanHours}` }}
                              className="flex items-center justify-between px-4 py-3 gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="text-center shrink-0">
                                  <p className="text-xs font-black" style={{ color: meta.color }}>{res.hora_inicio}</p>
                                  <p className="text-[10px] text-rodeo-cream/40">→ {res.hora_fin}</p>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-black text-white truncate">{jugadorNombre}</p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, borderRadius: "999px" }}
                                      className="text-[10px] font-black px-2 py-0.5">{meta.label}</span>
                                    {res.notas_usuario && <p className="text-[11px] text-rodeo-cream/40 truncate max-w-[160px]">{res.notas_usuario}</p>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <p className="text-sm font-black text-white">{formatMoney(res.precio_total)}</p>
                                {res.jugador?.telefono && (
                                  <a href={buildWhatsAppLink(res.jugador.telefono, jugadorNombre, formatDateShort(res.fecha), res.hora_inicio, court.nombre)}
                                    target="_blank" rel="noopener noreferrer"
                                    style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: "8px" }}
                                    className="p-2 text-green-400 hover:bg-green-500/20 transition-all">
                                    <MessageCircle size={14} />
                                  </a>
                                )}
                                {res.estado === "pendiente" && (
                                  <button onClick={() => handleConfirm(res.id)} disabled={!!actionLoading}
                                    style={{ background: "rgba(0,230,118,0.12)", border: "1px solid rgba(0,230,118,0.3)", borderRadius: "8px" }}
                                    className="p-2 text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-50">
                                    {actionLoading === res.id + "_confirm"
                                      ? <div className="w-3.5 h-3.5 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                                      : <CheckCircle2 size={14} />}
                                  </button>
                                )}
                                {(res.estado === "pendiente" || res.estado === "confirmada") && (
                                  <button onClick={() => handleCancel(res.id)} disabled={!!actionLoading}
                                    style={{ background: "rgba(255,64,64,0.08)", border: "1px solid rgba(255,64,64,0.25)", borderRadius: "8px" }}
                                    className="p-2 text-red-400 hover:bg-red-500/15 transition-all disabled:opacity-50">
                                    {actionLoading === res.id + "_cancel"
                                      ? <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                      : <XCircle size={14} />}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        }

                        // Free slot
                        return (
                          <button key={hora} onClick={() => openModal({ courtId: court.id, fecha: agendaDate, hora })}
                            className="w-full flex items-center gap-3 px-4 py-2 rounded-[10px] transition-all group hover:bg-white/5"
                            style={{ border: "1px solid transparent" }}>
                            <span className="text-xs font-bold text-rodeo-cream/25 w-12 shrink-0 group-hover:text-rodeo-cream/50 transition-colors">{hora}</span>
                            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
                            <span className="text-[11px] font-bold text-rodeo-lime/0 group-hover:text-rodeo-lime/60 transition-colors flex items-center gap-1">
                              <Plus size={11} /> Libre — agregar
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ── LISTA VIEW ───────────────────────────────────────────────────────── */}
      {viewMode === "lista" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">

          {/* Filters */}
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {([["proximas", "Próximas"], ["hoy", "Hoy"], ["historial", "Historial"]] as [ListFilter, string][]).map(([key, lbl]) => (
                <button key={key} onClick={() => setListFilter(key)}
                  className="px-4 py-1.5 text-xs font-bold rounded-full transition-all"
                  style={listFilter === key
                    ? { background: "rgba(200,255,0,0.9)", color: "#1A120B" }
                    : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(225,212,194,0.6)" }}>
                  {lbl}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {([["todas", "Todas"], ["pendiente", "Pendientes"], ["confirmada", "Confirmadas"], ["cancelada", "Canceladas"], ["completada", "Completadas"]] as [StatusFilter, string][]).map(([key, lbl]) => {
                const isActive = statusFilter === key;
                const meta = key !== "todas" ? STATUS_META[key as EstadoReserva] : null;
                return (
                  <button key={key} onClick={() => setStatusFilter(key)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all shrink-0 rounded-[10px]"
                    style={isActive
                      ? meta ? { color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }
                        : { color: "#C8FF00", background: "rgba(200,255,0,0.12)", border: "1px solid rgba(200,255,0,0.25)" }
                      : { color: "rgba(225,212,194,0.5)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {lbl}
                    <span style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", borderRadius: "999px" }} className="px-1.5 py-0.5 text-[10px] font-black">
                      {reservations.filter(r => key === "todas" || r.estado === key).filter(r => {
                        if (listFilter === "hoy") return r.fecha === today;
                        if (listFilter === "proximas") return r.fecha >= today;
                        return r.fecha < today;
                      }).length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* List */}
          <AnimatePresence mode="wait">
            {listaFiltered.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px" }}
                className="p-12 text-center">
                <ClipboardList size={36} className="text-rodeo-cream/15 mx-auto mb-3" />
                <p className="text-rodeo-cream/40 text-sm font-bold">No hay reservas en esta vista</p>
                <p className="text-rodeo-cream/25 text-xs mt-1">Cambiá el filtro o creá una nueva</p>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <AnimatePresence initial={false}>
                  {listaFiltered.map((r, i) => {
                    const meta = STATUS_META[r.estado];
                    const jugadorNombre = r.jugador?.nombre_completo || r.jugador?.email || "Jugador";
                    const canchaLabel = r.court?.nombre ?? "Cancha eliminada";
                    const deporteLabel = r.court?.deporte ? (DEPORTE_LABELS[r.court.deporte] ?? r.court.deporte) : null;
                    const isToday = r.fecha === today;
                    const isFuture = r.fecha > today;

                    return (
                      <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }} transition={{ delay: i * 0.02 }}
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", overflow: "hidden" }}
                        className="flex">
                        <div style={{ width: "4px", background: meta.color, borderRadius: "16px 0 0 16px", flexShrink: 0 }} />

                        <div className="flex-1 p-4 md:p-5 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-black text-white text-base leading-none">{canchaLabel}</p>
                                {deporteLabel && <span style={{ background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.2)", borderRadius: "999px" }} className="text-[10px] font-bold text-rodeo-lime px-2 py-0.5 uppercase">{deporteLabel}</span>}
                                {isToday && <span style={{ background: "rgba(255,179,0,0.1)", border: "1px solid rgba(255,179,0,0.25)", borderRadius: "999px" }} className="text-[10px] font-bold text-amber-400 px-2 py-0.5">Hoy</span>}
                                {isFuture && !isToday && <span style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: "999px" }} className="text-[10px] font-bold text-purple-400 px-2 py-0.5">{formatDateShort(r.fecha)}</span>}
                              </div>
                              <div className="flex items-center gap-2 text-rodeo-cream/60">
                                <Calendar size={12} /><span className="text-xs font-bold capitalize">{formatDateShort(r.fecha)}</span>
                                <Clock size={12} className="ml-1" /><span className="text-xs font-bold">{r.hora_inicio} – {r.hora_fin}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5 text-rodeo-cream/60">
                                  <User size={12} /><span className="text-xs font-bold text-rodeo-cream/80">{jugadorNombre}</span>
                                </div>
                                {r.jugador?.telefono && <div className="flex items-center gap-1 text-rodeo-cream/40"><Phone size={11} /><span className="text-xs">{r.jugador.telefono}</span></div>}
                              </div>
                              {r.notas_usuario && <p className="text-xs text-rodeo-cream/40 italic truncate max-w-xs">&ldquo;{r.notas_usuario}&rdquo;</p>}
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <p className="text-xl font-black text-white leading-none">{formatMoney(r.precio_total)}</p>
                              <span style={{ background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: "999px", color: meta.color }} className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1">{meta.label}</span>
                              {r.jugador?.telefono && (
                                <a href={buildWhatsAppLink(r.jugador.telefono, jugadorNombre, formatDateShort(r.fecha), r.hora_inicio, canchaLabel)}
                                  target="_blank" rel="noopener noreferrer"
                                  style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: "8px" }}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-green-400 hover:bg-green-500/20 transition-all">
                                  <MessageCircle size={12} /> WhatsApp
                                </a>
                              )}
                            </div>
                          </div>

                          {r.estado === "pendiente" && (
                            <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                              <button onClick={() => handleConfirm(r.id)} disabled={!!actionLoading}
                                style={{ background: "rgba(0,230,118,0.15)", border: "1px solid rgba(0,230,118,0.3)", borderRadius: "10px" }}
                                className="flex items-center gap-2 px-4 py-2.5 text-xs font-black text-green-400 disabled:opacity-50">
                                {actionLoading === r.id + "_confirm" ? <div className="w-3.5 h-3.5 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" /> : <CheckCircle2 size={14} />}
                                Confirmar
                              </button>
                              <button onClick={() => handleCancel(r.id)} disabled={!!actionLoading}
                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,64,64,0.25)", borderRadius: "10px" }}
                                className="flex items-center gap-2 px-4 py-2.5 text-xs font-black text-red-400 disabled:opacity-50">
                                {actionLoading === r.id + "_cancel" ? <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : <XCircle size={14} />}
                                Cancelar
                              </button>
                            </div>
                          )}
                          {r.estado === "confirmada" && (
                            <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                              <button onClick={() => handleComplete(r.id)} disabled={!!actionLoading}
                                style={{ background: "rgba(64,196,255,0.15)", border: "1px solid rgba(64,196,255,0.3)", borderRadius: "10px" }}
                                className="flex items-center gap-2 px-4 py-2.5 text-xs font-black text-sky-400 disabled:opacity-50">
                                {actionLoading === r.id + "_complete" ? <div className="w-3.5 h-3.5 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" /> : <CheckCircle2 size={14} />}
                                Completar
                              </button>
                              <button onClick={() => handleCancel(r.id)} disabled={!!actionLoading}
                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,64,64,0.25)", borderRadius: "10px" }}
                                className="flex items-center gap-2 px-4 py-2.5 text-xs font-black text-red-400 disabled:opacity-50">
                                {actionLoading === r.id + "_cancel" ? <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : <XCircle size={14} />}
                                Cancelar
                              </button>
                            </div>
                          )}
                          {r.estado === "cancelada" && (
                            <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                              <DeleteButton busy={actionLoading === r.id + "_delete"} disabled={!!actionLoading} onDelete={() => handleDelete(r.id)} />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && courts.length > 0 && user && (
          <NewReservationModal courts={courts} userId={user.id}
            defaultCourtId={modalDefaults.courtId} defaultFecha={modalDefaults.fecha} defaultHora={modalDefaults.hora}
            onClose={() => setShowModal(false)}
            onSaved={(r) => { setReservations((p) => [r, ...p]); setShowModal(false); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
