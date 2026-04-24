"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";
import { useActiveComplex } from "@/lib/context/ActiveComplexContext";
import { supabase, supabaseMut } from "@/lib/supabase";
import { Trophy, Plus, RefreshCw, Check, X, Calendar, Users, Loader, ArrowRight, Trash2 } from "lucide-react";

interface Torneo {
  id: string;
  nombre: string;
  slug: string;
  deporte: string;
  tipo: string;
  descripcion: string | null;
  imagen_url: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  cupos_totales: number;
  cupos_ocupados: number;
  precio_inscripcion: number;
  estado: string;
  created_at: string;
}

const DEPORTES = ["futbol", "padel", "tenis", "voley", "basquet"];
const TIPOS = [
  { value: "eliminatorio", label: "Eliminación directa" },
  { value: "liga",         label: "Liga (todos contra todos)" },
  { value: "fixture",      label: "Fixture programado" },
  { value: "mixto",        label: "Mixto" },
];

const ESTADO_META: Record<string, { color: string; bg: string; label: string }> = {
  registracion: { color: "#4ADE80", bg: "rgba(74,222,128,0.12)",  label: "Inscripción abierta" },
  en_curso:     { color: "#60A5FA", bg: "rgba(96,165,250,0.12)",  label: "En curso" },
  finalizado:   { color: "#94A3B8", bg: "rgba(148,163,184,0.12)", label: "Finalizado" },
};

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
}

const EMPTY_FORM = {
  nombre: "",
  deporte: "futbol",
  tipo: "eliminatorio",
  descripcion: "",
  imagen_url: "",
  fecha_inicio: "",
  fecha_fin: "",
  cupos_totales: 8,
  precio_inscripcion: 0,
};

export default function OwnerTorneosPage() {
  const { user } = useAuth();
  const { activeComplexId, activeComplexName } = useActiveComplex();
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { if (activeComplexId) load(); }, [activeComplexId]);

  async function load() {
    if (!activeComplexId) return;
    setLoading(true);
    const { data } = await supabase
      .from("tournaments")
      .select("id, nombre, slug, deporte, tipo, descripcion, imagen_url, fecha_inicio, fecha_fin, cupos_totales, cupos_ocupados, precio_inscripcion, estado, created_at")
      .eq("complex_id", activeComplexId)
      .order("fecha_inicio", { ascending: false }) as { data: Torneo[] | null };
    setTorneos(data || []);
    setLoading(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { setError("La imagen no puede superar 5MB."); return; }
    setUploadingImg(true); setError("");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `tournaments/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const { error: upErr } = await supabaseMut.storage.from("app-media").upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data } = supabaseMut.storage.from("app-media").getPublicUrl(path);
      setForm(f => ({ ...f, imagen_url: data.publicUrl }));
    } catch (err) {
      setError((err as { message?: string }).message || "Error al subir.");
    } finally { setUploadingImg(false); }
  }

  async function handleSave() {
    if (!form.nombre.trim() || !form.fecha_inicio || !user || !activeComplexId) { setError("Nombre y fecha de inicio son obligatorios."); return; }
    setSaving(true); setError("");
    try {
      const baseSlug = slugify(form.nombre);
      const uniqueSlug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
      const payload = {
        nombre: form.nombre.trim(),
        slug: uniqueSlug,
        deporte: form.deporte,
        tipo: form.tipo,
        descripcion: form.descripcion.trim() || null,
        imagen_url: form.imagen_url || null,
        complex_id: activeComplexId,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin || null,
        cupos_totales: form.cupos_totales,
        precio_inscripcion: form.precio_inscripcion,
        estado: "registracion",
        es_publico: true,
        created_by: user.id,
      };
      const { error: e } = await supabaseMut.from("tournaments").insert(payload);
      if (e) throw e;
      await load();
      setShowForm(false); setForm(EMPTY_FORM);
    } catch (e) {
      setError((e as { message?: string }).message || "Error al guardar.");
    } finally { setSaving(false); }
  }

  async function handleDelete(t: Torneo) {
    if (!confirm(`¿Eliminar el torneo "${t.nombre}"? Se borrarán todos los equipos y partidos asociados.`)) return;
    setDeletingId(t.id);
    await supabaseMut.from("tournament_matches").delete().eq("tournament_id", t.id);
    await supabaseMut.from("tournament_teams").delete().eq("tournament_id", t.id);
    await supabaseMut.from("tournaments").delete().eq("id", t.id);
    setTorneos(prev => prev.filter(x => x.id !== t.id));
    setDeletingId(null);
  }

  const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#E1D4C2", outline: "none" } as React.CSSProperties;

  if (!activeComplexId) {
    return <div className="text-rodeo-cream/50 text-sm py-12 text-center">Seleccioná un complejo para gestionar torneos.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40">{activeComplexName}</p>
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "36px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }} className="text-white"><span className="section-slash">/</span>Torneos</h1>
        </div>
        <button onClick={load} disabled={loading}
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
          className="px-3 py-2 text-xs text-rodeo-cream/60 disabled:opacity-40">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
        <button onClick={() => { setShowForm(v => !v); setForm(EMPTY_FORM); }}
          style={{ background: "rgba(200,255,0,0.9)", borderRadius: "10px" }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-rodeo-dark hover:bg-rodeo-lime transition-all">
          <Plus size={14} /> Nuevo torneo
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div style={{ background: "rgba(200,255,0,0.04)", border: "1px solid rgba(200,255,0,0.15)", borderRadius: "16px" }} className="p-6 space-y-4">
              <p className="text-sm font-black text-rodeo-lime uppercase tracking-wide">Nuevo torneo</p>
              <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Nombre del torneo *" style={inputStyle} className="w-full px-4 py-3 text-sm placeholder:text-rodeo-cream/25" />
              <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Descripción (opcional)" rows={3}
                style={{ ...inputStyle, resize: "none" }} className="w-full px-4 py-3 text-sm placeholder:text-rodeo-cream/25" />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-rodeo-cream/40 uppercase tracking-widest">Deporte</label>
                  <select value={form.deporte} onChange={e => setForm(f => ({ ...f, deporte: e.target.value }))} style={inputStyle} className="w-full px-3 py-2.5 text-sm">
                    {DEPORTES.map(d => <option key={d} value={d} style={{ background: "#1A120B" }}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-rodeo-cream/40 uppercase tracking-widest">Formato</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={inputStyle} className="w-full px-3 py-2.5 text-sm">
                    {TIPOS.map(t => <option key={t.value} value={t.value} style={{ background: "#1A120B" }}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-rodeo-cream/40 uppercase tracking-widest">Inicio *</label>
                  <input type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} style={inputStyle} className="w-full px-3 py-2.5 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-rodeo-cream/40 uppercase tracking-widest">Fin (opcional)</label>
                  <input type="date" value={form.fecha_fin} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} style={inputStyle} className="w-full px-3 py-2.5 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-rodeo-cream/40 uppercase tracking-widest">Cupos</label>
                  <input type="number" min={2} max={128} value={form.cupos_totales}
                    onChange={e => setForm(f => ({ ...f, cupos_totales: parseInt(e.target.value) || 8 }))}
                    style={inputStyle} className="w-full px-3 py-2.5 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-rodeo-cream/40 uppercase tracking-widest">Inscripción (ARS)</label>
                  <input type="number" min={0}
                    value={form.precio_inscripcion === 0 ? "" : form.precio_inscripcion}
                    onChange={e => setForm(f => ({ ...f, precio_inscripcion: e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value) || 0) }))}
                    style={inputStyle} className="w-full px-3 py-2.5 text-sm" placeholder="0 = gratis" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-rodeo-cream/40 uppercase tracking-widest">Imagen (opcional)</label>
                {form.imagen_url ? (
                  <div className="relative" style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <img src={form.imagen_url} alt="" className="w-full h-40 object-cover" />
                    <button type="button" onClick={()=>setForm(f=>({...f, imagen_url: ""}))} style={{ background:"rgba(0,0,0,0.7)", borderRadius:"8px" }} className="absolute top-2 right-2 p-1.5 text-white hover:bg-red-500/80">
                      <X size={14}/>
                    </button>
                  </div>
                ) : (
                  <label style={{ background:"rgba(255,255,255,0.04)", border:"1px dashed rgba(255,255,255,0.18)", borderRadius:"12px" }} className="flex items-center justify-center gap-2 py-5 cursor-pointer hover:bg-white/8">
                    {uploadingImg ? <><Loader size={14} className="animate-spin text-rodeo-lime"/><span className="text-xs text-rodeo-cream/60">Subiendo...</span></> : <span className="text-xs text-rodeo-cream/60">Click para subir</span>}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg}/>
                  </label>
                )}
              </div>

              {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving || !form.nombre.trim() || !form.fecha_inicio}
                  style={{ background: "rgba(200,255,0,0.9)", borderRadius: "10px" }}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-black text-rodeo-dark disabled:opacity-40">
                  {saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                  Crear torneo
                </button>
                <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
                  className="px-4 py-2.5 text-sm font-bold text-rodeo-cream/50 hover:text-white">
                  <X size={13} className="inline mr-1" />Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ height: 88, borderRadius: 14, background: "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.5s infinite" }} />)}</div>
      ) : torneos.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Trophy size={32} className="mx-auto text-rodeo-cream/15" />
          <p className="text-rodeo-cream/30 text-sm">Aún no organizaste ningún torneo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {torneos.map((t, i) => {
            const est = ESTADO_META[t.estado] ?? ESTADO_META.registracion;
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px" }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors">
                <Link href={`/owner/torneos/${t.slug}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.2)" }}>
                    {t.imagen_url ? <img src={t.imagen_url} alt="" className="w-full h-full object-cover" /> : <Trophy size={20} className="text-rodeo-lime m-auto mt-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{t.nombre}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-[11px] text-rodeo-lime font-bold uppercase">{t.deporte}</span>
                      <span className="text-[11px] text-rodeo-cream/40 flex items-center gap-1"><Calendar size={10}/>{new Date(t.fecha_inicio).toLocaleDateString("es-AR")}</span>
                      <span className="text-[11px] text-rodeo-cream/40 flex items-center gap-1"><Users size={10}/>{t.cupos_ocupados}/{t.cupos_totales}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: est.bg, color: est.color }}>
                    {est.label}
                  </span>
                  <ArrowRight size={14} className="text-rodeo-cream/30 shrink-0" />
                </Link>
                <button onClick={() => handleDelete(t)} disabled={deletingId === t.id}
                  className="p-2 rounded-lg text-rodeo-cream/25 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50 shrink-0">
                  {deletingId === t.id ? <Loader size={14} className="animate-spin text-red-400" /> : <Trash2 size={14} />}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
