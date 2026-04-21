"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, X, Calendar, Clock, MapPin, ChevronLeft, Loader, Zap } from "lucide-react";
import Link from "next/link";
import { supabase, supabaseMut } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCityContext } from "@/lib/context/CityContext";
import CityBanner from "@/components/CityBanner";

const DEPORTES = [
  { id: "futbol",  label: "Fútbol",  emoji: "⚽" },
  { id: "padel",   label: "Pádel",   emoji: "🎾" },
  { id: "tenis",   label: "Tenis",   emoji: "🏸" },
  { id: "voley",   label: "Vóley",   emoji: "🏐" },
  { id: "basquet", label: "Básquet", emoji: "🏀" },
  { id: "hockey",  label: "Hockey",  emoji: "🏑" },
];

const DEPORTE_COLOR: Record<string, string> = {
  futbol: "#C8FF00", padel: "#00E5FF", tenis: "#FFD600",
  voley: "#FF6B35", basquet: "#FF4081", hockey: "#A78BFA",
};

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
}

interface FormState {
  deporte: string;
  fecha: string;
  hora: string;
  slots: number;
  descripcion: string;
}

const today = new Date().toISOString().split("T")[0];

export default function PartidosPage() {
  const { user, profile } = useAuth();
  const { ciudadCorta, loading: cityLoading } = useCityContext();
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [misPartidos, setMisPartidos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [joinLoading, setJoinLoading] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    deporte: "futbol", fecha: today, hora: "18:00", slots: 10, descripcion: "",
  });

  const fetchPartidos = async (ciudad: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("partidos")
      .select("id, deporte, fecha, hora_inicio, ciudad, descripcion, slots_totales, slots_ocupados, estado, creador_id, profiles(nombre_completo)")
      .eq("ciudad", ciudad)
      .in("estado", ["abierto", "completo"])
      .gte("fecha", today)
      .order("fecha", { ascending: true })
      .order("hora_inicio", { ascending: true })
      .limit(30);

    setPartidos(
      (data ?? []).map((p: any) => ({
        ...p,
        creador_nombre: p.profiles?.nombre_completo ?? null,
      }))
    );
    setLoading(false);
  };

  const fetchMisPartidos = async (userId: string) => {
    const { data } = await supabase
      .from("partido_jugadores")
      .select("partido_id")
      .eq("user_id", userId);
    setMisPartidos(new Set((data ?? []).map((r: any) => r.partido_id)));
  };

  useEffect(() => {
    if (cityLoading) return;
    fetchPartidos(ciudadCorta);
  }, [ciudadCorta, cityLoading]);

  useEffect(() => {
    if (user?.id) fetchMisPartidos(user.id);
  }, [user?.id]);

  const handleCreate = async () => {
    if (!user?.id) return;
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
      })
      .select("id")
      .single();

    if (!error && data) {
      await supabaseMut.from("partido_jugadores").insert({
        partido_id: data.id,
        user_id: user.id,
        nombre_display: profile?.nombre_completo ?? null,
        telefono: profile?.telefono ?? null,
      });
      setMisPartidos(prev => new Set([...prev, data.id]));
      setModalOpen(false);
      fetchPartidos(ciudadCorta);
    }
    setSaving(false);
  };

  const handleJoin = async (partido: Partido) => {
    if (!user?.id) return;
    setJoinLoading(partido.id);
    await supabaseMut.from("partido_jugadores").insert({
      partido_id: partido.id,
      user_id: user.id,
      nombre_display: profile?.nombre_completo ?? null,
      telefono: profile?.telefono ?? null,
    });
    await supabaseMut.from("partidos").update({
      slots_ocupados: partido.slots_ocupados + 1,
      estado: partido.slots_ocupados + 1 >= partido.slots_totales ? "completo" : "abierto",
    }).eq("id", partido.id);
    setMisPartidos(prev => new Set([...prev, partido.id]));
    setPartidos(prev => prev.map(p => p.id === partido.id
      ? { ...p, slots_ocupados: p.slots_ocupados + 1, estado: p.slots_ocupados + 1 >= p.slots_totales ? "completo" : "abierto" }
      : p
    ));
    setJoinLoading(null);
  };

  const handleLeave = async (partido: Partido) => {
    if (!user?.id) return;
    setJoinLoading(partido.id);
    await supabaseMut.from("partido_jugadores").delete()
      .eq("partido_id", partido.id).eq("user_id", user.id);
    await supabaseMut.from("partidos").update({
      slots_ocupados: Math.max(1, partido.slots_ocupados - 1),
      estado: "abierto",
    }).eq("id", partido.id);
    setMisPartidos(prev => { const s = new Set(prev); s.delete(partido.id); return s; });
    setPartidos(prev => prev.map(p => p.id === partido.id
      ? { ...p, slots_ocupados: Math.max(1, p.slots_ocupados - 1), estado: "abierto" }
      : p
    ));
    setJoinLoading(null);
  };

  const fmtFecha = (fecha: string) =>
    new Date(fecha + "T12:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });

  const fmtHora = (hora: string) => hora.slice(0, 5);

  return (
    <div className="min-h-screen bg-rodeo-dark pb-32">
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">

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
          {user && (
            <motion.button
              onClick={() => setModalOpen(true)}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-black text-sm"
              style={{ background: "#C8FF00", color: "#1A120B" }}
            >
              <Plus size={16} /> Crear
            </motion.button>
          )}
        </div>

        <CityBanner />

        <p className="text-xs text-rodeo-cream/40 leading-relaxed">
          Publicá que te falta gente para jugar. Cuando se completan los cupos, te armamos el link de WhatsApp para coordinar.
        </p>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader size={24} className="animate-spin text-rodeo-lime/50" />
          </div>
        ) : partidos.length === 0 ? (
          <div className="liquid-panel p-10 text-center space-y-3">
            <Users size={32} className="text-rodeo-cream/20 mx-auto" />
            <p className="text-rodeo-cream/50 text-sm">No hay partidos abiertos en {ciudadCorta}.</p>
            {user
              ? <button onClick={() => setModalOpen(true)} className="text-xs text-rodeo-lime font-bold hover:underline">Creá el primero →</button>
              : <Link href="/login" className="text-xs text-rodeo-lime font-bold hover:underline">Iniciá sesión para crear uno →</Link>
            }
          </div>
        ) : (
          <div className="space-y-3">
            {partidos.map(partido => {
              const color = DEPORTE_COLOR[partido.deporte] ?? "#C8FF00";
              const isIn = misPartidos.has(partido.id);
              const isFull = partido.estado === "completo";
              const isCreador = partido.creador_id === user?.id;
              const pct = Math.round((partido.slots_ocupados / partido.slots_totales) * 100);

              return (
                <motion.div key={partido.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${isFull ? "rgba(200,255,0,0.25)" : "rgba(255,255,255,0.08)"}`, borderRadius: "16px", borderLeft: `4px solid ${color}` }}
                  className="p-4 flex flex-col gap-3">

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-black" style={{ color }}>
                          {DEPORTES.find(d => d.id === partido.deporte)?.emoji} {DEPORTES.find(d => d.id === partido.deporte)?.label ?? partido.deporte}
                        </span>
                        {isFull && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(200,255,0,0.15)", color: "#C8FF00", border: "1px solid rgba(200,255,0,0.3)" }}>
                            COMPLETO
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-rodeo-cream/50">
                        <span className="flex items-center gap-1"><Calendar size={11} />{fmtFecha(partido.fecha)}</span>
                        <span className="flex items-center gap-1"><Clock size={11} />{fmtHora(partido.hora_inicio)}</span>
                        <span className="flex items-center gap-1"><MapPin size={11} />{partido.ciudad}</span>
                      </div>
                      {partido.descripcion && (
                        <p className="text-xs text-rodeo-cream/40 mt-1.5 leading-relaxed line-clamp-2">{partido.descripcion}</p>
                      )}
                    </div>

                    {/* Acción */}
                    {user && !isCreador && (
                      isFull && !isIn ? (
                        <span className="text-xs text-rodeo-cream/30 shrink-0 pt-1">Lleno</span>
                      ) : (
                        <button
                          onClick={() => isIn ? handleLeave(partido) : handleJoin(partido)}
                          disabled={joinLoading === partido.id}
                          className="shrink-0 px-3 py-2 rounded-[10px] text-xs font-black transition-all disabled:opacity-50"
                          style={isIn
                            ? { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }
                            : { background: "rgba(200,255,0,0.12)", border: "1px solid rgba(200,255,0,0.3)", color: "#C8FF00" }
                          }
                        >
                          {joinLoading === partido.id ? <Loader size={12} className="animate-spin" /> : isIn ? "Salir" : "Unirme"}
                        </button>
                      )
                    )}
                  </div>

                  {/* Barra de progreso de cupos */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-rodeo-cream/40">
                      <span className="flex items-center gap-1"><Users size={10} />{partido.slots_ocupados}/{partido.slots_totales} jugadores</span>
                      {partido.creador_nombre && <span>por {partido.creador_nombre}</span>}
                    </div>
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: isFull ? "#C8FF00" : color, opacity: 0.7 }} />
                    </div>
                  </div>

                  {/* WhatsApp CTA cuando está completo y el usuario está adentro */}
                  {isFull && isIn && (
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`⚽ PARTIDO DE ${partido.deporte.toUpperCase()} — ${fmtFecha(partido.fecha)} ${fmtHora(partido.hora_inicio)}\n📍 ${partido.ciudad}\n\nSomos ${partido.slots_totales} jugadores. ¡Nos vemos!`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-2.5 rounded-[10px] font-black text-xs transition-all"
                      style={{ background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.35)", color: "#25D366" }}
                    >
                      <Zap size={13} /> Compartir por WhatsApp
                    </a>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal crear partido */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md" onClick={() => setModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 md:inset-0 md:flex md:items-center md:justify-center"
            >
              <div style={{ background: "linear-gradient(160deg, #0D1F10 0%, #0A1A0D 100%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px 24px 0 0", maxHeight: "90vh" }}
                className="w-full md:max-w-md md:rounded-3xl overflow-y-auto flex flex-col">
                <div className="p-6 border-b border-white/8 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white">Nuevo partido</h3>
                    <p className="text-xs text-rodeo-cream/50 mt-0.5">Publicá y esperá que se completen los cupos</p>
                  </div>
                  <button onClick={() => setModalOpen(false)} style={{ background: "rgba(255,255,255,0.08)", borderRadius: "10px" }}
                    className="w-9 h-9 flex items-center justify-center hover:bg-white/15 transition-all">
                    <X size={16} className="text-white" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Deporte */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-rodeo-cream/50 block mb-2">Deporte</label>
                    <div className="grid grid-cols-3 gap-2">
                      {DEPORTES.map(d => (
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

                  {/* Fecha y hora */}
                  <div className="grid grid-cols-2 gap-3">
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

                  {/* Cupos */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-rodeo-cream/50 block mb-1.5">
                      Jugadores necesarios: <span className="text-rodeo-lime">{form.slots}</span>
                    </label>
                    <input type="range" min={2} max={22} value={form.slots}
                      onChange={e => setForm(f => ({ ...f, slots: Number(e.target.value) }))}
                      className="w-full accent-rodeo-lime" />
                    <div className="flex justify-between text-[10px] text-rodeo-cream/30 mt-1">
                      <span>2</span><span>22</span>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-rodeo-cream/50 block mb-1.5">Descripción (opcional)</label>
                    <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                      placeholder="Ej: Fútbol 5 en el complejo del centro, llevá pechera..."
                      rows={3} maxLength={200}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "white", padding: "10px 12px", width: "100%", fontSize: "14px", resize: "none" }}
                      className="focus:outline-none focus:border-rodeo-lime/40 transition-all placeholder-rodeo-cream/25" />
                  </div>

                  <motion.button onClick={handleCreate} disabled={saving}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 rounded-[14px] font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: "#C8FF00", color: "#1A120B" }}>
                    {saving ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                    {saving ? "Publicando..." : "Publicar partido"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
