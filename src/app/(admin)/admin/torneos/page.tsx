"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { supabase, supabaseMut } from "@/lib/supabase";
import {
  Trophy, Search, RefreshCw, Loader, Calendar,
  Users, Building2, ExternalLink, Trash2, X,
} from "lucide-react";

interface Torneo {
  id: string; nombre: string; slug: string; deporte: string;
  estado: string; fecha_inicio: string; cupos: number | null;
  imagen_url: string | null; complex_id: string;
  complejo_nombre?: string; owner_nombre?: string;
  total_equipos?: number;
}

const ESTADO_META: Record<string, { color: string; bg: string; label: string }> = {
  registracion: { color: "#60A5FA", bg: "rgba(96,165,250,0.1)",  label: "Inscripción" },
  en_curso:     { color: "#C8FF00", bg: "rgba(200,255,0,0.1)",   label: "En curso" },
  finalizado:   { color: "#9CA3AF", bg: "rgba(156,163,175,0.1)", label: "Finalizado" },
  cancelado:    { color: "#F87171", bg: "rgba(248,113,113,0.1)", label: "Cancelado" },
};

const ESTADOS = ["todos", "registracion", "en_curso", "finalizado"];

export default function AdminTorneosPage() {
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<Torneo | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("tournaments")
        .select("id, nombre, slug, deporte, estado, fecha_inicio, cupos, imagen_url, complex_id, complexes!complex_id(nombre, owner_id)")
        .order("fecha_inicio", { ascending: false });

      const rows = data || [];
      let equiposMap: Record<string, number> = {};
      if (rows.length) {
        const { data: equipos } = await supabase
          .from("tournament_teams").select("tournament_id")
          .in("tournament_id", rows.map((t: any) => t.id));
        (equipos || []).forEach((e: any) => { equiposMap[e.tournament_id] = (equiposMap[e.tournament_id] || 0) + 1; });
      }

      const ownerIds = [...new Set(rows.map((t: any) => t.complexes?.owner_id).filter(Boolean))];
      let ownersMap: Record<string, string> = {};
      if (ownerIds.length) {
        const { data: owners } = await supabase
          .from("profiles").select("id, nombre_completo").in("id", ownerIds);
        (owners || []).forEach((o: any) => { ownersMap[o.id] = o.nombre_completo; });
      }

      setTorneos(rows.map((t: any) => ({
        ...t,
        complejo_nombre: t.complexes?.nombre,
        owner_nombre: ownersMap[t.complexes?.owner_id] ?? null,
        total_equipos: equiposMap[t.id] || 0,
      })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function eliminar(t: Torneo) {
    setDeleting(t.id);
    await supabaseMut.from("tournament_matches").delete().eq("tournament_id", t.id);
    await supabaseMut.from("tournament_teams").delete().eq("tournament_id", t.id);
    await supabaseMut.from("tournaments").delete().eq("id", t.id);
    setTorneos(prev => prev.filter(x => x.id !== t.id));
    setDeleting(null);
    setConfirmDel(null);
  }

  const filtrados = torneos.filter(t => {
    const matchEstado = filtroEstado === "todos" || t.estado === filtroEstado;
    const q = busqueda.toLowerCase();
    const matchQ = !q || [t.nombre, t.complejo_nombre, t.owner_nombre, t.deporte].some(v => v?.toLowerCase().includes(q));
    return matchEstado && matchQ;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40">Admin</p>
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "28px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }}
            className="text-white"><span className="section-slash">/</span>Torneos</h1>
        </div>
        <button onClick={load} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }}
          className="px-3 py-2 text-xs text-rodeo-cream/60">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {(["registracion", "en_curso", "finalizado", "cancelado"] as const).map(est => {
          const m = ESTADO_META[est];
          return (
            <div key={est} style={{ background: m.bg, border: `1px solid ${m.color}25`, borderRadius: 14 }} className="p-3">
              <p className="text-xl font-black" style={{ color: m.color }}>{torneos.filter(t => t.estado === est).length}</p>
              <p className="text-xs text-rodeo-cream/50">{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rodeo-cream/30" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar torneo, deporte, complejo..."
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }}
            className="w-full pl-8 pr-3 py-2.5 text-sm text-white placeholder:text-rodeo-cream/25 focus:outline-none" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {ESTADOS.map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)}
              style={filtroEstado === e
                ? { background: "rgba(200,255,0,0.15)", border: "1px solid rgba(200,255,0,0.3)", borderRadius: 8 }
                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}
              className={`px-3 py-2 text-xs font-bold ${filtroEstado === e ? "text-rodeo-lime" : "text-rodeo-cream/50"}`}>
              {e === "todos" ? "Todos" : ESTADO_META[e]?.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-rodeo-lime" /></div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((t, i) => {
            const m = ESTADO_META[t.estado] ?? ESTADO_META.finalizado;
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14 }}
                className="flex items-center gap-4 px-5 py-4">
                {/* Imagen */}
                <div className="w-12 h-12 rounded-[10px] overflow-hidden shrink-0 bg-white/5">
                  {t.imagen_url
                    ? <img src={t.imagen_url} alt="" className="w-full h-full object-cover" />
                    : <Trophy size={20} className="text-rodeo-cream/20 m-auto mt-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-white truncate">{t.nombre}</p>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: m.bg, color: m.color }}>{m.label}</span>
                    <span className="text-[10px] text-rodeo-cream/40 capitalize">{t.deporte}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-rodeo-cream/40 flex-wrap">
                    <span className="flex items-center gap-1"><Building2 size={10} />{t.complejo_nombre ?? "—"}</span>
                    <span className="flex items-center gap-1"><Calendar size={10} />{new Date(t.fecha_inicio).toLocaleDateString("es-AR")}</span>
                    <span className="flex items-center gap-1"><Users size={10} />{t.total_equipos} equipos{t.cupos ? ` / ${t.cupos}` : ""}</span>
                  </div>
                  {t.owner_nombre && <p className="text-[11px] text-rodeo-cream/25 mt-0.5">Owner: {t.owner_nombre}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/torneos/${t.slug}`} target="_blank"
                    className="p-2 rounded-[8px] transition-colors hover:bg-white/8"
                    style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                    <ExternalLink size={13} className="text-rodeo-cream/40" />
                  </Link>
                  <button onClick={() => setConfirmDel(t)}
                    className="p-2 rounded-[8px] transition-colors hover:bg-red-500/10"
                    style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                    <Trash2 size={13} className="text-red-400/50 hover:text-red-400" />
                  </button>
                </div>
              </motion.div>
            );
          })}
          {filtrados.length === 0 && <p className="text-center py-10 text-rodeo-cream/30 text-sm">Sin resultados</p>}
        </div>
      )}

      {confirmDel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setConfirmDel(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "rgba(26,18,11,0.97)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, maxWidth: 360, width: "100%" }} className="p-6 space-y-4">
            <p className="font-black text-white">Eliminar torneo</p>
            <p className="text-sm text-rodeo-cream/60">¿Eliminar <strong className="text-white">{confirmDel.nombre}</strong> y todos sus equipos y partidos? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 py-2.5 rounded-[12px] text-sm font-bold text-rodeo-cream/60"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>Cancelar</button>
              <button onClick={() => eliminar(confirmDel)} disabled={!!deleting}
                className="flex-1 py-2.5 rounded-[12px] text-sm font-black text-white bg-red-500 hover:bg-red-600 disabled:opacity-40">
                {deleting ? <Loader size={14} className="animate-spin mx-auto" /> : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
