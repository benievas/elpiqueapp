"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Zap,
  X,
  Loader2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  Clock,
} from "lucide-react";
import { supabase, supabaseMut } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";
import { useActiveComplex } from "@/lib/context/ActiveComplexContext";
import type { Court, CourtInsert, Complex, Deporte, EstadoCancha } from "@/types/database";
import CourtScheduleEditor from "@/components/CourtScheduleEditor";

// ─── Constants ────────────────────────────────────────────────────────────────

const SPORT_COLORS: Record<Deporte, string> = {
  futbol: "#C8FF00",
  padel: "#00E5FF",
  tenis: "#FFD600",
  voley: "#FF6B35",
  basquet: "#FF4081",
  hockey: "#A78BFA",
  squash: "#34D399",
};

const SPORT_LABELS: Record<Deporte, string> = {
  futbol: "Fútbol",
  padel: "Padel",
  tenis: "Tenis",
  voley: "Vóley",
  basquet: "Básquet",
  hockey: "Hockey",
  squash: "Squash",
};

const SUPERFICIE_LABELS: Record<string, string> = {
  sintetico: "Sintético",
  cesped: "Césped",
  polvo_ladrillo: "Polvo de ladrillo",
  parquet: "Parquet",
  cemento: "Cemento",
};

const ESTADO_CONFIG: Record<EstadoCancha, { label: string; bg: string; color: string }> = {
  disponible: { label: "Disponible", bg: "rgba(200,255,0,0.15)", color: "#C8FF00" },
  mantenimiento: { label: "Mantenimiento", bg: "rgba(251,191,36,0.15)", color: "#FBbf24" },
  ocupada: { label: "Ocupada", bg: "rgba(239,68,68,0.15)", color: "#EF4444" },
};

const DEPORTE_OPTIONS: { value: Deporte; label: string }[] = [
  { value: "futbol", label: "Fútbol" },
  { value: "padel", label: "Padel" },
  { value: "tenis", label: "Tenis" },
  { value: "voley", label: "Vóley" },
  { value: "basquet", label: "Básquetbol" },
  { value: "hockey", label: "Hockey" },
  { value: "squash", label: "Squash" },
];

const SUPERFICIE_OPTIONS = [
  { value: "sintetico", label: "Sintético" },
  { value: "cesped", label: "Césped" },
  { value: "polvo_ladrillo", label: "Polvo de ladrillo" },
  { value: "parquet", label: "Parquet" },
  { value: "cemento", label: "Cemento" },
];

const ESTADO_OPTIONS: { value: EstadoCancha; label: string }[] = [
  { value: "disponible", label: "Disponible" },
  { value: "mantenimiento", label: "Mantenimiento" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  nombre: string;
  deporte: Deporte;
  precio_por_hora: number;
  capacidad_jugadores: number;
  superficie: string;
  tiene_iluminacion: boolean;
  descripcion: string;
  estado: EstadoCancha;
  imagen_principal: string;
}

const DEFAULT_FORM: FormData = {
  nombre: "",
  deporte: "futbol",
  precio_por_hora: 0,
  capacidad_jugadores: 10,
  superficie: "sintetico",
  tiene_iluminacion: false,
  descripcion: "",
  estado: "disponible",
  imagen_principal: "",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function Spinner({ size = 20 }: { size?: number }) {
  return (
    <Loader2
      size={size}
      className="animate-spin text-rodeo-lime"
    />
  );
}

function InputField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-rodeo-cream/60">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "10px",
  color: "white",
  padding: "10px 14px",
  width: "100%",
  outline: "none",
  fontSize: "14px",
};

const selectStyle = {
  ...inputStyle,
  appearance: "none" as const,
  cursor: "pointer",
};

// ─── Court Form Modal ─────────────────────────────────────────────────────────

function CourtModal({
  editingCourt,
  complexId,
  onClose,
  onSaved,
}: {
  editingCourt: Court | null;
  complexId: string;
  onClose: () => void;
  onSaved: (court: Court) => void;
}) {
  const [form, setForm] = useState<FormData>(
    editingCourt
      ? {
          nombre: editingCourt.nombre,
          deporte: editingCourt.deporte,
          precio_por_hora: editingCourt.precio_por_hora,
          capacidad_jugadores: editingCourt.capacidad_jugadores,
          superficie: editingCourt.superficie,
          tiene_iluminacion: editingCourt.tiene_iluminacion,
          descripcion: editingCourt.descripcion ?? "",
          estado: editingCourt.estado,
          imagen_principal: editingCourt.imagen_principal ?? "",
        }
      : DEFAULT_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [uploadingImg, setUploadingImg] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (name === "precio_por_hora" || name === "capacidad_jugadores") {
      setForm((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { setError("La imagen no puede superar 5MB."); return; }
    setUploadingImg(true); setError(null);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `courts/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const { error: upErr } = await supabaseMut.storage.from("app-media").upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data } = supabaseMut.storage.from("app-media").getPublicUrl(path);
      setForm(f => ({ ...f, imagen_principal: data.publicUrl }));
    } catch (err) {
      setError((err as { message?: string }).message || "Error al subir.");
    } finally { setUploadingImg(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("El nombre de la cancha es obligatorio.");
      return;
    }
    if (form.precio_por_hora <= 0) {
      setError("El precio por hora debe ser mayor a 0.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload: CourtInsert = {
      complex_id: complexId,
      nombre: form.nombre.trim(),
      deporte: form.deporte,
      precio_por_hora: form.precio_por_hora,
      capacidad_jugadores: form.capacidad_jugadores,
      superficie: form.superficie,
      tiene_iluminacion: form.tiene_iluminacion,
      descripcion: form.descripcion.trim() || null,
      imagen_principal: form.imagen_principal || null,
      estado: form.estado,
      activa: true,
    };

    if (editingCourt) {
      // Para update no incluir complex_id (solo campos editables)
      const updatePayload = {
        nombre: form.nombre.trim(),
        deporte: form.deporte,
        precio_por_hora: form.precio_por_hora,
        capacidad_jugadores: form.capacidad_jugadores,
        superficie: form.superficie,
        tiene_iluminacion: form.tiene_iluminacion,
        descripcion: form.descripcion.trim() || null,
        imagen_principal: form.imagen_principal || null,
        estado: form.estado,
        activa: true,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: supaErr } = await (supabase as any)
        .from("courts")
        .update(updatePayload)
        .eq("id", editingCourt.id)
        .select()
        .single();

      if (supaErr) {
        setError(supaErr.message);
        setSaving(false);
        return;
      }
      onSaved(data as Court);
    } else {
      const { data, error: supaErr } = await supabaseMut
        .from("courts")
        .insert(payload)
        .select()
        .single();

      if (supaErr) {
        setError(supaErr.message);
        setSaving(false);
        return;
      }
      onSaved(data as Court);
    }

    setSaving(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{
          background: "rgba(26,18,11,0.97)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "20px",
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        className="p-6 shadow-2xl"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              {editingCourt ? "Editar cancha" : "Nueva cancha"}
            </h2>
            <p className="text-xs text-rodeo-cream/50 mt-0.5">
              {editingCourt ? "Modificá los datos de la cancha" : "Completá los datos para crear la cancha"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-rodeo-cream/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <InputField label="Nombre de la cancha">
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej: Cancha 1, La Principal..."
              style={inputStyle}
              autoFocus
            />
          </InputField>

          {/* Deporte & Superficie */}
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Deporte">
              <div style={{ position: "relative" }}>
                <select
                  name="deporte"
                  value={form.deporte}
                  onChange={handleChange}
                  style={selectStyle}
                >
                  {DEPORTE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} style={{ background: "#1A120B" }}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(255,255,255,0.4)",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </InputField>

            <InputField label="Superficie">
              <div style={{ position: "relative" }}>
                <select
                  name="superficie"
                  value={form.superficie}
                  onChange={handleChange}
                  style={selectStyle}
                >
                  {SUPERFICIE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} style={{ background: "#1A120B" }}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(255,255,255,0.4)",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </InputField>
          </div>

          {/* Precio & Capacidad */}
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Precio por hora (ARS)">
              <input
                type="number"
                name="precio_por_hora"
                value={form.precio_por_hora === 0 ? "" : form.precio_por_hora}
                onChange={handleChange}
                min={0}
                step={100}
                placeholder="3000"
                style={inputStyle}
              />
            </InputField>

            <InputField label="Capacidad (jugadores)">
              <input
                type="number"
                name="capacidad_jugadores"
                value={form.capacidad_jugadores}
                onChange={handleChange}
                min={2}
                max={50}
                style={inputStyle}
              />
            </InputField>
          </div>

          {/* Estado */}
          <InputField label="Estado">
            <div style={{ position: "relative" }}>
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                style={selectStyle}
              >
                {ESTADO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} style={{ background: "#1A120B" }}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.4)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </InputField>

          {/* Iluminación toggle */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
            }}
            className="p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Zap size={18} className="text-rodeo-lime" />
              <div>
                <p className="text-sm font-bold text-white">Iluminación nocturna</p>
                <p className="text-xs text-rodeo-cream/50">La cancha cuenta con reflectores</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, tiene_iluminacion: !prev.tiene_iluminacion }))}
              className="transition-colors"
            >
              {form.tiene_iluminacion ? (
                <ToggleRight size={32} style={{ color: "#C8FF00" }} />
              ) : (
                <ToggleLeft size={32} style={{ color: "rgba(255,255,255,0.3)" }} />
              )}
            </button>
          </div>

          {/* Descripción */}
          <InputField label="Descripción (opcional)">
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Ej: Cancha de 5 vs 5, techada, con vestuarios..."
              rows={3}
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: 80,
              }}
            />
          </InputField>

          {/* Imagen */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-rodeo-cream/40 uppercase tracking-widest">Foto de la Cancha (Opcional)</label>
            {form.imagen_principal ? (
              <div className="relative" style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)" }}>
                <img src={form.imagen_principal} alt="" className="w-full h-40 object-cover" />
                <button type="button" onClick={()=>setForm(f=>({...f, imagen_principal: ""}))} style={{ background:"rgba(0,0,0,0.7)", borderRadius:"8px" }} className="absolute top-2 right-2 p-1.5 text-white hover:bg-red-500/80">
                  <X size={14}/>
                </button>
              </div>
            ) : (
              <label style={{ background:"rgba(255,255,255,0.04)", border:"1px dashed rgba(255,255,255,0.18)", borderRadius:"12px" }} className="flex items-center justify-center gap-2 py-5 cursor-pointer hover:bg-white/8">
                {uploadingImg ? <><Loader2 size={14} className="animate-spin text-rodeo-lime"/><span className="text-xs text-rodeo-cream/60">Subiendo...</span></> : <span className="text-xs text-rodeo-cream/60">Upload Photo (Max 5MB)</span>}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg}/>
              </label>
            )}
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "10px",
              }}
              className="flex items-center gap-3 p-3"
            >
              <AlertTriangle size={16} style={{ color: "#EF4444", flexShrink: 0 }} />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-rodeo-cream/70 hover:text-white transition-colors"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
              style={{
                background: "rgba(200,255,0,0.9)",
                color: "#1A120B",
              }}
            >
              {saving ? <Spinner size={16} /> : null}
              {saving ? "Guardando..." : editingCourt ? "Guardar cambios" : "Crear cancha"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Court Card ───────────────────────────────────────────────────────────────

function CourtCard({
  court,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleExpress,
}: {
  court: Court;
  onEdit: (court: Court) => void;
  onDelete: (id: string) => void;
  onToggleActive: (court: Court) => void;
  onToggleExpress: (court: Court) => void;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [togglingExpress, setTogglingExpress] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const sportColor = SPORT_COLORS[court.deporte] ?? "#C8FF00";
  const estadoCfg = ESTADO_CONFIG[court.estado];

  const handleDeleteClick = () => {
    if (deleteConfirm) {
      onDelete(court.id);
    } else {
      setDeleteConfirm(true);
      // Reset after 3s
      setTimeout(() => setDeleteConfirm(false), 3000);
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    await onToggleActive(court);
    setToggling(false);
  };

  const handleToggleExpress = async () => {
    setTogglingExpress(true);
    await onToggleExpress(court);
    setTogglingExpress(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        borderLeft: `4px solid ${sportColor}`,
        opacity: court.activa ? 1 : 0.55,
      }}
      className="p-5 flex flex-col gap-4"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-base font-black text-white uppercase tracking-tight truncate">
            {court.nombre}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {/* Deporte badge */}
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                background: `${sportColor}22`,
                color: sportColor,
                border: `1px solid ${sportColor}44`,
              }}
            >
              {SPORT_LABELS[court.deporte]}
            </span>
            {/* Superficie badge */}
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.55)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {SUPERFICIE_LABELS[court.superficie] ?? court.superficie}
            </span>
            {/* Iluminación */}
            {court.tiene_iluminacion && (
              <span
                className="text-xs font-bold flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(200,255,0,0.1)",
                  color: "#C8FF00",
                  border: "1px solid rgba(200,255,0,0.25)",
                }}
              >
                <Zap size={10} />
                Iluminada
              </span>
            )}
          </div>
        </div>

        {/* Estado pill */}
        <span
          className="text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0"
          style={{
            background: estadoCfg.bg,
            color: estadoCfg.color,
          }}
        >
          {estadoCfg.label}
        </span>
      </div>

      {/* Price & capacity */}
      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs text-rodeo-cream/40 uppercase tracking-wider">Precio</p>
          <p className="text-lg font-black" style={{ color: "#C8FF00" }}>
            ${court.precio_por_hora.toLocaleString("es-AR")}
            <span className="text-xs font-normal text-rodeo-cream/50">/h</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-rodeo-cream/40 uppercase tracking-wider">Capacidad</p>
          <p className="text-lg font-black text-white">
            {court.capacidad_jugadores}
            <span className="text-xs font-normal text-rodeo-cream/50"> jugadores</span>
          </p>
        </div>
      </div>

      {/* Description */}
      {court.descripcion && (
        <p className="text-xs text-rodeo-cream/50 leading-relaxed line-clamp-2">
          {court.descripcion}
        </p>
      )}

      {/* Actions row */}
      <div
        className="flex items-center justify-between pt-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3">
          {/* Active toggle */}
          <button
            onClick={handleToggle}
            disabled={toggling}
            className="flex items-center gap-2 text-xs font-bold transition-colors disabled:opacity-50"
            style={{ color: court.activa ? "#C8FF00" : "rgba(255,255,255,0.35)" }}
          >
            {toggling ? (
              <Spinner size={18} />
            ) : court.activa ? (
              <ToggleRight size={24} />
            ) : (
              <ToggleLeft size={24} />
            )}
            {court.activa ? "Activa" : "Inactiva"}
          </button>

          {/* Express discount toggle */}
          <button
            onClick={handleToggleExpress}
            disabled={togglingExpress || !court.activa}
            title={court.activa ? "Activar/desactivar descuento express" : "La cancha debe estar activa"}
            className="flex items-center gap-1.5 text-xs font-bold transition-colors disabled:opacity-40 px-2 py-1 rounded-lg"
            style={{
              background: court.descuento_express ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${court.descuento_express ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.08)"}`,
              color: court.descuento_express ? "#FBBf24" : "rgba(255,255,255,0.35)",
            }}
          >
            <Zap size={13} />
            {court.descuento_express ? `Express ${court.descuento_pct}%` : "Express"}
          </button>
        </div>

        {/* Edit / Delete / Horario */}
        <div className="flex items-center gap-2">
          {/* Horario toggle */}
          <button
            onClick={() => setShowSchedule(v => !v)}
            title="Editar horario de atención"
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: showSchedule ? "rgba(200,255,0,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${showSchedule ? "rgba(200,255,0,0.3)" : "rgba(255,255,255,0.08)"}`,
              color: showSchedule ? "#C8FF00" : "rgba(255,255,255,0.4)",
            }}
          >
            <Clock size={13} />
            Horario
            <ChevronDown size={11} style={{ transform: showSchedule ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
          </button>

          <button
            onClick={() => onEdit(court)}
            className="p-2 rounded-lg transition-all hover:bg-white/8 text-rodeo-cream/50 hover:text-white"
            title="Editar cancha"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-2 rounded-lg transition-all font-bold text-xs flex items-center gap-1.5"
            style={{
              background: deleteConfirm ? "rgba(239,68,68,0.15)" : "transparent",
              border: deleteConfirm ? "1px solid rgba(239,68,68,0.3)" : "1px solid transparent",
              color: deleteConfirm ? "#EF4444" : "rgba(255,255,255,0.3)",
            }}
            title={deleteConfirm ? "Confirmar eliminación" : "Eliminar cancha"}
          >
            <Trash2 size={16} />
            {deleteConfirm && <span>Confirmar</span>}
          </button>
        </div>
      </div>

      {/* Panel de horario expandible */}
      <AnimatePresence>
        {showSchedule && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-white/6">
              <p className="text-[10px] font-bold text-rodeo-cream/40 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Clock size={10} className="text-rodeo-lime" />
                Horario de atención semanal
              </p>
              <CourtScheduleEditor courtId={court.id} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CanchasPage() {
  const { user, loading: authLoading } = useAuth();
  const { activeComplexId, setActiveComplexId } = useActiveComplex();

  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);

  // ─── Data fetch ─────────────────────────────────────────────────────────────

  const fetchData = useCallback(async (userId: string) => {
    setLoadingData(true);
    setFetchError(null);

    const { data: complexData, error: complexErr } = await supabase
      .from("complexes")
      .select("id, nombre, owner_id, slug, deporte_principal, deportes, descripcion, imagen_principal, galeria, video_url, lat, lng, ciudad, direccion, telefono, whatsapp, horario_abierto, horario_cierre, dias_abiertos, servicios, precio_promedio, rating_promedio, total_reviews, activo, created_at, updated_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true });

    if (complexErr) {
      setFetchError(complexErr.message);
      setLoadingData(false);
      return;
    }

    const allComplexes = (complexData ?? []) as Complex[];
    setComplexes(allComplexes);

    if (allComplexes.length === 0) {
      setLoadingData(false);
      return;
    }

    const complexIds = allComplexes.map((c) => c.id);
    const { data: courtData, error: courtErr } = await supabase
      .from("courts")
      .select("*")
      .in("complex_id", complexIds)
      .order("created_at", { ascending: true });

    if (courtErr) {
      setFetchError(courtErr.message);
      setLoadingData(false);
      return;
    }

    setCourts((courtData ?? []) as Court[]);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData(user.id);
    } else if (!authLoading && !user) {
      setLoadingData(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id, fetchData]);

  // ─── Derived state ───────────────────────────────────────────────────────────

  const effectiveComplexId = activeComplexId ?? complexes[0]?.id ?? null;
  const visibleCourts = effectiveComplexId
    ? courts.filter((c) => c.complex_id === effectiveComplexId)
    : courts;

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setEditingCourt(null);
    setShowModal(true);
  };

  const handleOpenEdit = (court: Court) => {
    setEditingCourt(court);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCourt(null);
  };

  const handleSaved = (saved: Court) => {
    setCourts((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [...prev, saved];
    });
  };

  const handleToggleActive = async (court: Court) => {
    // Optimistic update
    setCourts((prev) =>
      prev.map((c) => (c.id === court.id ? { ...c, activa: !c.activa } : c))
    );

    const { error } = await supabaseMut
      .from("courts")
      .update({ activa: !court.activa })
      .eq("id", court.id);

    if (error) {
      // Revert on error
      setCourts((prev) =>
        prev.map((c) => (c.id === court.id ? { ...c, activa: court.activa } : c))
      );
    }
  };

  const handleToggleExpress = async (court: Court) => {
    const next = !court.descuento_express;
    const pct = next && court.descuento_pct === 0 ? 20 : court.descuento_pct;
    setCourts((prev) =>
      prev.map((c) => (c.id === court.id ? { ...c, descuento_express: next, descuento_pct: pct } : c))
    );
    const { error } = await supabaseMut
      .from("courts")
      .update({ descuento_express: next, descuento_pct: pct })
      .eq("id", court.id);
    if (error) {
      setCourts((prev) =>
        prev.map((c) => (c.id === court.id ? { ...c, descuento_express: court.descuento_express, descuento_pct: court.descuento_pct } : c))
      );
    }
  };

  const handleDelete = async (courtId: string) => {
    // Optimistic removal
    setCourts((prev) => prev.filter((c) => c.id !== courtId));

    const { error } = await supabaseMut.from("courts").delete().eq("id", courtId);

    if (error) {
      // Revert — refetch
      if (user) fetchData(user.id);
    }
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────

  // Solo mostrar spinner en la carga inicial (cuando no hay datos todavía)
  if ((authLoading || loadingData) && complexes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-2 animate-spin"
            style={{
              borderColor: "rgba(200,255,0,0.2)",
              borderTopColor: "#C8FF00",
            }}
          />
          <p className="text-sm text-rodeo-cream/50">Cargando canchas...</p>
        </div>
      </div>
    );
  }

  // ─── No complexes ────────────────────────────────────────────────────────────

  if (complexes.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader complexes={[]} activeComplexId={null} onSelectComplex={() => {}} onNewCourt={() => {}} />
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px",
            }}
            className="p-10 flex flex-col items-center gap-4 text-center max-w-sm"
          >
            <span className="text-5xl">🏟️</span>
            <p className="text-lg font-black text-white uppercase tracking-tight">Sin complejo registrado</p>
            <p className="text-sm text-rodeo-cream/50 leading-relaxed">
              Primero debés crear un complejo deportivo antes de poder agregar canchas.
            </p>
            <a
              href="/owner/complejo"
              className="mt-2 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-opacity hover:opacity-80"
              style={{ background: "rgba(200,255,0,0.9)", color: "#1A120B" }}
            >
              Crear mi complejo
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      <PageHeader
        complexes={complexes}
        activeComplexId={effectiveComplexId}
        onSelectComplex={setActiveComplexId}
        onNewCourt={handleOpenCreate}
      />

      {fetchError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "12px",
          }}
          className="flex items-center gap-3 p-4"
        >
          <AlertTriangle size={18} style={{ color: "#EF4444", flexShrink: 0 }} />
          <p className="text-sm text-red-400">{fetchError}</p>
        </motion.div>
      )}

      {visibleCourts.length === 0 ? (
        <EmptyState onNewCourt={handleOpenCreate} />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <AnimatePresence>
            {visibleCourts.map((court) => (
              <CourtCard
                key={court.id}
                court={court}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                onToggleExpress={handleToggleExpress}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && effectiveComplexId && (
          <CourtModal
            editingCourt={editingCourt}
            complexId={effectiveComplexId}
            onClose={handleCloseModal}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────

function PageHeader({
  complexes,
  activeComplexId,
  onSelectComplex,
  onNewCourt,
}: {
  complexes: Complex[];
  activeComplexId: string | null;
  onSelectComplex: (id: string) => void;
  onNewCourt: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-rodeo-cream/50 font-bold tracking-widest uppercase mb-1">
            Panel de Propietario
          </p>
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "44px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }} className="text-white">Mis Canchas</h1>
          <p className="text-sm text-rodeo-cream/60 mt-1">
            Gestioná, editá y activá las canchas de tu complejo.
          </p>
        </div>

        <button
          onClick={onNewCourt}
          disabled={complexes.length === 0}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          style={{ background: "rgba(200,255,0,0.9)", color: "#1A120B" }}
        >
          <Plus size={18} />
          Nueva cancha
        </button>
      </div>

      {/* Complex selector tabs (only if > 1 complex) */}
      {complexes.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {complexes.map((complex) => {
            const isActive = complex.id === activeComplexId;
            return (
              <button
                key={complex.id}
                onClick={() => onSelectComplex(complex.id)}
                className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: isActive ? "rgba(200,255,0,0.15)" : "rgba(255,255,255,0.04)",
                  border: isActive
                    ? "1px solid rgba(200,255,0,0.4)"
                    : "1px solid rgba(255,255,255,0.08)",
                  color: isActive ? "#C8FF00" : "rgba(255,255,255,0.55)",
                }}
              >
                {complex.nombre}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onNewCourt }: { onNewCourt: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24"
    >
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
        }}
        className="p-10 flex flex-col items-center gap-4 text-center max-w-sm"
      >
        <span className="text-5xl">⚽</span>
        <p className="text-lg font-black text-white uppercase tracking-tight">
          Todavía no hay canchas
        </p>
        <p className="text-sm text-rodeo-cream/50 leading-relaxed">
          Creá la primera cancha de tu complejo para que los jugadores puedan reservar.
        </p>
        <button
          onClick={onNewCourt}
          className="mt-2 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-opacity hover:opacity-80 flex items-center gap-2"
          style={{ background: "rgba(200,255,0,0.9)", color: "#1A120B" }}
        >
          <Plus size={18} />
          Crear primera cancha
        </button>
      </div>
    </motion.div>
  );
}
