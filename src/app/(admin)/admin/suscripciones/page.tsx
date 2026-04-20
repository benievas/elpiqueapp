"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { supabase, supabaseMut } from "@/lib/supabase";
import { CreditCard, ChevronLeft, RefreshCw, CheckCircle2, Clock, AlertCircle, Search, Zap } from "lucide-react";

interface Sub {
  id: string; owner_id: string; estado: string;
  fecha_inicio: string | null; fecha_fin: string | null; plan: string | null;
  owner_email?: string; owner_nombre?: string; complejo_nombre?: string;
}

const ESTADOS = ["Todos", "active", "trial", "expired"];
const ESTADO_META: Record<string, { icon: any; color: string; label: string; bg: string }> = {
  active:  { icon: CheckCircle2, color: "#4ADE80", label: "Activa",   bg: "rgba(74,222,128,0.1)" },
  trial:   { icon: Clock,        color: "#FBBF24", label: "Trial",    bg: "rgba(251,191,36,0.1)" },
  expired: { icon: AlertCircle,  color: "#F87171", label: "Vencida",  bg: "rgba(248,113,113,0.1)" },
};

export default function AdminSuscripcionesPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("subscriptions")
        .select("id, owner_id, estado, fecha_inicio, fecha_fin, plan, profiles!owner_id(email, nombre_completo)")
        .order("created_at", { ascending: false }) as { data: any[] | null };

      const ownerIds = (data || []).map((s: any) => s.owner_id);
      let compMap: Record<string, string> = {};
      if (ownerIds.length) {
        const { data: comps } = await supabase.from("complexes").select("owner_id, nombre").in("owner_id", ownerIds);
        (comps || []).forEach((c: any) => { compMap[c.owner_id] = c.nombre; });
      }

      setSubs((data || []).map((s: any) => ({
        ...s,
        owner_email: Array.isArray(s.profiles) ? s.profiles[0]?.email : s.profiles?.email,
        owner_nombre: Array.isArray(s.profiles) ? s.profiles[0]?.nombre_completo : s.profiles?.nombre_completo,
        complejo_nombre: compMap[s.owner_id],
      })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function activarTrial(sub: Sub) {
    setActivating(sub.id);
    const now = new Date();
    const fin = new Date(now); fin.setDate(fin.getDate() + 14);
    await supabaseMut.from("subscriptions").update({
      estado: "trial",
      fecha_inicio: now.toISOString().split("T")[0],
      fecha_fin: fin.toISOString().split("T")[0],
    }).eq("id", sub.id);
    setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, estado: "trial", fecha_inicio: now.toISOString().split("T")[0], fecha_fin: fin.toISOString().split("T")[0] } : s));
    setActivating(null);
  }

  async function marcarActiva(sub: Sub) {
    setActivating(sub.id);
    const now = new Date();
    const fin = new Date(now); fin.setFullYear(fin.getFullYear() + 1);
    await supabaseMut.from("subscriptions").update({
      estado: "active",
      fecha_inicio: now.toISOString().split("T")[0],
      fecha_fin: fin.toISOString().split("T")[0],
    }).eq("id", sub.id);
    setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, estado: "active" } : s));
    setActivating(null);
  }

  const filtradas = subs.filter(s =>
    (filtroEstado === "Todos" || s.estado === filtroEstado) &&
    ((s.owner_email ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
     (s.owner_nombre ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
     (s.complejo_nombre ?? "").toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
          <ChevronLeft size={20} className="text-rodeo-cream/50" />
        </Link>
        <div className="flex-1">
          <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40">Admin</p>
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "28px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }} className="text-white"><span className="section-slash">/</span>Suscripciones</h1>
        </div>
        <button onClick={load} disabled={loading}
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
          className="px-3 py-2 text-xs text-rodeo-cream/60 disabled:opacity-40">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        {["active", "trial", "expired"].map(est => {
          const m = ESTADO_META[est]; const count = subs.filter(s => s.estado === est).length;
          return (
            <div key={est} style={{ background: m.bg, border: `1px solid ${m.color}25`, borderRadius: "14px" }} className="p-4 flex items-center gap-3">
              <m.icon size={18} style={{ color: m.color }} />
              <div>
                <p className="text-xl font-black" style={{ color: m.color }}>{count}</p>
                <p className="text-xs text-rodeo-cream/50">{m.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rodeo-cream/30" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar owner o complejo..."
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
            className="w-full pl-8 pr-3 py-2.5 text-sm text-white placeholder:text-rodeo-cream/25 focus:outline-none" />
        </div>
        <div className="flex gap-1">
          {ESTADOS.map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)}
              style={filtroEstado === e ? { background: "rgba(200,255,0,0.15)", border: "1px solid rgba(200,255,0,0.3)", borderRadius: "8px" } : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px" }}
              className={`px-3 py-2 text-xs font-bold transition-all ${filtroEstado === e ? "text-rodeo-lime" : "text-rodeo-cream/50"}`}>
              {e === "Todos" ? "Todos" : ESTADO_META[e].label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ height: 88, borderRadius: 14, background: "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.5s infinite" }} />)}</div>
      ) : (
        <div className="space-y-2">
          {filtradas.map((s, i) => {
            const m = ESTADO_META[s.estado] ?? ESTADO_META.expired;
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px" }}
                className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: m.bg }}>
                  <CreditCard size={15} style={{ color: m.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{s.owner_nombre ?? s.owner_email}</p>
                  <p className="text-xs text-rodeo-cream/40">{s.complejo_nombre ?? "Sin complejo"}</p>
                  {s.fecha_fin && (
                    <p className="text-[11px] text-rodeo-cream/30 mt-0.5">
                      {s.estado === "expired" ? "Venció" : "Vence"} {new Date(s.fecha_fin).toLocaleDateString("es-AR")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: m.bg, color: m.color }}>{m.label}</span>
                  {s.estado !== "trial" && (
                    <button onClick={() => activarTrial(s)} disabled={activating === s.id}
                      style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "8px" }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-yellow-400 hover:bg-yellow-400/20 transition-all disabled:opacity-40">
                      {activating === s.id ? <RefreshCw size={10} className="animate-spin" /> : <Clock size={11} />} Trial 14d
                    </button>
                  )}
                  {s.estado !== "active" && (
                    <button onClick={() => marcarActiva(s)} disabled={activating === s.id}
                      style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: "8px" }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-green-400 hover:bg-green-400/20 transition-all disabled:opacity-40">
                      {activating === s.id ? <RefreshCw size={10} className="animate-spin" /> : <Zap size={11} />} Activar
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
          {filtradas.length === 0 && <p className="text-center py-10 text-rodeo-cream/30 text-sm">Sin resultados</p>}
        </div>
      )}
    </div>
  );
}
