"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase, supabaseMut } from "@/lib/supabase";
import {
  ChevronLeft, Plus, Trash2, Edit2, Check, X, RefreshCw,
  Loader, GripVertical, ChevronUp, ChevronDown, ImageIcon, Video,
} from "lucide-react";

interface Slide {
  id: string;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  imagen_url: string;
  video_url: string;
  cta_link: string;
  cta_label: string;
  orden: number;
}

const SLIDE_VACIO: Omit<Slide, "id" | "orden"> = {
  titulo: "",
  subtitulo: "",
  descripcion: "",
  imagen_url: "",
  video_url: "",
  cta_link: "/explorar",
  cta_label: "Explorar canchas",
};

const SLIDES_DEFAULT: Slide[] = [
  {
    id: "p1", orden: 0,
    titulo: "RESERVÁ EN SEGUNDOS",
    subtitulo: "CONFIRMACIÓN VÍA WHATSAPP",
    descripcion: "Elegí tu cancha, seleccioná el horario disponible y confirmá con el dueño directo por WhatsApp. Sin llamadas, sin esperas.",
    imagen_url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2000&auto=format&fit=crop",
    video_url: "",
    cta_link: "/explorar",
    cta_label: "Explorar canchas",
  },
  {
    id: "p2", orden: 1,
    titulo: "TORNEOS EN VIVO",
    subtitulo: "INSCRIPCIÓN Y BRACKET ONLINE",
    descripcion: "Anotate en torneos activos con tu equipo. Bracket, resultados y clasificaciones actualizados en tiempo real.",
    imagen_url: "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?q=80&w=2000&auto=format&fit=crop",
    video_url: "",
    cta_link: "/torneos",
    cta_label: "Ver torneos",
  },
  {
    id: "p3", orden: 2,
    titulo: "CANCHA LIBRE AHORA",
    subtitulo: "DESCUENTOS DE ÚLTIMO MOMENTO",
    descripcion: "Algunos complejos ofrecen descuentos express para horas libres. Aprovechá los mejores precios y jugá más por menos.",
    imagen_url: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=2000&auto=format&fit=crop",
    video_url: "",
    cta_link: "/explorar",
    cta_label: "Ver ofertas",
  },
  {
    id: "p4", orden: 3,
    titulo: "MAPA INTERACTIVO",
    subtitulo: "ENCONTRÁ CANCHAS CERCA",
    descripcion: "Todos los complejos de tu ciudad en el mapa. Filtrá por deporte, horario y distancia.",
    imagen_url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2000&auto=format&fit=crop",
    video_url: "",
    cta_link: "/mapa",
    cta_label: "Ver mapa",
  },
];

export default function HomeConfigPage() {
  const { user } = useAuth();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Slide, "id" | "orden">>(SLIDE_VACIO);
  const [showForm, setShowForm] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingVid, setUploadingVid] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [globalBgVideo, setGlobalBgVideo] = useState("");
  const [uploadingGlobalVid, setUploadingGlobalVid] = useState(false);
  const [savingGlobalVid, setSavingGlobalVid] = useState(false);

  useEffect(() => { load(); loadGlobalBg(); }, []);

  async function load() {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("app_config")
        .select("value")
        .eq("key", "home_promo_slides")
        .maybeSingle();
      if (data?.value && Array.isArray(data.value) && data.value.length > 0) {
        setSlides((data.value as Slide[]).sort((a, b) => a.orden - b.orden));
      } else {
        setSlides(SLIDES_DEFAULT);
      }
    } catch { setSlides(SLIDES_DEFAULT); }
    finally { setLoading(false); }
  }

  async function loadGlobalBg() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from("app_config").select("value").eq("key", "site_bg_video").maybeSingle();
      if (data?.value) setGlobalBgVideo(String(data.value));
    } catch { /* no config yet */ }
  }

  async function saveGlobalBg() {
    setSavingGlobalVid(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseMut as any).from("app_config").upsert({ key: "site_bg_video", value: globalBgVideo, updated_at: new Date().toISOString() }, { onConflict: "key" });
    setSavingGlobalVid(false);
  }

  async function uploadGlobalVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !user) return;
    if (file.size > 100 * 1024 * 1024) { setErrorText("El video no puede superar 100MB."); return; }
    setUploadingGlobalVid(true); setErrorText("");
    const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
    const path = `site-bg/${Date.now()}.${ext}`;
    const { error } = await supabaseMut.storage.from("app-media").upload(path, file, { cacheControl: "3600", upsert: true });
    if (error) { setErrorText("Error al subir: " + error.message); setUploadingGlobalVid(false); return; }
    const { data } = supabaseMut.storage.from("app-media").getPublicUrl(path);
    setGlobalBgVideo(data.publicUrl);
    setUploadingGlobalVid(false);
  }

  async function saveAll(newSlides: Slide[]) {
    setSaving(true);
    const ordenados = newSlides.map((s, i) => ({ ...s, orden: i }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseMut as any)
      .from("app_config")
      .upsert({ key: "home_promo_slides", value: ordenados, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) setErrorText("Error al guardar: " + error.message);
    else setSlides(ordenados);
    setSaving(false);
    return !error;
  }

  async function uploadFile(file: File, tipo: "imagen" | "video"): Promise<string | null> {
    if (!user) return null;
    const ext = file.name.split(".").pop()?.toLowerCase() || (tipo === "video" ? "mp4" : "jpg");
    const carpeta = tipo === "video" ? "home-videos" : "home-slides";
    const path = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabaseMut.storage.from("app-media").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) { setErrorText("Error al subir: " + error.message); return null; }
    const { data } = supabaseMut.storage.from("app-media").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setErrorText("La imagen no puede superar 8MB."); return; }
    setUploadingImg(true); setErrorText("");
    const url = await uploadFile(file, "imagen");
    if (url) setForm(f => ({ ...f, imagen_url: url }));
    setUploadingImg(false);
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 50 * 1024 * 1024) { setErrorText("El video no puede superar 50MB."); return; }
    setUploadingVid(true); setErrorText("");
    const url = await uploadFile(file, "video");
    if (url) setForm(f => ({ ...f, video_url: url }));
    setUploadingVid(false);
  }

  function startNew() {
    setEditingId(null);
    setForm(SLIDE_VACIO);
    setShowForm(true);
    setErrorText("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEdit(s: Slide) {
    setEditingId(s.id);
    setForm({ titulo: s.titulo, subtitulo: s.subtitulo, descripcion: s.descripcion, imagen_url: s.imagen_url, video_url: s.video_url, cta_link: s.cta_link, cta_label: s.cta_label });
    setShowForm(true);
    setErrorText("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave() {
    if (!form.titulo.trim()) { setErrorText("El título es obligatorio."); return; }
    setSaving(true); setErrorText("");
    let newSlides: Slide[];
    if (editingId) {
      newSlides = slides.map(s => s.id === editingId ? { ...s, ...form } : s);
    } else {
      const nuevoId = `slide_${Date.now()}`;
      newSlides = [...slides, { id: nuevoId, orden: slides.length, ...form }];
    }
    const ok = await saveAll(newSlides);
    if (ok) { setShowForm(false); setEditingId(null); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este slide?")) return;
    await saveAll(slides.filter(s => s.id !== id));
  }

  async function mover(index: number, dir: -1 | 1) {
    const nuevo = [...slides];
    const otro = index + dir;
    if (otro < 0 || otro >= nuevo.length) return;
    [nuevo[index], nuevo[otro]] = [nuevo[otro], nuevo[index]];
    await saveAll(nuevo);
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px", color: "#E1D4C2", outline: "none",
  } as React.CSSProperties;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
          <ChevronLeft size={20} className="text-rodeo-cream/50" />
        </Link>
        <div className="flex-1">
          <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40">Admin</p>
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "28px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }} className="text-white">
            <span className="section-slash">/</span>Home — Slides
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
            className="p-2 text-rodeo-cream/60 disabled:opacity-40">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={startNew}
            style={{ background: "rgba(200,255,0,0.9)", borderRadius: "10px" }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-rodeo-dark">
            <Plus size={14} /> Nuevo slide
          </button>
        </div>
      </div>

      <p className="text-xs text-rodeo-cream/40 leading-relaxed">
        Estos slides son las cards del home que muestran las características de la plataforma. Podés editar texto, imagen y video de fondo de cada una. Los cambios se reflejan en tiempo real en el sitio.
      </p>

      {/* Formulario */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div style={{ background: "rgba(200,255,0,0.04)", border: "1px solid rgba(200,255,0,0.15)", borderRadius: "16px" }} className="p-6 space-y-4">
              <p className="text-sm font-black text-rodeo-lime uppercase tracking-wide">
                {editingId ? "Editar slide" : "Nuevo slide"}
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-rodeo-cream/40 uppercase tracking-widest">Título *</label>
                  <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                    placeholder="RESERVÁ EN SEGUNDOS" style={inputStyle} className="w-full px-4 py-3 text-sm placeholder:text-rodeo-cream/20 uppercase font-black" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-rodeo-cream/40 uppercase tracking-widest">Subtítulo</label>
                  <input value={form.subtitulo} onChange={e => setForm(f => ({ ...f, subtitulo: e.target.value }))}
                    placeholder="CONFIRMACIÓN VÍA WHATSAPP" style={inputStyle} className="w-full px-4 py-3 text-sm placeholder:text-rodeo-cream/20" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-rodeo-cream/40 uppercase tracking-widest">Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Texto descriptivo de la card..." rows={3}
                  style={{ ...inputStyle, resize: "none" }} className="w-full px-4 py-3 text-sm placeholder:text-rodeo-cream/20" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-rodeo-cream/40 uppercase tracking-widest">Link del botón CTA</label>
                  <input value={form.cta_link} onChange={e => setForm(f => ({ ...f, cta_link: e.target.value }))}
                    placeholder="/explorar" style={inputStyle} className="w-full px-4 py-3 text-sm placeholder:text-rodeo-cream/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-rodeo-cream/40 uppercase tracking-widest">Texto del botón CTA</label>
                  <input value={form.cta_label} onChange={e => setForm(f => ({ ...f, cta_label: e.target.value }))}
                    placeholder="Explorar canchas" style={inputStyle} className="w-full px-4 py-3 text-sm placeholder:text-rodeo-cream/20" />
                </div>
              </div>

              {/* Upload imagen */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-rodeo-cream/40 uppercase tracking-widest flex items-center gap-1.5">
                  <ImageIcon size={11} /> Imagen de fondo (máx 8MB)
                </label>
                {form.imagen_url ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
                    <img src={form.imagen_url} alt="" className="w-full h-36 object-cover" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, imagen_url: "" }))}
                      style={{ background: "rgba(0,0,0,0.75)", borderRadius: "8px" }}
                      className="absolute top-2 right-2 p-1.5 text-white hover:bg-red-500/80">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.18)", borderRadius: "12px" }}
                    className="flex items-center justify-center gap-2 py-5 cursor-pointer hover:bg-white/8">
                    {uploadingImg
                      ? <><Loader size={14} className="animate-spin text-rodeo-lime" /><span className="text-xs text-rodeo-cream/60">Subiendo imagen...</span></>
                      : <><ImageIcon size={14} className="text-rodeo-cream/30" /><span className="text-xs text-rodeo-cream/60">Click para subir imagen</span></>}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
                  </label>
                )}
                <p className="text-[10px] text-rodeo-cream/30">O pegá una URL directamente:</p>
                <input value={form.imagen_url} onChange={e => setForm(f => ({ ...f, imagen_url: e.target.value }))}
                  placeholder="https://..." style={inputStyle} className="w-full px-3 py-2.5 text-xs placeholder:text-rodeo-cream/20" />
              </div>

              {/* Upload video */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-rodeo-cream/40 uppercase tracking-widest flex items-center gap-1.5">
                  <Video size={11} /> Video de fondo (opcional, máx 50MB, reemplaza la imagen)
                </label>
                {form.video_url ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
                    <video src={form.video_url} className="w-full h-36 object-cover" muted loop />
                    <button type="button" onClick={() => setForm(f => ({ ...f, video_url: "" }))}
                      style={{ background: "rgba(0,0,0,0.75)", borderRadius: "8px" }}
                      className="absolute top-2 right-2 p-1.5 text-white hover:bg-red-500/80">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.18)", borderRadius: "12px" }}
                    className="flex items-center justify-center gap-2 py-5 cursor-pointer hover:bg-white/8">
                    {uploadingVid
                      ? <><Loader size={14} className="animate-spin text-rodeo-lime" /><span className="text-xs text-rodeo-cream/60">Subiendo video...</span></>
                      : <><Video size={14} className="text-rodeo-cream/30" /><span className="text-xs text-rodeo-cream/60">Click para subir video (.mp4, .webm)</span></>}
                    <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleVideoUpload} disabled={uploadingVid} />
                  </label>
                )}
                {form.video_url && (
                  <p className="text-[10px] text-rodeo-cream/30">O pegá una URL directamente:</p>
                )}
                {!form.video_url && (
                  <input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
                    placeholder="https://... (MP4 o WebM)" style={inputStyle} className="w-full px-3 py-2.5 text-xs placeholder:text-rodeo-cream/20" />
                )}
              </div>

              {errorText && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{errorText}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} disabled={saving || !form.titulo.trim() || uploadingImg || uploadingVid}
                  style={{ background: "rgba(200,255,0,0.9)", borderRadius: "10px" }}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-black text-rodeo-dark disabled:opacity-40">
                  {saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                  {editingId ? "Guardar cambios" : "Agregar slide"}
                </button>
                <button onClick={() => { setShowForm(false); setEditingId(null); setErrorText(""); }}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
                  className="px-4 py-2.5 text-sm font-bold text-rodeo-cream/50 hover:text-white">
                  <X size={13} className="inline mr-1" />Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de slides */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 88, borderRadius: 14, background: "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.5s infinite" }} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {slides.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px" }}
              className="flex items-center gap-3 overflow-hidden pr-3">
              {/* Imagen miniatura */}
              {s.video_url ? (
                <div className="w-20 h-16 shrink-0 rounded-l-[13px] overflow-hidden relative">
                  <video src={s.video_url} className="w-full h-full object-cover" muted />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Video size={16} className="text-white" />
                  </div>
                </div>
              ) : s.imagen_url ? (
                <div className="w-20 h-16 shrink-0 rounded-l-[13px] overflow-hidden">
                  <img src={s.imagen_url} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-16 shrink-0 rounded-l-[13px] bg-white/5 flex items-center justify-center">
                  <ImageIcon size={18} className="text-rodeo-cream/20" />
                </div>
              )}

              {/* Texto */}
              <div className="flex-1 min-w-0 py-2">
                <p className="text-sm font-black text-white uppercase truncate">{s.titulo || "Sin título"}</p>
                <p className="text-[11px] text-rodeo-cream/40 truncate">{s.subtitulo}</p>
                <p className="text-[10px] text-rodeo-cream/25 truncate">{s.cta_link}</p>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1 shrink-0">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => mover(i, -1)} disabled={i === 0 || saving}
                    className="p-1 hover:bg-white/10 rounded disabled:opacity-20" title="Subir">
                    <ChevronUp size={12} className="text-rodeo-cream/40" />
                  </button>
                  <button onClick={() => mover(i, 1)} disabled={i === slides.length - 1 || saving}
                    className="p-1 hover:bg-white/10 rounded disabled:opacity-20" title="Bajar">
                    <ChevronDown size={12} className="text-rodeo-cream/40" />
                  </button>
                </div>
                <button onClick={() => startEdit(s)} className="p-2 hover:bg-white/10 rounded-lg">
                  <Edit2 size={13} className="text-rodeo-cream/40 hover:text-rodeo-lime" />
                </button>
                <button onClick={() => handleDelete(s.id)} disabled={saving}
                  className="p-2 hover:bg-white/10 rounded-lg">
                  <Trash2 size={13} className="text-rodeo-cream/30 hover:text-red-400" />
                </button>
              </div>
            </motion.div>
          ))}
          {slides.length === 0 && (
            <div className="text-center py-12 text-rodeo-cream/30 text-sm">
              No hay slides configurados. Hacé click en "Nuevo slide" para agregar uno.
            </div>
          )}
        </div>
      )}

      {saving && (
        <p className="text-xs text-rodeo-lime/70 flex items-center gap-1.5">
          <RefreshCw size={11} className="animate-spin" /> Guardando cambios...
        </p>
      )}

      {/* Video de fondo global del sitio */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" }} className="p-5 space-y-4 mt-4">
        <div>
          <p className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
            <Video size={14} className="text-rodeo-lime" /> Fondo global del sitio
          </p>
          <p className="text-[11px] text-rodeo-cream/40 mt-1">
            Video de fondo para las páginas públicas (home, explorar, etc.). Si está vacío, se usa el fondo verde sólido original. El video se muestra semitransparente detrás del contenido.
          </p>
        </div>

        {globalBgVideo ? (
          <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
            <video src={globalBgVideo} className="w-full h-36 object-cover" muted loop />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Video size={20} className="text-white/60" />
            </div>
            <button type="button" onClick={() => setGlobalBgVideo("")}
              style={{ background: "rgba(0,0,0,0.75)", borderRadius: "8px" }}
              className="absolute top-2 right-2 p-1.5 text-white hover:bg-red-500/80">
              <X size={14} />
            </button>
          </div>
        ) : (
          <label style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.18)", borderRadius: "12px" }}
            className="flex items-center justify-center gap-2 py-5 cursor-pointer hover:bg-white/8">
            {uploadingGlobalVid
              ? <><Loader size={14} className="animate-spin text-rodeo-lime" /><span className="text-xs text-rodeo-cream/60">Subiendo video...</span></>
              : <><Video size={14} className="text-rodeo-cream/30" /><span className="text-xs text-rodeo-cream/60">Click para subir video de fondo (.mp4, .webm, máx 100MB)</span></>}
            <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={uploadGlobalVideo} disabled={uploadingGlobalVid} />
          </label>
        )}
        <div className="space-y-1.5">
          <p className="text-[10px] text-rodeo-cream/30">O pegá una URL directamente:</p>
          <input value={globalBgVideo} onChange={e => setGlobalBgVideo(e.target.value)}
            placeholder="https://... (MP4 o WebM)" style={inputStyle} className="w-full px-3 py-2.5 text-xs placeholder:text-rodeo-cream/20" />
        </div>
        <button onClick={saveGlobalBg} disabled={savingGlobalVid || uploadingGlobalVid}
          style={{ background: "rgba(200,255,0,0.9)", borderRadius: "10px" }}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-black text-rodeo-dark disabled:opacity-40">
          {savingGlobalVid ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
          {globalBgVideo ? "Guardar fondo" : "Guardar (sin fondo = verde original)"}
        </button>
      </div>
    </div>
  );
}
