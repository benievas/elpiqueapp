"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, X, Calendar, Clock, MapPin,
  ChevronLeft, Loader, Zap, ChevronDown, AlertCircle, CheckCircle2,
  Trash2, Building2, PlayCircle, Phone, Copy, MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { supabase, supabaseMut } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCityContext } from "@/lib/context/CityContext";
import CityBanner from "@/components/CityBanner";

const DEPORTES = [
  { id: "todos",   label: "Todos",    emoji: "🏅" },
  { id: "futbol",  label: "Fútbol",   emoji: "⚽" },
  { id: "padel",   label: "Pádel",    emoji: "🎾" },
  { id: "tenis",   label: "Tenis",    emoji: "🏸" },
  { id: "voley",   label: "Vóley",    emoji: "🏐" },
  { id: "basquet", label: "Básquet",  emoji: "🏀" },
  { id: "hockey",  label: "Hockey",   emoji: "🏑" },
];

const DEPORTES_FORM = DEPORTES.filter(d => d.id !== "todos");

const DEPORTE_COLOR: Record<string, string> = {
  futbol: "#C8FF00", padel: "#00E5FF", tenis: "#FFD600",
  voley: "#FF6B35", basquet: "#FF4081", hockey: "#A78BFA",
};

interface Jugador {
  user_id: string;
  nombre_display: string | null;
  telefono: string | null;
}

interface Complejo {
  id: string;
  nombre: string;
  ciudad: string;
}

interface Partido {
  id: string;
  deporte: string;
  fecha: string;
  hora_inicio: string;
  ciudad: string;
  descripcion: string | null;
  slots_totales: number;
  slots_ocupados: number;
  estado: string;
  creador_id: string;
  creador_nombre: string | null;
  complex_id: string | null;
  complejo_nombre: string | null;
  fecha_confirmada: boolean;
  jugadores?: Jugador[];
}

interface FormState {
  deporte: string;
  fecha: string;
  hora: string;
  slots: number;
  descripcion: string;
  complex_id: string;
  fecha_confirmada: boolean;
}

const today = new Date().toISOString().split("T")[0];

export default function PartidosPage() {
  const { user, profile } = useAuth();
  const { ciudadCorta, loading: cityLoading } = useCityContext();
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [misPartidos, setMisPartidos] = useState<Set<string>>(new Set());
  const [complejos, setComplejos] = useState<Complejo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [filtroDeporte, setFiltroDeporte] = useState("todos");
  const [phoneModal, setPhoneModal] = useState<{ partido: Partido } | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    deporte: "futbol", fecha: today, hora: "18:00", slots: 10, descripcion: "", complex_id: "", fecha_confirmada: true,
  });

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchComplejos = async (ciudad: string) => {
    const { data } = await supabase
      .from("complexes")
      .select("id, nombre, ciudad")
      .eq("ciudad", ciudad)
      .eq("activo", true)
      .order("nombre");
    setComplejos((data ?? []) as Complejo[]);
  };

  const fetchPartidos = async (ciudad: string) => {
    setLoading(true);
    setFetchError(null);

    const { data, error } = await supabase
      .from("partidos")
      .select("id, deporte, fecha, hora_inicio, ciudad, descripcion, slots_totales, slots_ocupados, estado, creador_id, complex_id, fecha_confirmada")
      .eq("ciudad", ciudad)
      .in("estado", ["abierto", "completo"])
      .gte("fecha", today)
      .order("fecha", { ascending: true })
      .order("hora_inicio", { ascending: true })
      .limit(50);

    if (error) {
      setFetchError(`Error al cargar partidos (${error.code}): ${error.message}`);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as any[];

    // Nombres de creadores
    const creadorIds = [...new Set(rows.map(p => p.creador_id).filter(Boolean))];
    let perfilMap: Record<string, string> = {};
    if (creadorIds.length) {
      const { data: perfiles } = await supabase
        .from("profiles").select("id, nombre_completo").in("id", creadorIds);
      perfilMap = Object.fromEntries((perfiles ?? []).map((p: any) => [p.id, p.nombre_completo]));
    }

    // Nombres de complejos
    const complexIds = [...new Set(rows.map(p => p.complex_id).filter(Boolean))];
    let complejoMap: Record<string, string> = {};
    if (complexIds.length) {
      const { data: cxs } = await supabase
        .from("complexes").select("id, nombre").in("id", complexIds);
      complejoMap = Object.fromEntries((cxs ?? []).map((c: any) => [c.id, c.nombre]));
    }

    // Jugadores inscritos
    const partidoIds = rows.map(p => p.id);
    let jugadoresMap: Record<string, Jugador[]> = {};
    if (partidoIds.length) {
      const { data: jugadores } = await supabase
        .from("partido_jugadores").select("partido_id, user_id, nombre_display, telefono").in("partido_id", partidoIds);
      for (const j of (jugadores ?? []) as any[]) {
        if (!jugadoresMap[j.partido_id]) jugadoresMap[j.partido_id] = [];
        jugadoresMap[j.partido_id].push({ user_id: j.user_id, nombre_display: j.nombre_display, telefono: j.telefono ?? null });
      }
    }

    setPartidos(rows.map(p => ({
      ...p,
      creador_nombre: perfilMap[p.creador_id] ?? null,
      complejo_nombre: p.complex_id ? (complejoMap[p.complex_id] ?? null) : null,
      fecha_confirmada: p.fecha_confirmada !== false,
      jugadores: jugadoresMap[p.id] ?? [],
    })));
    setLoading(false);
  };

  const fetchMisPartidos = async (userId: string) => {
    const { data } = await supabase
      .from("partido_jugadores").select("partido_id").eq("user_id", userId);
    setMisPartidos(new Set((data ?? []).map((r: any) => r.partido_id)));
  };

  useEffect(() => {
    if (cityLoading) return;
    fetchPartidos(ciudadCorta);
    fetchComplejos(ciudadCorta);
  }, [ciudadCorta, cityLoading]);

  useEffect(() => {
    if (user?.id) fetchMisPartidos(user.id);
  }, [user?.id]);

  const handleCreate = async () => {
    if (!user?.id) return;
    setCreateError(null);
    setSaving(true);

    const { data, error } = await supabaseMut
      .from("partidos")
      .insert({
        creador_id: user.id,
        deporte: form.deporte,
        fecha: form.fecha,
        hora_inicio: form.hora,
        ciudad: ciudadCorta,
        descripcion: form.descripcion.trim() || null,
        slots_totales: form.slots,
        slots_ocupados: 1,
        complex_id: form.complex_id || null,
        fecha_confirmada: form.fecha_confirmada,
      })
      .select("id")
      .single();

    if (error || !data) {
      setCreateError(error?.message ?? "Error al crear el partido. Intentá de nuevo.");
      setSaving(false);
      return;
    }

    await supabaseMut.from("partido_jugadores").insert({
      partido_id: data.id,
      user_id: user.id,
      nombre_display: profile?.nombre_completo ?? null,
      telefono: profile?.telefono ?? null,
    });

    setMisPartidos(prev => new Set([...prev, data.id]));
    setModalOpen(false);
    setSaving(false);
    setForm({ deporte: "futbol", fecha: today, hora: "18:00", slots: 10, descripcion: "", complex_id: "" });
    showToast("¡Partido publicado!");
    fetchPartidos(ciudadCorta);
  };

  const doJoin = async (partido: Partido, telefono: string | null) => {
    setJoinLoading(partido.id);
    const { error: pjErr } = await supabaseMut.from("partido_jugadores").insert({
      partido_id: partido.id,
      user_id: user!.id,
      nombre_display: profile?.nombre_completo ?? null,
      telefono,
    });
    if (pjErr) { showToast(pjErr.message, "err"); setJoinLoading(null); return; }
    showToast("¡Te uniste al partido!");
    setMisPartidos(prev => new Set([...prev, partido.id]));
    setJoinLoading(null);
    fetchPartidos(ciudadCorta);
  };

  const handleJoin = async (partido: Partido) => {
    if (!user?.id) return;
    if (!profile?.telefono) {
      setPhoneInput("");
      setPhoneModal({ partido });
      return;
    }
    doJoin(partido, profile.telefono);
  };

  const handleJoinWithPhone = async () => {
    if (!phoneModal || !user?.id) return;
    const tel = phoneInput.trim().replace(/\D/g, "");
    if (!tel || tel.length < 8) { showToast("Ingresá un número válido", "err"); return; }
    setPhoneLoading(true);
    await supabaseMut.from("profiles").update({ telefono: tel }).eq("id", user.id);
    setPhoneModal(null);
    setPhoneLoading(false);
    doJoin(phoneModal.partido, tel);
  };

  const handleLeave = async (partido: Partido) => {
    if (!user?.id) return;
    setJoinLoading(partido.id);

    await supabaseMut.from("partido_jugadores").delete()
      .eq("partido_id", partido.id).eq("user_id", user.id);
    // El trigger sync_partido_slots actualiza slots_ocupados y estado automáticamente

    setMisPartidos(prev => { const s = new Set(prev); s.delete(partido.id); return s; });
    setJoinLoading(null);
    showToast("Saliste del partido");
    fetchPartidos(ciudadCorta);
  };

  const handleConfirmarConLosQueEstan = async (partido: Partido) => {
    if (!user?.id || partido.creador_id !== user.id) return;
    setCancelling(partido.id);
    await supabaseMut.from("partidos").update({ estado: "completo" }).eq("id", partido.id);
    showToast("¡Partido confirmado con los jugadores actuales!");
    setCancelling(null);
    fetchPartidos(ciudadCorta);
  };

  const handleCancel = async (partido: Partido) => {
    if (!user?.id || partido.creador_id !== user.id) return;
    if (!confirm("¿Cancelar este partido? Los jugadores inscriptos serán notificados.")) return;
    setCancelling(partido.id);

    await supabaseMut.from("partido_jugadores").delete().eq("partido_id", partido.id);
    await supabaseMut.from("partidos").update({ estado: "cancelado" }).eq("id", partido.id);

    showToast("Partido cancelado");
    setCancelling(null);
    fetchPartidos(ciudadCorta);
  };

  const fmtFecha = (fecha: string) =>
    new Date(fecha + "T12:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });

  const fmtHora = (hora: string) => hora.slice(0, 5);

  const partidosFiltrados = filtroDeporte === "todos"
    ? partidos
    : partidos.filter(p => p.deporte === filtroDeporte);

  return (
    <div className="min-h-screen bg-rodeo-dark pb-32">
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
            <ChevronLeft size={20} className="text-rodeo-cream/50" />
          </Link>
          <div className="flex-1">
            <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40">Deporte social</p>
            <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "36px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }}
              className="text-white"><span className="section-slash">/</span>Armá Partido</h1>
          </div>
          {user ? (
            <motion.button
              onClick={() => { setCreateError(null); setModalOpen(true); }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-black text-sm"
              style={{ background: "#C8FF00", color: "#1A120B" }}>
              <Plus size={16} /> Crear
            </motion.button>
          ) : (
            <Link href="/login"
              className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-black text-sm"
              style={{ background: "rgba(200,255,0,0.12)", border: "1px solid rgba(200,255,0,0.25)", color: "#C8FF00" }}>
              Ingresar
            </Link>
          )}
        </div>

        <CityBanner />

        <p className="text-xs text-rodeo-cream/40 leading-relaxed">
          Publicá que te falta gente para jugar. Cuando se completan los cupos aparece el link de WhatsApp para coordinar.
        </p>

        {/* Filtros por deporte */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {DEPORTES.map(d => {
            const active = filtroDeporte === d.id;
            const color = d.id === "todos" ? "#C8FF00" : DEPORTE_COLOR[d.id];
            return (
              <button key={d.id} onClick={() => setFiltroDeporte(d.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
                style={{
                  background: active ? `${color}20` : "rgba(255,255,255,0.05)",
                  border: `1px solid ${active ? color + "50" : "rgba(255,255,255,0.08)"}`,
                  color: active ? color : "rgba(225,212,194,0.5)",
                }}>
                {d.emoji} {d.label}
                {d.id !== "todos" && partidos.filter(p => p.deporte === d.id).length > 0 && (
                  <span className="ml-0.5 text-[10px] opacity-60">
                    {partidos.filter(p => p.deporte === d.id).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Error de carga */}
        {fetchError && (
          <div className="flex items-start gap-2 p-3 rounded-[12px] text-xs"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}>
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{fetchError}</span>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader size={24} className="animate-spin text-rodeo-lime/50" />
          </div>
        ) : partidosFiltrados.length === 0 ? (
          <div className="liquid-panel p-10 text-center space-y-3">
            <Users size={32} className="text-rodeo-cream/20 mx-auto" />
            <p className="text-rodeo-cream/50 text-sm">
              {filtroDeporte === "todos"
                ? `No hay partidos abiertos en ${ciudadCorta}.`
                : `No hay partidos de ${DEPORTES.find(d => d.id === filtroDeporte)?.label} en ${ciudadCorta}.`}
            </p>
            {user
              ? <button onClick={() => setModalOpen(true)} className="text-xs text-rodeo-lime font-bold hover:underline">Creá el primero →</button>
              : <Link href="/login" className="text-xs text-rodeo-lime font-bold hover:underline">Iniciá sesión para crear uno →</Link>
            }
          </div>
        ) : (
          <div className="space-y-3">
            {partidosFiltrados.map(partido => {
              const color = DEPORTE_COLOR[partido.deporte] ?? "#C8FF00";
              const isIn = misPartidos.has(partido.id);
              const isFull = partido.estado === "completo";
              const isCreador = partido.creador_id === user?.id;
              const pct = Math.round((partido.slots_ocupados / partido.slots_totales) * 100);
              const isExpanded = expandedId === partido.id || isFull;

              return (
                <motion.div key={partido.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${isFull ? "rgba(200,255,0,0.2)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "16px",
                    borderLeft: `4px solid ${color}`,
                  }}
                  className="p-4 flex flex-col gap-3">

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-black" style={{ color }}>
                          {DEPORTES.find(d => d.id === partido.deporte)?.emoji} {DEPORTES.find(d => d.id === partido.deporte)?.label ?? partido.deporte}
                        </span>
                        {isFull && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(200,255,0,0.15)", color: "#C8FF00", border: "1px solid rgba(200,255,0,0.3)" }}>
                            COMPLETO
                          </span>
                        )}
                        {isIn && !isCreador && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(96,165,250,0.12)", color: "#60A5FA", border: "1px solid rgba(96,165,250,0.25)" }}>
                            INSCRIPTO
                          </span>
                        )}
                        {isCreador && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(225,212,194,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            TU PARTIDO
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-rodeo-cream/50 flex-wrap">
                        {partido.fecha_confirmada
                          ? <span className="flex items-center gap-1"><Calendar size={11} />{fmtFecha(partido.fecha)}</span>
                          : <span className="flex items-center gap-1 text-amber-400/80"><Calendar size={11} />A confirmar fecha</span>
                        }
                        <span className="flex items-center gap-1"><Clock size={11} />{fmtHora(partido.hora_inicio)}</span>
                        {partido.complejo_nombre
                          ? <span className="flex items-center gap-1 text-rodeo-lime/70"><Building2 size={11} />{partido.complejo_nombre}</span>
                          : <span className="flex items-center gap-1 text-amber-400/80"><MapPin size={11} />A confirmar lugar</span>
                        }
                      </div>
                      {partido.descripcion && (
                        <p className="text-xs text-rodeo-cream/40 mt-1.5 leading-relaxed line-clamp-2">{partido.descripcion}</p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {isCreador ? (
                        <div className="flex flex-col gap-1.5 items-end">
                          {!isFull && partido.slots_ocupados >= 2 && (
                            <button
                              onClick={() => handleConfirmarConLosQueEstan(partido)}
                              disabled={cancelling === partido.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-xs font-bold transition-all disabled:opacity-50"
                              style={{ background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.3)", color: "#C8FF00" }}>
                              {cancelling === partido.id ? <Loader size={11} className="animate-spin" /> : <PlayCircle size={11} />}
                              Arrancar igual
                            </button>
                          )}
                          <button
                            onClick={() => handleCancel(partido)}
                            disabled={cancelling === partido.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-xs font-bold transition-all disabled:opacity-50"
                            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
                            {cancelling === partido.id ? <Loader size={11} className="animate-spin" /> : <Trash2 size={11} />}
                            Cancelar
                          </button>
                        </div>
                      ) : user ? (
                        isFull && !isIn ? (
                          <span className="text-xs text-rodeo-cream/30 pt-1">Lleno</span>
                        ) : (
                          <button
                            onClick={() => isIn ? handleLeave(partido) : handleJoin(partido)}
                            disabled={joinLoading === partido.id}
                            className="px-3 py-2 rounded-[10px] text-xs font-black transition-all disabled:opacity-50"
                            style={isIn
                              ? { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }
                              : { background: "rgba(200,255,0,0.12)", border: "1px solid rgba(200,255,0,0.3)", color: "#C8FF00" }
                            }>
                            {joinLoading === partido.id ? <Loader size={12} className="animate-spin" /> : isIn ? "Salir" : "Unirme"}
                          </button>
                        )
                      ) : (
                        <Link href="/login"
                          className="px-3 py-2 rounded-[10px] text-xs font-black"
                          style={{ background: "rgba(200,255,0,0.08)", border: "1px solid rgba(200,255,0,0.2)", color: "#C8FF00" }}>
                          Ingresar
                        </Link>
                      )}
                      {/* Toggle lista jugadores */}
                      {(partido.jugadores?.length ?? 0) > 0 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : partido.id)}
                          className="flex items-center gap-1 text-[10px] text-rodeo-cream/30 hover:text-rodeo-cream/60 transition-colors">
                          <Users size={10} /> ver jugadores
                          <ChevronDown size={10} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-rodeo-cream/40">
                      <span className="flex items-center gap-1">
                        <Users size={10} />{partido.slots_ocupados}/{partido.slots_totales} jugadores
                      </span>
                      {partido.creador_nombre && <span>por {partido.creador_nombre}</span>}
                    </div>
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        style={{ background: isFull ? "#C8FF00" : color, opacity: 0.75 }} />
                    </div>
                  </div>

                  {/* Lista de jugadores expandida */}
                  <AnimatePresence>
                    {isExpanded && partido.jugadores && partido.jugadores.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="pt-2 border-t border-white/8">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-rodeo-cream/30 mb-2">Inscriptos</p>
                          <div className="flex flex-wrap gap-1.5">
                            {partido.jugadores.map((j, i) => (
                              <span key={j.user_id ?? i}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  background: "rgba(255,255,255,0.06)",
                                  color: j.user_id === user?.id ? color : "rgba(225,212,194,0.6)",
                                  border: `1px solid ${j.user_id === user?.id ? color + "40" : "rgba(255,255,255,0.08)"}`,
                                }}>
                                {j.nombre_display ?? "Jugador"}
                                {j.user_id === partido.creador_id && " 👑"}
                              </span>
                            ))}
                            {/* Slots vacíos */}
                            {Array.from({ length: partido.slots_totales - partido.slots_ocupados }).map((_, i) => (
                              <span key={`empty-${i}`}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: "rgba(255,255,255,0.03)", color: "rgba(225,212,194,0.2)", border: "1px dashed rgba(255,255,255,0.08)" }}>
                                libre
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Panel coordinación — estado completo */}
                  {partido.estado === "completo" && (isIn || isCreador) && (() => {
                    const deporteEmoji = DEPORTES.find(d => d.id === partido.deporte)?.emoji ?? "⚽";
                    const lugar = partido.complejo_nombre ? `${partido.complejo_nombre}, ${partido.ciudad}` : partido.ciudad;
                    const msgBase = `${deporteEmoji} PARTIDO DE ${partido.deporte.toUpperCase()}\n📅 ${fmtFecha(partido.fecha)} a las ${fmtHora(partido.hora_inicio)}\n📍 ${lugar}\n👥 Somos ${partido.slots_ocupados} jugadores. ¡Nos vemos!`;
                    return (
                      <div style={{ background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: 12 }} className="p-3 space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                          <p className="text-xs font-black text-green-400">¡Partido armado! Coordiná con el grupo</p>
                        </div>

                        {/* Jugadores con teléfonos (visible para el creador) */}
                        {isCreador && partido.jugadores && partido.jugadores.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-rodeo-cream/30">Jugadores inscriptos</p>
                            {partido.jugadores.map((j, i) => (
                              <div key={j.user_id ?? i} className="flex items-center justify-between gap-2">
                                <span className="text-xs text-rodeo-cream/70 truncate">
                                  {j.nombre_display ?? "Jugador"}
                                  {j.user_id === partido.creador_id && " 👑"}
                                </span>
                                {j.telefono && j.user_id !== user?.id && (
                                  <a href={`https://wa.me/549${j.telefono.replace(/\D/g,"")}?text=${encodeURIComponent(msgBase)}`}
                                    target="_blank" rel="noopener noreferrer"
                                    style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: 8 }}
                                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-green-400 shrink-0">
                                    <MessageCircle size={10} /> WA
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Botones de acción */}
                        <div className="flex gap-2">
                          <a href={`https://wa.me/?text=${encodeURIComponent(msgBase)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] font-black text-xs transition-all"
                            style={{ background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.35)", color: "#25D366" }}>
                            <Zap size={12} /> Compartir info
                          </a>
                          <button
                            onClick={() => { navigator.clipboard?.writeText(msgBase); showToast("¡Copiado!"); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-xs font-bold transition-all"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(225,212,194,0.6)" }}>
                            <Copy size={12} /> Copiar
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal teléfono */}
      <AnimatePresence>
        {phoneModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md" onClick={() => setPhoneModal(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div style={{ background: "linear-gradient(160deg,#0D1F10,#0A1A0D)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, width: "100%", maxWidth: 360 }}
                className="p-6 space-y-4">
                <div>
                  <p className="text-base font-black text-white">¡Casi listo!</p>
                  <p className="text-xs text-rodeo-cream/50 mt-1">Para que el creador del partido pueda coordinarte por WhatsApp necesitamos tu número.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-rodeo-cream/40">Tu número de WhatsApp</label>
                  <input
                    type="tel" placeholder="Ej: 3834123456" value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "white", padding: "10px 14px", width: "100%", fontSize: 15 }}
                    className="focus:outline-none focus:border-rodeo-lime/40"
                    autoFocus
                  />
                  <p className="text-[10px] text-rodeo-cream/30">Solo se comparte con el organizador del partido</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPhoneModal(null)}
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }}
                    className="flex-1 py-2.5 text-sm font-bold text-rodeo-cream/50">
                    Cancelar
                  </button>
                  <button onClick={handleJoinWithPhone} disabled={phoneLoading}
                    style={{ background: "#C8FF00", borderRadius: 10 }}
                    className="flex-1 py-2.5 text-sm font-black text-rodeo-dark disabled:opacity-50 flex items-center justify-center gap-2">
                    {phoneLoading ? <Loader size={14} className="animate-spin" /> : <Phone size={14} />}
                    Unirme
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold shadow-xl"
            style={toast.type === "ok"
              ? { background: "rgba(200,255,0,0.15)", border: "1px solid rgba(200,255,0,0.35)", color: "#C8FF00" }
              : { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", color: "#EF4444" }}>
            {toast.type === "ok" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal crear partido */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md" onClick={() => setModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 md:inset-0 md:flex md:items-center md:justify-center">
              <div style={{ background: "linear-gradient(160deg, #0D1F10 0%, #0A1A0D 100%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px 24px 0 0", maxHeight: "92vh" }}
                className="w-full md:max-w-md md:rounded-3xl overflow-y-auto flex flex-col">
                <div className="p-6 border-b border-white/8 flex items-center justify-between sticky top-0 z-10"
                  style={{ background: "rgba(13,31,16,0.95)", backdropFilter: "blur(12px)" }}>
                  <div>
                    <h3 className="text-lg font-black text-white">Nuevo partido</h3>
                    <p className="text-xs text-rodeo-cream/50 mt-0.5">Publicá y esperá que se completen los cupos</p>
                  </div>
                  <button onClick={() => setModalOpen(false)}
                    style={{ background: "rgba(255,255,255,0.08)", borderRadius: "10px" }}
                    className="w-9 h-9 flex items-center justify-center hover:bg-white/15 transition-all">
                    <X size={16} className="text-white" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {createError && (
                    <div className="flex items-start gap-2 p-3 rounded-[10px] text-xs"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}>
                      <AlertCircle size={14} className="shrink-0 mt-0.5" /><span>{createError}</span>
                    </div>
                  )}

                  {/* Deporte */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-rodeo-cream/50 block mb-2">Deporte</label>
                    <div className="grid grid-cols-3 gap-2">
                      {DEPORTES_FORM.map(d => (
                        <button key={d.id} onClick={() => setForm(f => ({ ...f, deporte: d.id }))}
                          className="p-3 rounded-[12px] text-sm font-bold transition-all text-center"
                          style={{
                            background: form.deporte === d.id ? `${DEPORTE_COLOR[d.id]}20` : "rgba(255,255,255,0.05)",
                            border: `1px solid ${form.deporte === d.id ? DEPORTE_COLOR[d.id] + "60" : "rgba(255,255,255,0.08)"}`,
                            color: form.deporte === d.id ? DEPORTE_COLOR[d.id] : "rgba(225,212,194,0.6)",
                          }}>
                          {d.emoji} {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Complejo (opcional) */}
                  {complejos.length > 0 && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-rodeo-cream/50 block mb-1.5">
                        Complejo donde juegan <span className="normal-case text-rodeo-cream/30">(opcional)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setForm(f => ({ ...f, complex_id: "" }))}
                          className="px-3 py-1.5 rounded-[8px] text-xs font-bold transition-all"
                          style={{
                            background: form.complex_id === "" ? "rgba(200,255,0,0.1)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${form.complex_id === "" ? "rgba(200,255,0,0.3)" : "rgba(255,255,255,0.08)"}`,
                            color: form.complex_id === "" ? "#C8FF00" : "rgba(225,212,194,0.5)",
                          }}>
                          Sin definir
                        </button>
                        {complejos.map(c => (
                          <button key={c.id}
                            onClick={() => setForm(f => ({ ...f, complex_id: c.id }))}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-xs font-bold transition-all"
                            style={{
                              background: form.complex_id === c.id ? "rgba(200,255,0,0.1)" : "rgba(255,255,255,0.04)",
                              border: `1px solid ${form.complex_id === c.id ? "rgba(200,255,0,0.3)" : "rgba(255,255,255,0.08)"}`,
                              color: form.complex_id === c.id ? "#C8FF00" : "rgba(225,212,194,0.5)",
                            }}>
                            <Building2 size={10} />{c.nombre}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fecha y hora */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3" style={{ opacity: form.fecha_confirmada ? 1 : 0.4, pointerEvents: form.fecha_confirmada ? "auto" : "none" }}>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-rodeo-cream/50 block mb-1.5">Fecha</label>
                        <input type="date" value={form.fecha} min={today}
                          onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "white", padding: "10px 12px", width: "100%", fontSize: "14px" }}
                          className="focus:outline-none focus:border-rodeo-lime/40 transition-all" />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-rodeo-cream/50 block mb-1.5">Hora</label>
                        <input type="time" value={form.hora}
                          onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "white", padding: "10px 12px", width: "100%", fontSize: "14px" }}
                          className="focus:outline-none focus:border-rodeo-lime/40 transition-all" />
                      </div>
                    </div>
                    <button onClick={() => setForm(f => ({ ...f, fecha_confirmada: !f.fecha_confirmada }))}
                      className="flex items-center gap-2 text-xs font-bold transition-all"
                      style={{ color: form.fecha_confirmada ? "rgba(225,212,194,0.4)" : "#FBBF24" }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${form.fecha_confirmada ? "rgba(255,255,255,0.2)" : "#FBBF24"}`, background: form.fecha_confirmada ? "transparent" : "rgba(251,191,36,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {!form.fecha_confirmada && <span style={{ fontSize: 9, color: "#FBBF24" }}>✓</span>}
                      </div>
                      Fecha a confirmar con los jugadores
                    </button>
                  </div>

                  {/* Cupos */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-rodeo-cream/50 block mb-1.5">
                      Jugadores necesarios: <span style={{ color: DEPORTE_COLOR[form.deporte] }}>{form.slots}</span>
                    </label>
                    <input type="range" min={2} max={22} value={form.slots}
                      onChange={e => setForm(f => ({ ...f, slots: Number(e.target.value) }))}
                      className="w-full accent-rodeo-lime" />
                    <div className="flex justify-between text-[10px] text-rodeo-cream/30 mt-1">
                      <span>2 mín</span><span>22 máx</span>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-rodeo-cream/50 block mb-1.5">
                      Descripción <span className="normal-case text-rodeo-cream/30">(opcional)</span>
                    </label>
                    <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                      placeholder="Ej: Fútbol 5 en el complejo del centro, llevá pechera..."
                      rows={3} maxLength={200}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "white", padding: "10px 12px", width: "100%", fontSize: "14px", resize: "none" }}
                      className="focus:outline-none focus:border-rodeo-lime/40 transition-all placeholder-rodeo-cream/25" />
                    <p className="text-[10px] text-rodeo-cream/25 mt-1 text-right">{form.descripcion.length}/200</p>
                  </div>

                  <motion.button onClick={handleCreate} disabled={saving}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 rounded-[14px] font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: "#C8FF00", color: "#1A120B" }}>
                    {saving ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                    {saving ? "Publicando..." : "Publicar partido"}
                  </motion.button>

                  <p className="text-center text-[10px] text-rodeo-cream/25">
                    Quedás inscripto automáticamente como organizador del partido.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
