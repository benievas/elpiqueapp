"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { supabase, supabaseMut } from "@/lib/supabase";
import { Building2, Search, ExternalLink, ToggleLeft, ToggleRight, RefreshCw, ChevronLeft } from "lucide-react";

interface Complejo {
  id: string; nombre: string; slug: string; ciudad: string; activo: boolean;
  deporte_principal: string; deportes: string[]; created_at: string;
  owner_email?: string; owner_nombre?: string;
  total_reviews: number; rating_promedio: number | null;
  _canchas: number;
}

export default function AdminComplejosPage() {
  const [complejos, setComplejos] = useState<Complejo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("complexes")
        .select("id, nombre, slug, ciudad, activo, deporte_principal, deportes, created_at, total_reviews, rating_promedio, profiles!owner_id(email, nombre_completo)")
        .order("created_at", { ascending: false }) as { data: any[] | null };

      const ids = (data || []).map((c: any) => c.id);
      let countMap: Record<string, number> = {};
      if (ids.length) {
        const { data: courts } = await supabase.from("courts").select("complex_id").in("complex_id", ids).eq("activa", true);
        (courts || []).forEach((c: any) => { countMap[c.complex_id] = (countMap[c.complex_id] || 0) + 1; });
      }

      setComplejos((data || []).map((c: any) => ({
        ...c,
        owner_email: Array.isArray(c.profiles) ? c.profiles[0]?.email : c.profiles?.email,
        owner_nombre: Array.isArray(c.profiles) ? c.profiles[0]?.nombre_completo : c.profiles?.nombre_completo,
        _canchas: countMap[c.id] || 0,
      })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function toggleActivo(id: string, actual: boolean) {
    setToggling(id);
    await supabaseMut.from("complexes").update({ activo: !actual }).eq("id", id);
    setComplejos(prev => prev.map(c => c.id === id ? { ...c, activo: !actual } : c));
    setToggling(null);
  }

  const filtrados = complejos.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.ciudad.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.owner_email ?? "").toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
          <ChevronLeft size={20} className="text-rodeo-cream/50" />
        </Link>
        <div className="flex-1">
          <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40">Admin</p>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Complejos</h1>
        </div>
        <button onClick={load} disabled={loading}
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-rodeo-cream/60 disabled:opacity-40">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/30" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, ciudad o email del dueño..."
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
          className="w-full pl-9 pr-4 py-3 text-sm text-white placeholder:text-rodeo-cream/25 focus:outline-none focus:border-rodeo-lime/40 transition-all" />
      </div>

      {/* Resumen */}
      <div className="flex gap-3 text-xs">
        <span className="px-3 py-1 rounded-full bg-white/5 text-rodeo-cream/50">{complejos.length} total</span>
        <span className="px-3 py-1 rounded-full bg-green-400/10 text-green-400">{complejos.filter(c => c.activo).length} activos</span>
        <span className="px-3 py-1 rounded-full bg-red-400/10 text-red-400">{complejos.filter(c => !c.activo).length} inactivos</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ height: 72, borderRadius: 14, background: "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.5s infinite" }} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px" }}
              className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-rodeo-lime/10 border border-rodeo-lime/20 flex items-center justify-center shrink-0">
                <Building2 size={15} className="text-rodeo-lime" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{c.nombre}</p>
                <p className="text-xs text-rodeo-cream/40 truncate">{c.ciudad} · {c._canchas} cancha{c._canchas !== 1 ? "s" : ""} · {c.owner_email ?? "sin owner"}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.rating_promedio && (
                  <span className="text-[11px] text-yellow-400 font-bold">⭐ {c.rating_promedio.toFixed(1)}</span>
                )}
                <a href={`/complejo/${c.slug}`} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Ver página pública">
                  <ExternalLink size={13} className="text-rodeo-cream/40 hover:text-rodeo-lime transition-colors" />
                </a>
                <button onClick={() => toggleActivo(c.id, c.activo)} disabled={toggling === c.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-50"
                  style={{ background: c.activo ? "rgba(74,222,128,0.12)" : "rgba(255,64,64,0.12)", border: `1px solid ${c.activo ? "rgba(74,222,128,0.25)" : "rgba(255,64,64,0.25)"}` }}>
                  {toggling === c.id ? <RefreshCw size={11} className="animate-spin" /> : c.activo ? <ToggleRight size={13} className="text-green-400" /> : <ToggleLeft size={13} className="text-red-400" />}
                  <span className={c.activo ? "text-green-400" : "text-red-400"}>{c.activo ? "Activo" : "Inactivo"}</span>
                </button>
              </div>
            </motion.div>
          ))}
          {filtrados.length === 0 && (
            <div className="text-center py-12 text-rodeo-cream/30 text-sm">Sin resultados para "{busqueda}"</div>
          )}
        </div>
      )}
    </div>
  );
}
