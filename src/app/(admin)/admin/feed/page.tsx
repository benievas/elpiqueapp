"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase, supabaseMut } from "@/lib/supabase";
import { Newspaper, ChevronLeft, RefreshCw, Plus, Eye, EyeOff, Trash2, Edit2, Check, X, Loader } from "lucide-react";

interface Post {
  id: string; titulo: string; contenido: string | null; tipo: string;
  imagen_principal: string | null; visible: boolean; created_at: string;
  complejo_nombre?: string;
}

const TIPOS = ["promo", "noticia", "evento", "torneo", "consejo"];
const TIPO_COLOR: Record<string, string> = {
  promo: "#C8FF00", noticia: "#60A5FA", evento: "#A78BFA", torneo: "#F87171", consejo: "#34D399",
};

const EMPTY_FORM = { titulo: "", contenido: "", tipo: "noticia", imagen_principal: "" };

export default function AdminFeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("feed_posts")
        .select("id, titulo, contenido, tipo, imagen_principal, visible, created_at, complexes(nombre)")
        .order("created_at", { ascending: false });
      if (error) console.error("Error loading feed:", error);
      setPosts((data || []).map((p: any) => ({
        ...p,
        complejo_nombre: Array.isArray(p.complexes) ? p.complexes[0]?.nombre : p.complexes?.nombre,
      })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { setErrorText("La imagen no puede superar 5MB."); return; }
    setUploadingImg(true); setErrorText("");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `feed-posts/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const { error: upErr } = await supabaseMut.storage.from("app-media").upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data } = supabaseMut.storage.from("app-media").getPublicUrl(path);
      setForm(f => ({ ...f, imagen_principal: data.publicUrl }));
    } catch (err) {
      setErrorText((err as { message?: string }).message || "Error al subir.");
    } finally { setUploadingImg(false); }
  }

  async function handleSave() {
    if (!form.titulo.trim()) return;
    setSaving(true);
    const payload = { titulo: form.titulo.trim(), contenido: form.contenido.trim() || null, tipo: form.tipo, imagen_principal: form.imagen_principal.trim() || null, visible: true, autor_id: user?.id };
    if (editingId) {
      await supabaseMut.from("feed_posts").update(payload).eq("id", editingId);
      setPosts(prev => prev.map(p => p.id === editingId ? { ...p, ...payload } : p));
    } else {
      const { data, error } = await supabaseMut.from("feed_posts").insert(payload).select("id, titulo, contenido, tipo, imagen_principal, visible, created_at").single();
      if (error) alert("Error: " + error.message);
      if (data) setPosts(prev => [{ ...data, complejo_nombre: undefined }, ...prev]);
    }
    setSaving(false); setShowForm(false); setEditingId(null); setForm(EMPTY_FORM);
  }

  async function toggleVisible(post: Post) {
    setToggling(post.id);
    await supabaseMut.from("feed_posts").update({ visible: !post.visible }).eq("id", post.id);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, visible: !post.visible } : p));
    setToggling(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este post?")) return;
    setDeleting(id);
    await supabaseMut.from("feed_posts").delete().eq("id", id);
    setPosts(prev => prev.filter(p => p.id !== id));
    setDeleting(null);
  }

  function startEdit(post: Post) {
    setEditingId(post.id);
    setForm({ titulo: post.titulo, contenido: post.contenido ?? "", tipo: post.tipo, imagen_principal: post.imagen_principal ?? "" });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#E1D4C2", outline: "none" } as React.CSSProperties;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
          <ChevronLeft size={20} className="text-rodeo-cream/50" />
        </Link>
        <div className="flex-1">
          <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40">Admin</p>
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "28px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }} className="text-white"><span className="section-slash">/</span>Feed / Anuncios</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
            className="px-3 py-2 text-xs text-rodeo-cream/60 disabled:opacity-40">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => { setShowForm(v => !v); setEditingId(null); setForm(EMPTY_FORM); }}
            style={{ background: "rgba(200,255,0,0.9)", borderRadius: "10px" }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-rodeo-dark hover:bg-rodeo-lime transition-all">
            <Plus size={14} /> Nuevo post
          </button>
        </div>
      </div>

      {/* Formulario */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div style={{ background: "rgba(200,255,0,0.04)", border: "1px solid rgba(200,255,0,0.15)", borderRadius: "16px" }} className="p-6 space-y-4">
              <p className="text-sm font-black text-rodeo-lime uppercase tracking-wide">{editingId ? "Editar post" : "Nuevo post"}</p>
              <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Título *" style={inputStyle} className="w-full px-4 py-3 text-sm placeholder:text-rodeo-cream/25" />
              <textarea value={form.contenido} onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
                placeholder="Contenido (opcional)" rows={3}
                style={{ ...inputStyle, resize: "none" }} className="w-full px-4 py-3 text-sm placeholder:text-rodeo-cream/25" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-rodeo-cream/40 uppercase tracking-widest">Tipo</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                    style={inputStyle} className="w-full px-3 py-2.5 text-sm">
                    {TIPOS.map(t => <option key={t} value={t} style={{ background: "#1A120B" }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-rodeo-cream/40 uppercase tracking-widest">Imagen (opcional)</label>
                {form.imagen_principal ? (
                  <div className="relative" style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <img src={form.imagen_principal} alt="" className="w-full h-40 object-cover" />
                    <button type="button" onClick={()=>setForm(f=>({...f, imagen_principal: ""}))} style={{ background:"rgba(0,0,0,0.7)", borderRadius:"8px" }} className="absolute top-2 right-2 p-1.5 text-white hover:bg-red-500/80">
                      <X size={14}/>
                    </button>
                  </div>
                ) : (
                  <label style={{ background:"rgba(255,255,255,0.04)", border:"1px dashed rgba(255,255,255,0.18)", borderRadius:"12px" }} className="flex items-center justify-center gap-2 py-5 cursor-pointer hover:bg-white/8">
                    {uploadingImg ? <><Loader size={14} className="animate-spin text-rodeo-lime"/><span className="text-xs text-rodeo-cream/60">Subiendo...</span></> : <span className="text-xs text-rodeo-cream/60">Click para subir (máx 5MB)</span>}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg}/>
                  </label>
                )}
              </div>
              {errorText && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{errorText}</p>}
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving || !form.titulo.trim()}
                  style={{ background: "rgba(200,255,0,0.9)", borderRadius: "10px" }}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-black text-rodeo-dark disabled:opacity-40">
                  {saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                  {editingId ? "Guardar cambios" : "Publicar"}
                </button>
                <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
                  className="px-4 py-2.5 text-sm font-bold text-rodeo-cream/50 hover:text-white transition-colors">
                  <X size={13} className="inline mr-1" />Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ height: 80, borderRadius: 14, background: "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.5s infinite" }} />)}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Newspaper size={32} className="mx-auto text-rodeo-cream/15" />
          <p className="text-rodeo-cream/30 text-sm">No hay posts publicados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", opacity: p.visible ? 1 : 0.55 }}
              className="flex items-center gap-3 pr-4 hover:bg-white/5 transition-colors overflow-hidden">
              {p.imagen_principal ? (
                <div className="w-16 h-16 shrink-0 overflow-hidden rounded-l-[13px]">
                  <img src={p.imagen_principal} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-2 h-16 shrink-0" style={{ background: TIPO_COLOR[p.tipo] ?? "#888", borderRadius: "13px 0 0 13px" }} />
              )}
              <div className="flex-1 min-w-0 py-3">
                <p className="text-sm font-bold text-white truncate">{p.titulo}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${TIPO_COLOR[p.tipo] ?? "#888"}20`, color: TIPO_COLOR[p.tipo] ?? "#888" }}>{p.tipo}</span>
                  {p.complejo_nombre && <span className="text-[11px] text-rodeo-cream/30">{p.complejo_nombre}</span>}
                  <span className="text-[10px] text-rodeo-cream/25">{new Date(p.created_at).toLocaleDateString("es-AR")}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => toggleVisible(p)} disabled={toggling === p.id}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors" title={p.visible ? "Ocultar" : "Publicar"}>
                  {toggling === p.id ? <RefreshCw size={13} className="animate-spin text-rodeo-cream/40" /> : p.visible ? <Eye size={13} className="text-rodeo-lime" /> : <EyeOff size={13} className="text-rodeo-cream/30" />}
                </button>
                <button onClick={() => startEdit(p)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Edit2 size={13} className="text-rodeo-cream/40 hover:text-rodeo-lime transition-colors" />
                </button>
                <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  {deleting === p.id ? <RefreshCw size={13} className="animate-spin text-red-400/50" /> : <Trash2 size={13} className="text-rodeo-cream/30 hover:text-red-400 transition-colors" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
