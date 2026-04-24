"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Clock, CheckCircle2, XCircle, AlertCircle,
  MessageCircle, User, Phone, DollarSign, Calendar, Plus, Trash2,
  Building2, ChevronLeft, ChevronRight, List as ListIcon, LayoutGrid, Pencil,
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

function extractJugadorName(res: ReservationWithDetails): string {
  if (res.notas_usuario?.startsWith("Reserva manual · ")) {
    const parts = res.notas_usuario.split(" · ");
    if (parts[1]) return parts[1];
  }
  return res.jugador?.nombre_completo || res.jugador?.email || "Jugador";
}

function extractJugadorPhone(res: ReservationWithDetails): string | null {
  if (res.notas_usuario?.startsWith("Reserva manual · ")) {
    const parts = res.notas_usuario.split(" · ");
    const telPart = parts.find(p => p.startsWith("Tel: "));
    if (telPart) return telPart.replace("Tel: ", "");
  }
  return res.jugador?.telefono ?? null;
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

// ─── EditReservationModal ─────────────────────────────────────────────────────

interface EditModalProps {
  reservation: ReservationWithDetails;
  courts: CourtOption[];
  onClose: () => void;
  onSaved: (updated: ReservationWithDetails) => void;
}

function EditReservationModal({ reservation: res, courts, onClose, onSaved }: EditModalProps) {
  const initName = extractJugadorName(res);
  const initPhone = extractJugadorPhone(res) ?? "";
  const initNotas = (() => {
    if (!res.notas_usuario?.startsWith("Reserva manual · ")) return res.notas_usuario ?? "";
    const parts = res.notas_usuario.split(" · ");
    return parts.slice(parts.findIndex(p => p.startsWith("Tel: ")) + 1).join(" · ") || (parts.length > 2 && !parts[2].startsWith("Tel:") ? parts.slice(2).join(" · ") : "");
  })();

  const [courtId, setCourtId] = useState(res.court_id);
  const [fecha, setFecha] = useState(res.fecha);
  const [horaInicio, setHoraInicio] = useState(res.hora_inicio);
  const [horaFin, setHoraFin] = useState(res.hora_fin);
  const [jugadorNombre, setJugadorNombre] = useState(initName === "Jugador" ? "" : initName);
  const [jugadorTelefono, setJugadorTelefono] = useState(initPhone);
  const [precioTotal, setPrecioTotal] = useState(res.precio_total);
  const [estado, setEstado] = useState<EstadoReserva>(res.estado);
  const [notas, setNotas] = useState(initNotas);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedCourt = courts.find(c => c.id === courtId) ?? null;

  async function handleSave() {
    if (!fecha || !horaInicio || !horaFin || !jugadorNombre.trim()) {
      setSaveError("Completá fecha, horario y nombre del jugador."); return;
    }
    setSaving(true); setSaveError(null);
    const notasComposed = ["Reserva manual", jugadorNombre.trim(),
      jugadorTelefono.trim() ? `Tel: ${jugadorTelefono.trim()}` : null,
      notas.trim() || null].filter(Boolean).join(" · ");

    const { data, error } = await supabaseMut.from("reservations")
      .update({ court_id: courtId, fecha, hora_inicio: horaInicio, hora_fin: horaFin, precio_total: precioTotal, estado, notas_usuario: notasComposed })
      .eq("id", res.id)
      .select(`*, court:courts(nombre, deporte), jugador:profiles!user_id(nombre_completo, email, telefono)`)
      .single();
    if (error) { setSaveError(error.message); setSaving(false); return; }
    onSaved(data as unknown as ReservationWithDetails);
    onClose();
  }

  const input = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#E1D4C2", outline: "none" } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        style={{ background: "linear-gradient(145deg,rgba(41,28,14,0.97),rgba(26,18,11,0.99))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }}
        className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white uppercase flex items-center gap-2">
            <Pencil size={16} className="text-rodeo-lime" /> Editar reserva
          </h2>
          <button onClick={onClose} className="text-rodeo-cream/40 hover:text-white text-xl font-bold">×</button>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Cancha</label>
          <select value={courtId} onChange={e => setCourtId(e.target.value)} style={input} className="w-full px-3 py-2.5 text-sm">
            {courts.map(c => <option key={c.id} value={c.id} style={{ background: "#291C0E" }}>{c.nombre} — {c.deporte}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Fecha</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={input} className="w-full px-3 py-2.5 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {([["Hora inicio", horaInicio, setHoraInicio], ["Hora fin", horaFin, setHoraFin]] as const).map(([lbl, val, set]) => (
            <div key={lbl} className="space-y-1.5">
              <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">{lbl}</label>
              <select value={val} onChange={e => (set as any)(e.target.value)} style={input} className="w-full px-3 py-2.5 text-sm">
                {HORA_OPTIONS.map(h => <option key={h} value={h} style={{ background: "#291C0E" }}>{h}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Nombre del jugador *</label>
          <input type="text" placeholder="Ej: Juan García" value={jugadorNombre} onChange={e => setJugadorNombre(e.target.value)} style={input} className="w-full px-3 py-2.5 text-sm placeholder:text-rodeo-cream/25" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Teléfono (opcional)</label>
          <input type="tel" placeholder="Ej: 3834123456" value={jugadorTelefono} onChange={e => setJugadorTelefono(e.target.value)} style={input} className="w-full px-3 py-2.5 text-sm placeholder:text-rodeo-cream/25" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Precio (ARS)</label>
            <input type="number" min={0} value={precioTotal} onChange={e => setPrecioTotal(Number(e.target.value))} style={input} className="w-full px-3 py-2.5 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Estado</label>
            <select value={estado} onChange={e => setEstado(e.target.value as EstadoReserva)} style={input} className="w-full px-3 py-2.5 text-sm">
              {(["pendiente", "confirmada", "completada", "cancelada"] as EstadoReserva[]).map(s => (
                <option key={s} value={s} style={{ background: "#291C0E" }}>{STATUS_META[s].label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Notas (opcional)</label>
          <textarea rows={2} placeholder="Observaciones..." value={notas} onChange={e => setNotas(e.target.value)} style={{ ...input, resize: "none" } as React.CSSProperties} className="w-full px-3 py-2.5 text-sm placeholder:text-rodeo-cream/25" />
        </div>

        {saveError && <p className="text-xs text-red-400 font-bold">{saveError}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
            className="flex-1 py-3 text-sm font-bold text-rodeo-cream/60 hover:text-white transition-all">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            style={{ background: saving ? "rgba(200,255,0,0.5)" : "rgba(200,255,0,0.9)", borderRadius: "12px" }}
            className="flex-1 py-3 text-sm font-black text-rodeo-dark hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-rodeo-dark/30 border-t-rodeo-dark rounded-full animate-spin" /> : <Pencil size={14} />}
            Guardar cambios
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
  const [selectedRes, setSelectedRes] = useState<ReservationWithDetails | null>(null);
  const [editingRes, setEditingRes] = useState<ReservationWithDetails | null>(null);

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

          {/* Courts × Hours matrix grid */}
          {courts.length === 0 ? (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px" }} className="p-12 text-center">
              <Building2 size={32} className="text-rodeo-cream/15 mx-auto mb-3" />
              <p className="text-rodeo-cream/40 text-sm">No tenés canchas activas configuradas</p>
            </div>
          ) : (() => {
            const CELL_W = 76;
            const LEFT_W = 152;
            const ROW_H = 68;
            const GRID_HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 7..23

            function toMinutes(t: string) {
              const [h, m] = t.split(":").map(Number);
              return h * 60 + m;
            }
            function hourLeft(h: number) { return (h - 7) * CELL_W; }
            function resLeft(inicio: string) { return ((toMinutes(inicio) - 7 * 60) / 60) * CELL_W; }
            function resWidth(inicio: string, fin: string) { return ((toMinutes(fin) - toMinutes(inicio)) / 60) * CELL_W - 3; }

            const totalGridW = GRID_HOURS.length * CELL_W;
            return (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", overflow: "hidden" }}>
                {/* Scrollable wrapper */}
                <div className="overflow-x-auto">
                  <div style={{ minWidth: LEFT_W + totalGridW + 1 }}>

                    {/* Header row: hours */}
                    <div className="flex" style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)", position: "sticky", top: 0, zIndex: 10 }}>
                      <div style={{ width: LEFT_W, minWidth: LEFT_W, background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.08)" }}
                        className="flex items-center px-4 py-2.5">
                        <span className="text-[10px] font-black text-rodeo-cream/30 uppercase tracking-widest">Cancha</span>
                      </div>
                      <div style={{ position: "relative", width: totalGridW, height: 36 }}>
                        {GRID_HOURS.map((h) => (
                          <div key={h} style={{ position: "absolute", left: hourLeft(h), width: CELL_W, top: 0, height: "100%", borderLeft: "1px solid rgba(255,255,255,0.06)" }}
                            className="flex items-center justify-center">
                            <span className="text-[11px] font-bold text-rodeo-cream/35">{String(h).padStart(2, "0")}:00</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Court rows */}
                    {courts.map((court, ci) => {
                      const dayRes = reservations.filter((r) => r.court_id === court.id && r.fecha === agendaDate && r.estado !== "cancelada");
                      return (
                        <div key={court.id} className="flex"
                          style={{ borderBottom: ci < courts.length - 1 ? "1px solid rgba(255,255,255,0.06)" : undefined }}>

                          {/* Sticky court name */}
                          <div style={{ width: LEFT_W, minWidth: LEFT_W, background: "rgba(26,18,11,0.95)", borderRight: "1px solid rgba(255,255,255,0.08)", position: "sticky", left: 0, zIndex: 5 }}
                            className="flex flex-col justify-center px-4 py-3 gap-0.5">
                            <p className="text-sm font-black text-white leading-tight truncate">{court.nombre}</p>
                            <p className="text-[10px] font-bold text-rodeo-lime/60 uppercase tracking-wide truncate">
                              {DEPORTE_LABELS[court.deporte] ?? court.deporte}
                            </p>
                            <button onClick={() => openModal({ courtId: court.id, fecha: agendaDate })}
                              className="mt-1 flex items-center gap-1 text-[10px] font-black text-rodeo-lime/50 hover:text-rodeo-lime transition-colors w-fit">
                              <Plus size={10} /> Agregar
                            </button>
                          </div>

                          {/* Hour cells */}
                          <div style={{ position: "relative", width: totalGridW, height: ROW_H }}>
                            {/* Clickable empty hour cells */}
                            {GRID_HOURS.map((h) => {
                              const hStr = `${String(h).padStart(2, "0")}:00`;
                              const blocked = dayRes.some((r) => toMinutes(r.hora_inicio) <= h * 60 && toMinutes(r.hora_fin) > h * 60);
                              return (
                                <div key={h} onClick={() => !blocked && openModal({ courtId: court.id, fecha: agendaDate, hora: hStr })}
                                  style={{ position: "absolute", left: hourLeft(h), top: 0, width: CELL_W, height: "100%", borderLeft: "1px solid rgba(255,255,255,0.05)", cursor: blocked ? "default" : "pointer" }}
                                  className={!blocked ? "hover:bg-white/[0.03] transition-colors group" : ""}>
                                  {!blocked && (
                                    <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Plus size={12} className="text-rodeo-cream/20" />
                                    </span>
                                  )}
                                </div>
                              );
                            })}

                            {/* Reservation blocks */}
                            {dayRes.map((res) => {
                              const meta = STATUS_META[res.estado];
                              const left = resLeft(res.hora_inicio);
                              const width = resWidth(res.hora_inicio, res.hora_fin);
                              const jugadorNombre = extractJugadorName(res);
                              return (
                                <button key={res.id} onClick={() => setSelectedRes(res)}
                                  style={{ position: "absolute", left, top: 5, width, height: ROW_H - 10, background: meta.bg, border: `1.5px solid ${meta.border}`, borderRadius: "10px", zIndex: 2, overflow: "hidden" }}
                                  className="flex flex-col justify-center px-2 text-left hover:brightness-110 transition-all group">
                                  <p className="text-[11px] font-black truncate leading-tight" style={{ color: meta.color }}>{jugadorNombre}</p>
                                  <p className="text-[10px] text-rodeo-cream/50 truncate">{res.hora_inicio}–{res.hora_fin}</p>
                                  {width > 100 && <p className="text-[10px] font-bold text-white/60 truncate">{formatMoney(res.precio_total)}</p>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reservation detail popover */}
                <AnimatePresence>
                  {selectedRes && (() => {
                    const res = selectedRes;
                    const meta = STATUS_META[res.estado];
                    const jugadorNombre = extractJugadorName(res);
                    const jugadorPhone = extractJugadorPhone(res);
                    const courtName = courts.find(c => c.id === res.court_id)?.nombre ?? "Cancha";
                    return (
                      <motion.div key={res.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(26,18,11,0.98)" }}
                        className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-black text-white">{jugadorNombre}</p>
                              <span style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, borderRadius: "999px" }} className="text-[10px] font-black px-2 py-0.5">{meta.label}</span>
                            </div>
                            <p className="text-xs text-rodeo-cream/50">{courtName} · {res.hora_inicio}–{res.hora_fin} · {formatMoney(res.precio_total)}</p>
                            {res.notas_usuario && <p className="text-xs text-rodeo-cream/40 italic">&ldquo;{res.notas_usuario}&rdquo;</p>}
                          </div>
                          <button onClick={() => setSelectedRes(null)} className="text-rodeo-cream/30 hover:text-white transition-colors text-lg font-bold shrink-0">×</button>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => { setEditingRes(res); setSelectedRes(null); }}
                            style={{ background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.25)", borderRadius: "10px" }}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rodeo-lime hover:bg-rodeo-lime/20 transition-all">
                            <Pencil size={13} /> Editar
                          </button>
                          {jugadorPhone && (
                            <a href={buildWhatsAppLink(jugadorPhone, jugadorNombre, formatDateShort(res.fecha), res.hora_inicio, courtName)}
                              target="_blank" rel="noopener noreferrer"
                              style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: "10px" }}
                              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-green-400 hover:bg-green-500/20 transition-all">
                              <MessageCircle size={13} /> WhatsApp
                            </a>
                          )}
                          {res.estado === "pendiente" && (
                            <button onClick={async () => { await handleConfirm(res.id); setSelectedRes(p => p ? { ...p, estado: "confirmada" as EstadoReserva } : null); }}
                              disabled={!!actionLoading}
                              style={{ background: "rgba(0,230,118,0.12)", border: "1px solid rgba(0,230,118,0.3)", borderRadius: "10px" }}
                              className="flex items-center gap-1.5 px-3 py-2 text-xs font-black text-green-400 disabled:opacity-50">
                              <CheckCircle2 size={13} /> Confirmar
                            </button>
                          )}
                          {(res.estado === "pendiente" || res.estado === "confirmada") && (
                            <button onClick={async () => { await handleCancel(res.id); setSelectedRes(null); }}
                              disabled={!!actionLoading}
                              style={{ background: "rgba(255,64,64,0.08)", border: "1px solid rgba(255,64,64,0.25)", borderRadius: "10px" }}
                              className="flex items-center gap-1.5 px-3 py-2 text-xs font-black text-red-400 disabled:opacity-50">
                              <XCircle size={13} /> Cancelar
                            </button>
                          )}
                          {res.estado === "confirmada" && (
                            <button onClick={async () => { await handleComplete(res.id); setSelectedRes(null); }}
                              disabled={!!actionLoading}
                              style={{ background: "rgba(64,196,255,0.12)", border: "1px solid rgba(64,196,255,0.3)", borderRadius: "10px" }}
                              className="flex items-center gap-1.5 px-3 py-2 text-xs font-black text-sky-400 disabled:opacity-50">
                              <CheckCircle2 size={13} /> Completar
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            );
          })()}
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
                    const canchaLabel = r.court?.nombre ?? "Cancha eliminada";
                    const deporteLabel = r.court?.deporte ? (DEPORTE_LABELS[r.court.deporte] ?? r.court.deporte) : null;
                    const isToday = r.fecha === today;
                    const isFuture = r.fecha > today;
                    const jugadorNombre = extractJugadorName(r);
                    const jugadorPhone = extractJugadorPhone(r);
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
                                <p className="font-black text-white text-base leading-none">{jugadorNombre}</p>
                                {deporteLabel && <span style={{ background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.2)", borderRadius: "999px" }} className="text-[10px] font-bold text-rodeo-lime px-2 py-0.5 uppercase">{deporteLabel}</span>}
                                {isToday && <span style={{ background: "rgba(255,179,0,0.1)", border: "1px solid rgba(255,179,0,0.25)", borderRadius: "999px" }} className="text-[10px] font-bold text-amber-400 px-2 py-0.5">Hoy</span>}
                                {isFuture && !isToday && <span style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: "999px" }} className="text-[10px] font-bold text-purple-400 px-2 py-0.5">{formatDateShort(r.fecha)}</span>}
                              </div>
                              <div className="flex items-center gap-2 text-rodeo-cream/60">
                                <Building2 size={12} /><span className="text-xs font-bold">{canchaLabel}</span>
                                <Calendar size={12} className="ml-1" /><span className="text-xs font-bold capitalize">{formatDateShort(r.fecha)}</span>
                                <Clock size={12} className="ml-1" /><span className="text-xs font-bold">{r.hora_inicio} – {r.hora_fin}</span>
                              </div>
                              {jugadorPhone && (
                                <div className="flex items-center gap-1 text-rodeo-cream/40"><Phone size={11} /><span className="text-xs">{jugadorPhone}</span></div>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <p className="text-xl font-black text-white leading-none">{formatMoney(r.precio_total)}</p>
                              <span style={{ background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: "999px", color: meta.color }} className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1">{meta.label}</span>
                              <div className="flex gap-1.5">
                                <button onClick={() => setEditingRes(r)}
                                  style={{ background: "rgba(200,255,0,0.08)", border: "1px solid rgba(200,255,0,0.2)", borderRadius: "8px" }}
                                  className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold text-rodeo-lime hover:bg-rodeo-lime/15 transition-all">
                                  <Pencil size={11} /> Editar
                                </button>
                                {jugadorPhone && (
                                  <a href={buildWhatsAppLink(jugadorPhone, jugadorNombre, formatDateShort(r.fecha), r.hora_inicio, canchaLabel)}
                                    target="_blank" rel="noopener noreferrer"
                                    style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: "8px" }}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-green-400 hover:bg-green-500/20 transition-all">
                                    <MessageCircle size={12} /> WhatsApp
                                  </a>
                                )}
                              </div>
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

      {/* Modals */}
      <AnimatePresence>
        {showModal && courts.length > 0 && user && (
          <NewReservationModal courts={courts} userId={user.id}
            defaultCourtId={modalDefaults.courtId} defaultFecha={modalDefaults.fecha} defaultHora={modalDefaults.hora}
            onClose={() => setShowModal(false)}
            onSaved={(r) => { setReservations((p) => [r, ...p]); setShowModal(false); }} />
        )}
        {editingRes && courts.length > 0 && (
          <EditReservationModal reservation={editingRes} courts={courts}
            onClose={() => setEditingRes(null)}
            onSaved={(updated) => { setReservations(p => p.map(r => r.id === updated.id ? updated : r)); setEditingRes(null); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
