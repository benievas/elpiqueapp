"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase, supabaseMut } from "@/lib/supabase";
import {
  Calendar, Search, RefreshCw, Loader, Building2,
  CheckCircle2, Clock, XCircle, AlertCircle, User,
} from "lucide-react";

interface Reserva {
  id: string; fecha: string; hora_inicio: string; hora_fin: string;
  estado: string; precio_total: number; notas: string | null;
  user_id: string; court_id: string; complex_id: string;
  jugador_nombre?: string; jugador_email?: string;
  cancha_nombre?: string; complejo_nombre?: string;
}

const ESTADO_META: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  pendiente:  { icon: Clock,        color: "#FBBF24", bg: "rgba(251,191,36,0.1)",  label: "Pendiente"  },
  confirmada: { icon: CheckCircle2, color: "#4ADE80", bg: "rgba(74,222,128,0.1)",  label: "Confirmada" },
  completada: { icon: CheckCircle2, color: "#60A5FA", bg: "rgba(96,165,250,0.1)",  label: "Completada" },
  cancelada:  { icon: XCircle,      color: "#F87171", bg: "rgba(248,113,113,0.1)", label: "Cancelada"  },
};

const ESTADOS = ["todos", "pendiente", "confirmada", "completada", "cancelada"];
const PERIODOS = [{ label: "Hoy", days: 1 }, { label: "7 días", days: 7 }, { label: "30 días", days: 30 }, { label: "Todo", days: 0 }];

export default function AdminReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [periodo, setPeriodo] = useState(30);

  useEffect(() => { load(); }, [periodo]);

  async function load() {
    setLoading(true);
    try {
      let q = supabase
        .from("reservations")
        .select("id, fecha, hora_inicio, hora_fin, estado, precio_total, notas, user_id, court_id, complex_id, profiles!user_id(nombre_completo, email), courts!court_id(nombre), complexes!complex_id(nombre)")
        .order("fecha", { ascending: false })
        .order("hora_inicio", { ascending: false });

      if (periodo > 0) {
        const desde = new Date(); desde.setDate(desde.getDate() - periodo);
        q = q.gte("fecha", desde.toISOString().split("T")[0]);
      }

      const { data } = await q.limit(200);
      setReservas((data || []).map((r: any) => ({
        ...r,
        jugador_nombre: r.profiles?.nombre_completo,
        jugador_email: r.profiles?.email,
        cancha_nombre: r.courts?.nombre,
        complejo_nombre: r.complexes?.nombre,
      })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function cambiarEstado(id: string, estado: string) {
    await supabaseMut.from("reservations").update({ estado }).eq("id", id);
    setReservas(prev => prev.map(r => r.id === id ? { ...r, estado } : r));
  }

  const filtradas = reservas.filter(r => {
    const matchEstado = filtroEstado === "todos" || r.estado === filtroEstado;
    const q = busqueda.toLowerCase();
    const matchQ = !q || [r.jugador_nombre, r.jugador_email, r.complejo_nombre, r.cancha_nombre].some(v => v?.toLowerCase().includes(q));
    return matchEstado && matchQ;
  });

  const totalIngresos = filtradas.filter(r => r.estado === "completada" || r.estado === "confirmada")
    .reduce((s, r) => s + r.precio_total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40">Admin</p>
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "28px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }}
            className="text-white"><span className="section-slash">/</span>Reservas</h1>
        </div>
        <button onClick={load} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }}
          className="px-3 py-2 text-xs text-rodeo-cream/60">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["pendiente", "confirmada", "completada", "cancelada"] as const).map(est => {
          const m = ESTADO_META[est];
          return (
            <div key={est} style={{ background: m.bg, border: `1px solid ${m.color}25`, borderRadius: 14 }} className="p-3">
              <p className="text-xl font-black" style={{ color: m.color }}>{reservas.filter(r => r.estado === est).length}</p>
              <p className="text-xs text-rodeo-cream/50">{m.label}</p>
            </div>
          );
        })}
      </div>

      <div style={{ background: "rgba(200,255,0,0.06)", border: "1px solid rgba(200,255,0,0.2)", borderRadius: 14 }} className="p-4 flex items-center justify-between">
        <p className="text-sm text-rodeo-cream/60">Ingresos (vista actual — confirmadas + completadas)</p>
        <p className="text-2xl font-black text-rodeo-lime">${totalIngresos.toLocaleString("es-AR")}</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-1 flex-wrap">
          {PERIODOS.map(p => (
            <button key={p.days} onClick={() => setPeriodo(p.days)}
              style={periodo === p.days
                ? { background: "rgba(200,255,0,0.15)", border: "1px solid rgba(200,255,0,0.3)", borderRadius: 8 }
                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}
              className={`px-3 py-2 text-xs font-bold ${periodo === p.days ? "text-rodeo-lime" : "text-rodeo-cream/50"}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rodeo-cream/30" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar jugador, cancha, complejo..."
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
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-rodeo-lime" /></div>
      ) : (
        <div className="space-y-2">
          {filtradas.map((r, i) => {
            const m = ESTADO_META[r.estado] ?? ESTADO_META.pendiente;
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.015 }}
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14 }}
                className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: m.bg }}>
                  <m.icon size={15} style={{ color: m.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-white">{r.cancha_nombre ?? "Cancha"}</p>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: m.bg, color: m.color }}>{m.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-rodeo-cream/40 flex-wrap">
                    <span className="flex items-center gap-1"><Building2 size={10} />{r.complejo_nombre ?? "—"}</span>
                    <span className="flex items-center gap-1"><User size={10} />{r.jugador_nombre ?? r.jugador_email ?? "—"}</span>
                    <span className="flex items-center gap-1"><Calendar size={10} />{r.fecha} · {r.hora_inicio}–{r.hora_fin}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-white">${r.precio_total.toLocaleString("es-AR")}</p>
                  {r.estado === "pendiente" && (
                    <button onClick={() => cambiarEstado(r.id, "cancelada")}
                      className="text-[10px] text-red-400/50 hover:text-red-400 transition-colors mt-1">
                      Cancelar
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
