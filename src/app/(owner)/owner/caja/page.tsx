"use client";
export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect, useCallback } from "react";
import { useActiveComplex } from "@/lib/context/ActiveComplexContext";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase, supabaseMut } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Plus, Trash2, CheckCircle2,
  AlertCircle, TrendingUp, TrendingDown, Calendar as CalendarIcon, History,
  ChevronDown, ChevronRight,
} from "lucide-react";
import type { CashMovement } from "@/types/database";

type TipoMovimiento = "ingreso" | "egreso";

const CONCEPTOS_INGRESO = [
  "Fondo inicial / Apertura",
  "Reserva cancha fútbol",
  "Reserva cancha padel",
  "Reserva cancha tenis",
  "Reserva cancha vóley",
  "Reserva cancha básquet",
  "Alquiler de equipo",
  "Inscripción torneo",
  "Buffet / cantina",
  "Otro ingreso",
];

const CONCEPTOS_EGRESO = [
  "Mantenimiento",
  "Limpieza",
  "Servicios (luz/agua/gas)",
  "Insumos",
  "Personal",
  "Publicidad",
  "Retiro de caja / Cierre",
  "Otro egreso",
];

function formatMoney(n: number) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}
function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return new Date(+y, +m - 1, +d).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
}

const HOY = typeof window !== "undefined" ? new Date().toISOString().split("T")[0] : "";

// ─── Historial agrupado por día ────────────────────────────────────────────────
type DaySummary = {
  fecha: string;
  ingresos: number;
  egresos: number;
  balance: number;
  movimientos: CashMovement[];
};

function HistorialTab({ complexId }: { complexId: string }) {
  const [historial, setHistorial] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Últimos 60 días
      const desde = new Date();
      desde.setDate(desde.getDate() - 60);
      const { data } = await supabase
        .from("cash_movements")
        .select("*")
        .eq("complex_id", complexId)
        .gte("fecha", desde.toISOString())
        .order("fecha", { ascending: false });

      if (!data) { setLoading(false); return; }

      // Agrupar por fecha (YYYY-MM-DD)
      const porDia: Record<string, CashMovement[]> = {};
      for (const m of data as CashMovement[]) {
        const dia = m.fecha.split("T")[0];
        if (!porDia[dia]) porDia[dia] = [];
        porDia[dia].push(m);
      }

      const resumen: DaySummary[] = Object.entries(porDia)
        .map(([fecha, movs]) => ({
          fecha,
          ingresos: movs.filter(m => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0),
          egresos: movs.filter(m => m.tipo === "egreso").reduce((s, m) => s + m.monto, 0),
          balance: movs.filter(m => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0)
                 - movs.filter(m => m.tipo === "egreso").reduce((s, m) => s + m.monto, 0),
          movimientos: movs,
        }))
        .sort((a, b) => b.fecha.localeCompare(a.fecha));

      setHistorial(resumen);
      setLoading(false);
    };
    load();
  }, [complexId]);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 border-2 border-rodeo-lime/30 border-t-rodeo-lime rounded-full animate-spin" />
    </div>
  );

  if (!historial.length) return (
    <div className="p-10 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px" }}>
      <History size={28} className="text-rodeo-cream/20 mx-auto mb-2" />
      <p className="text-sm text-rodeo-cream/40">No hay movimientos registrados aún.</p>
    </div>
  );

  // Totales del período
  const totalIngresos = historial.reduce((s, d) => s + d.ingresos, 0);
  const totalEgresos = historial.reduce((s, d) => s + d.egresos, 0);

  return (
    <div className="space-y-4">
      {/* Resumen período */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Ingresos (60d)", valor: totalIngresos, color: "text-green-400", bg: "rgba(74,222,128,0.07)" },
          { label: "Egresos (60d)", valor: totalEgresos, color: "text-red-400", bg: "rgba(255,64,64,0.07)" },
          { label: "Balance neto", valor: totalIngresos - totalEgresos, color: totalIngresos - totalEgresos >= 0 ? "text-rodeo-lime" : "text-red-400", bg: "rgba(200,255,0,0.06)" },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px" }} className="p-4 text-center">
            <p className="text-[10px] font-bold text-rodeo-cream/40 uppercase tracking-widest mb-1">{c.label}</p>
            <p className={`text-lg font-black ${c.color}`}>{formatMoney(c.valor)}</p>
          </div>
        ))}
      </div>

      {/* Lista por día */}
      <div className="space-y-2">
        {historial.map((dia) => {
          const isHoy = dia.fecha === HOY;
          const isExpanded = expandedDay === dia.fecha;
          return (
            <div key={dia.fecha} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${isHoy ? "rgba(200,255,0,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: "14px" }}>
              <button
                className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                onClick={() => setExpandedDay(isExpanded ? null : dia.fecha)}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white capitalize">{formatDate(dia.fecha)}</p>
                      {isHoy && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rodeo-lime/20 text-rodeo-lime">HOY</span>}
                    </div>
                    <p className="text-[10px] text-rodeo-cream/40 mt-0.5">{dia.movimientos.length} movimiento{dia.movimientos.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-green-400 font-bold">+{formatMoney(dia.ingresos)}</p>
                    <p className="text-xs text-red-400">−{formatMoney(dia.egresos)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-black ${dia.balance >= 0 ? "text-rodeo-lime" : "text-red-400"}`}>
                      {dia.balance >= 0 ? "+" : ""}{formatMoney(dia.balance)}
                    </p>
                  </div>
                  {isExpanded ? <ChevronDown size={14} className="text-rodeo-cream/40" /> : <ChevronRight size={14} className="text-rodeo-cream/40" />}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-1.5 border-t border-white/5 pt-3">
                      {dia.movimientos.map(m => (
                        <div key={m.id} className="flex items-center justify-between py-1.5 px-3 rounded-[10px]" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1 rounded-[6px] ${m.tipo === "ingreso" ? "bg-green-400/10" : "bg-red-400/10"}`}>
                              {m.tipo === "ingreso"
                                ? <TrendingUp size={12} className="text-green-400" />
                                : <TrendingDown size={12} className="text-red-400" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{m.categoria}</p>
                              <p className="text-[10px] text-rodeo-cream/30 font-mono">{formatTime(m.fecha)}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-black ${m.tipo === "ingreso" ? "text-green-400" : "text-red-400"}`}>
                            {m.tipo === "egreso" ? "−" : "+"}{formatMoney(m.monto)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CajaPage() {
  const { user } = useAuth();
  const { activeComplexId } = useActiveComplex();

  const [activeTab, setActiveTab] = useState<"hoy" | "historial">("hoy");
  const [dateFilter, setDateFilter] = useState(HOY);
  const [movimientos, setMovimientos] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [tipo, setTipo] = useState<TipoMovimiento>("ingreso");
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchMovimientos = useCallback(async () => {
    if (!activeComplexId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("cash_movements")
      .select("*")
      .eq("complex_id", activeComplexId)
      .gte("fecha", `${dateFilter}T00:00:00.000Z`)
      .lte("fecha", `${dateFilter}T23:59:59.999Z`)
      .order("fecha", { ascending: false });
    if (!error && data) setMovimientos(data);
    setLoading(false);
  }, [activeComplexId, dateFilter]);

  useEffect(() => {
    if (!activeComplexId) return;
    fetchMovimientos();
    const channel = supabase
      .channel(`caja-${activeComplexId}-${dateFilter}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cash_movements", filter: `complex_id=eq.${activeComplexId}` }, fetchMovimientos)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeComplexId, dateFilter, fetchMovimientos]);

  const handleAgregarMovimiento = async () => {
    const montoNum = parseFloat(monto);
    if (!concepto || !monto || isNaN(montoNum) || montoNum <= 0 || !user || !activeComplexId) return;
    setActionLoading(true);
    setActionError("");
    const { error } = await supabaseMut.from("cash_movements").insert({
      complex_id: activeComplexId,
      user_id: user.id,
      tipo,
      categoria: concepto,
      monto: montoNum,
      metodo_pago: "efectivo",
      fecha: new Date().toISOString(),
    });
    if (error) setActionError(error.message);
    else { setMonto(""); setConcepto(""); setShowForm(false); }
    setActionLoading(false);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Eliminar este movimiento?")) return;
    await supabaseMut.from("cash_movements").delete().eq("id", id);
  };

  const fondo = useMemo(() => movimientos.filter(m => m.categoria === "Fondo inicial / Apertura").reduce((s, m) => s + m.monto, 0), [movimientos]);
  const totalIngresos = useMemo(() => movimientos.filter(m => m.tipo === "ingreso" && m.categoria !== "Fondo inicial / Apertura").reduce((s, m) => s + m.monto, 0), [movimientos]);
  const totalEgresos = useMemo(() => movimientos.filter(m => m.tipo === "egreso").reduce((s, m) => s + m.monto, 0), [movimientos]);
  const saldoFinal = fondo + totalIngresos - totalEgresos;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "32px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }} className="text-white">Caja y Cierre</h1>
          <p className="text-xs text-rodeo-cream/50 mt-1">Control diario · Historial de 60 días</p>
        </div>
        {activeTab === "hoy" && (
          <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-[12px]">
            <CalendarIcon size={14} className="text-rodeo-cream/50 ml-2" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-sm font-bold text-white border-0 outline-none pr-3"
              style={{ colorScheme: "dark" }}
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-[14px]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {([
          { key: "hoy", label: "📋 Hoy" },
          { key: "historial", label: "📊 Historial" },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2.5 text-sm font-black rounded-[10px] transition-all"
            style={activeTab === tab.key
              ? { background: "rgba(200,255,0,0.9)", color: "#1A120B" }
              : { color: "rgba(225,212,194,0.5)" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Historial */}
      {activeTab === "historial" && activeComplexId && (
        <HistorialTab complexId={activeComplexId} />
      )}

      {/* Tab: Hoy */}
      {activeTab === "hoy" && (
        loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-rodeo-lime/30 border-t-rodeo-lime rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Fondo inicial", valor: fondo, color: "text-white", bg: "rgba(255,255,255,0.05)" },
                { label: "Ingresos", valor: totalIngresos, color: "text-green-400", bg: "rgba(74,222,128,0.08)" },
                { label: "Egresos", valor: totalEgresos, color: "text-red-400", bg: "rgba(255,64,64,0.08)" },
                { label: "Saldo en Caja", valor: saldoFinal, color: "text-rodeo-lime", bg: "rgba(200,255,0,0.1)", border: "border-rodeo-lime/30" },
              ].map((card) => (
                <div key={card.label} style={{ background: card.bg }} className={`p-4 rounded-[16px] text-center border ${card.border || "border-white/5"}`}>
                  <p className="text-[10px] font-bold text-rodeo-cream/50 uppercase tracking-widest mb-1">{card.label}</p>
                  <p className={`text-xl font-black ${card.color}`}>{formatMoney(card.valor)}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Movimientos del día</h2>
              <button
                onClick={() => setShowForm(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rodeo-lime text-rodeo-dark rounded-[10px] text-xs font-black hover:opacity-90 transition-all"
              >
                <Plus size={14} /> Registrar
                <ChevronDown size={14} className={`transition-transform ${showForm ? "rotate-180" : ""}`} />
              </button>
            </div>

            <AnimatePresence>
              {showForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px" }} className="p-5 space-y-4 mb-4">
                    <div className="flex gap-2">
                      {(["ingreso", "egreso"] as TipoMovimiento[]).map(t => (
                        <button key={t} onClick={() => { setTipo(t); setConcepto(""); }}
                          className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all rounded-[10px] ${
                            tipo === t
                              ? (t === "ingreso" ? "bg-green-400/20 border-green-400/40 text-green-400 border" : "bg-red-400/20 border-red-400/40 text-red-400 border")
                              : "bg-white/5 border-white/10 text-rodeo-cream/50 border"
                          }`}
                        >
                          {t === "ingreso" ? "Ingreso (+)" : "Egreso (-)"}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-rodeo-cream/40 uppercase tracking-widest">Concepto</label>
                        <select value={concepto} onChange={e => setConcepto(e.target.value)}
                          className="w-full px-3.5 py-3 text-sm text-white bg-white/5 border border-white/10 rounded-[10px] focus:outline-none focus:border-rodeo-lime/40">
                          <option value="" style={{ background: "#1A120B" }}>Seleccionar...</option>
                          {(tipo === "ingreso" ? CONCEPTOS_INGRESO : CONCEPTOS_EGRESO).map(c => (
                            <option key={c} value={c} style={{ background: "#1A120B" }}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-rodeo-cream/40 uppercase tracking-widest">Monto (ARS)</label>
                        <div className="relative">
                          <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/40" />
                          <input type="number" placeholder="0" value={monto} onChange={e => setMonto(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 text-white font-bold bg-white/5 border border-white/10 rounded-[10px] focus:outline-none focus:border-rodeo-lime/40" />
                        </div>
                      </div>
                    </div>
                    {actionError && (
                      <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                        <AlertCircle size={13} /> {actionError}
                      </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-white/5 text-rodeo-cream/60 rounded-[10px] text-xs font-bold hover:bg-white/10">
                        Cancelar
                      </button>
                      <button onClick={handleAgregarMovimiento}
                        disabled={!concepto || !monto || parseFloat(monto) <= 0 || actionLoading}
                        className="px-6 py-2 bg-rodeo-lime text-rodeo-dark rounded-[10px] text-xs font-black disabled:opacity-50 flex items-center gap-2">
                        {actionLoading ? <div className="w-3.5 h-3.5 border-2 border-rodeo-dark/30 border-t-rodeo-dark rounded-full animate-spin" /> : <CheckCircle2 size={14} />}
                        Guardar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              {movimientos.length === 0 ? (
                <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-[16px]">
                  <History size={28} className="text-rodeo-cream/20 mx-auto mb-2" />
                  <p className="text-sm text-rodeo-cream/40">Sin movimientos para este día.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {movimientos.map(m => (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                      className="flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] rounded-[12px] transition-colors gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-1.5 rounded-[8px] shrink-0 ${m.tipo === "ingreso" ? "bg-green-400/10" : "bg-red-400/10"}`}>
                          {m.tipo === "ingreso" ? <TrendingUp size={14} className="text-green-400" /> : <TrendingDown size={14} className="text-red-400" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{m.categoria}</p>
                          <p className="text-[10px] text-rodeo-cream/40 font-mono tracking-widest">{formatTime(m.fecha)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className={`text-sm font-black ${m.tipo === "ingreso" ? "text-green-400" : "text-red-400"}`}>
                          {m.tipo === "egreso" ? "−" : "+"}{formatMoney(m.monto)}
                        </span>
                        <button onClick={() => handleEliminar(m.id)} className="text-rodeo-cream/20 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </>
        )
      )}
    </div>
  );
}
