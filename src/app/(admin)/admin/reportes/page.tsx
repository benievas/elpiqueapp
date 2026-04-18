"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { BarChart3, ChevronLeft, RefreshCw, TrendingUp, Calendar, Building2 } from "lucide-react";

interface ReservasDia { fecha: string; total: number; ingresos: number; }
interface TopComplejo { nombre: string; ciudad: string; total: number; ingresos: number; }

const PERIODOS = [
  { label: "7 días", days: 7 },
  { label: "30 días", days: 30 },
  { label: "90 días", days: 90 },
];

export default function AdminReportesPage() {
  const [periodo, setPeriodo] = useState(30);
  const [loading, setLoading] = useState(true);
  const [reservasDia, setReservasDia] = useState<ReservasDia[]>([]);
  const [topComplejos, setTopComplejos] = useState<TopComplejo[]>([]);
  const [totales, setTotales] = useState({ reservas: 0, ingresos: 0, confirmadas: 0 });

  useEffect(() => { load(); }, [periodo]);

  async function load() {
    setLoading(true);
    try {
      const desde = new Date(); desde.setDate(desde.getDate() - periodo);
      const desdeISO = desde.toISOString().split("T")[0];

      const { data: reservas } = await supabase
        .from("reservations")
        .select("fecha, estado, precio_total, complex_id")
        .gte("fecha", desdeISO)
        .order("fecha") as { data: any[] | null };

      const data = reservas || [];

      // Totales
      const confirmadas = data.filter(r => ["confirmada", "completada"].includes(r.estado));
      const ingresosTotal = confirmadas.reduce((s: number, r: any) => s + (r.precio_total || 0), 0);
      setTotales({ reservas: data.length, ingresos: ingresosTotal, confirmadas: confirmadas.length });

      // Por día
      const porDia: Record<string, { total: number; ingresos: number }> = {};
      data.forEach((r: any) => {
        if (!porDia[r.fecha]) porDia[r.fecha] = { total: 0, ingresos: 0 };
        porDia[r.fecha].total++;
        if (["confirmada", "completada"].includes(r.estado)) porDia[r.fecha].ingresos += (r.precio_total || 0);
      });
      setReservasDia(Object.entries(porDia).map(([fecha, v]) => ({ fecha, ...v })).slice(-30));

      // Por complejo
      const porComplejo: Record<string, { total: number; ingresos: number }> = {};
      data.forEach((r: any) => {
        if (!porComplejo[r.complex_id]) porComplejo[r.complex_id] = { total: 0, ingresos: 0 };
        porComplejo[r.complex_id].total++;
        if (["confirmada", "completada"].includes(r.estado)) porComplejo[r.complex_id].ingresos += (r.precio_total || 0);
      });
      const topIds = Object.entries(porComplejo).sort((a, b) => b[1].total - a[1].total).slice(0, 8).map(([id]) => id);

      if (topIds.length) {
        const { data: comps } = await supabase.from("complexes").select("id, nombre, ciudad").in("id", topIds);
        setTopComplejos((comps || []).map((c: any) => ({
          nombre: c.nombre, ciudad: c.ciudad,
          total: porComplejo[c.id]?.total || 0,
          ingresos: porComplejo[c.id]?.ingresos || 0,
        })).sort((a, b) => b.total - a.total));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const maxDia = Math.max(...reservasDia.map(d => d.total), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
          <ChevronLeft size={20} className="text-rodeo-cream/50" />
        </Link>
        <div className="flex-1">
          <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40">Admin</p>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Reportes</h1>
        </div>
        <button onClick={load} disabled={loading}
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
          className="px-3 py-2 text-xs text-rodeo-cream/60 disabled:opacity-40">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Selector período */}
      <div className="flex gap-2">
        {PERIODOS.map(p => (
          <button key={p.days} onClick={() => setPeriodo(p.days)}
            style={periodo === p.days
              ? { background: "rgba(200,255,0,0.15)", border: "1px solid rgba(200,255,0,0.3)", borderRadius: "10px" }
              : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px" }}
            className={`px-4 py-2 text-xs font-bold transition-all ${periodo === p.days ? "text-rodeo-lime" : "text-rodeo-cream/50"}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Calendar, label: "Reservas totales", value: totales.reservas, color: "#A78BFA" },
            { icon: TrendingUp, label: "Confirmadas/completadas", value: totales.confirmadas, color: "#34D399" },
            { icon: BarChart3, label: "Ingresos estimados", value: `$${totales.ingresos.toLocaleString("es-AR")}`, color: "#C8FF00" },
          ].map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px" }}
              className="p-5">
              <k.icon size={18} style={{ color: k.color }} className="mb-3" />
              <p className="text-2xl font-black text-white">{k.value}</p>
              <p className="text-xs text-rodeo-cream/40 mt-0.5">{k.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Gráfico de reservas por día */}
      {!loading && reservasDia.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px" }}
          className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={16} className="text-rodeo-lime" />
            <p className="text-sm font-black text-white uppercase tracking-wide">Reservas por día</p>
          </div>
          <div className="flex items-end gap-1 h-32 overflow-x-auto pb-2">
            {reservasDia.map((d) => (
              <div key={d.fecha} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: 20 }}>
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{ height: `${Math.round((d.total / maxDia) * 100)}%`, minHeight: 4, background: "rgba(200,255,0,0.7)", width: 16 }}
                  title={`${d.fecha}: ${d.total} reservas`}
                />
                <span className="text-[8px] text-rodeo-cream/20 rotate-45 origin-left" style={{ fontSize: 7 }}>
                  {d.fecha.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Top complejos */}
      {!loading && topComplejos.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px" }}
          className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 size={16} className="text-rodeo-lime" />
            <p className="text-sm font-black text-white uppercase tracking-wide">Complejos más activos</p>
          </div>
          <div className="space-y-3">
            {topComplejos.map((c, i) => (
              <div key={c.nombre} className="flex items-center gap-4">
                <span className="text-xs font-black text-rodeo-cream/30 w-5 shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-white truncate">{c.nombre}</p>
                    <p className="text-xs text-rodeo-cream/40 shrink-0 ml-2">{c.total} reservas</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-rodeo-lime/70 transition-all"
                      style={{ width: `${(c.total / (topComplejos[0]?.total || 1)) * 100}%` }} />
                  </div>
                </div>
                <p className="text-xs font-bold text-rodeo-lime shrink-0">${c.ingresos.toLocaleString("es-AR")}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 120, borderRadius: 18, background: "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.5s infinite" }} />
          ))}
        </div>
      )}
    </div>
  );
}
