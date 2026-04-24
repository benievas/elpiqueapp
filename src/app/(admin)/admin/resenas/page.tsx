"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase, supabaseMut } from "@/lib/supabase";
import { Star, Search, RefreshCw, Loader, Building2, User, Trash2 } from "lucide-react";

interface Resena {
  id: string; estrellas: number; texto: string | null; created_at: string;
  user_id: string; complex_id: string;
  autor_nombre?: string; complejo_nombre?: string; complejo_slug?: string;
}

export default function AdminResenasPage() {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstrellas, setFiltroEstrellas] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("reviews")
        .select("id, estrellas, texto, created_at, user_id, complex_id, profiles!user_id(nombre_completo), complexes!complex_id(nombre, slug)")
        .order("created_at", { ascending: false })
        .limit(200);

      setResenas((data || []).map((r: any) => ({
        ...r,
        autor_nombre: r.profiles?.nombre_completo,
        complejo_nombre: r.complexes?.nombre,
        complejo_slug: r.complexes?.slug,
      })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function eliminar(id: string) {
    setDeleting(id);
    await supabaseMut.from("reviews").delete().eq("id", id);
    setResenas(prev => prev.filter(r => r.id !== id));
    setDeleting(null);
  }

  const filtradas = resenas.filter(r => {
    const matchEst = filtroEstrellas === 0 || r.estrellas === filtroEstrellas;
    const q = busqueda.toLowerCase();
    const matchQ = !q || [r.autor_nombre, r.complejo_nombre, r.texto].some(v => v?.toLowerCase().includes(q));
    return matchEst && matchQ;
  });

  const promedioGlobal = resenas.length
    ? (resenas.reduce((s, r) => s + r.estrellas, 0) / resenas.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40">Admin</p>
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "28px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }}
            className="text-white"><span className="section-slash">/</span>Reseñas</h1>
        </div>
        <button onClick={load} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }}
          className="px-3 py-2 text-xs text-rodeo-cream/60">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 14 }} className="p-4">
          <p className="text-xl font-black text-yellow-400">{promedioGlobal} ★</p>
          <p className="text-xs text-rodeo-cream/50">Promedio global</p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 }} className="p-4">
          <p className="text-xl font-black text-white">{resenas.length}</p>
          <p className="text-xs text-rodeo-cream/50">Total reseñas</p>
        </div>
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 14 }} className="p-4">
          <p className="text-xl font-black text-red-400">{resenas.filter(r => r.estrellas <= 2).length}</p>
          <p className="text-xs text-rodeo-cream/50">≤2 estrellas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rodeo-cream/30" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por usuario, complejo o texto..."
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }}
            className="w-full pl-8 pr-3 py-2.5 text-sm text-white placeholder:text-rodeo-cream/25 focus:outline-none" />
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setFiltroEstrellas(n)}
              style={filtroEstrellas === n
                ? { background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: 8 }
                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}
              className={`px-3 py-2 text-xs font-bold ${filtroEstrellas === n ? "text-yellow-400" : "text-rodeo-cream/50"}`}>
              {n === 0 ? "Todas" : `${n}★`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-rodeo-lime" /></div>
      ) : (
        <div className="space-y-2">
          {filtradas.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14 }}
              className="flex items-start gap-4 px-5 py-4">
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= r.estrellas ? "text-yellow-400 fill-yellow-400" : "text-white/15"} />)}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-rodeo-cream/40"><User size={10} />{r.autor_nombre ?? "Anónimo"}</span>
                  <span className="flex items-center gap-1 text-xs text-rodeo-cream/40"><Building2 size={10} />{r.complejo_nombre ?? "—"}</span>
                </div>
                {r.texto && <p className="text-sm text-rodeo-cream/70 leading-relaxed">{r.texto}</p>}
                <p className="text-[11px] text-rodeo-cream/25">{new Date(r.created_at).toLocaleDateString("es-AR", { dateStyle: "medium" })}</p>
              </div>
              <button onClick={() => eliminar(r.id)} disabled={deleting === r.id}
                className="p-2 rounded-[8px] hover:bg-red-500/10 transition-colors shrink-0 disabled:opacity-40"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                {deleting === r.id
                  ? <Loader size={13} className="animate-spin text-red-400" />
                  : <Trash2 size={13} className="text-red-400/50 hover:text-red-400" />}
              </button>
            </motion.div>
          ))}
          {filtradas.length === 0 && <p className="text-center py-10 text-rodeo-cream/30 text-sm">Sin resultados</p>}
        </div>
      )}
    </div>
  );
}
