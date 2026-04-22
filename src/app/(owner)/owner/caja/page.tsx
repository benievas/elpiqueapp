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
  ChevronDown, ChevronRight, Lock, Unlock, LockKeyhole
} from "lucide-react";

type TipoMovimiento = "ingreso" | "egreso";

type CashSession = {
  id: string;
  complex_id: string;
  opened_by: string;
  closed_by: string | null;
  opened_at: string;
  closed_at: string | null;
  fondo_inicial: number;
  saldo_final: number | null;
  notas_cierre: string | null;
  estado: "abierta" | "cerrada";
};

type CashMovement = {
  id: string;
  complex_id: string;
  user_id: string;
  session_id: string;
  tipo: TipoMovimiento;
  categoria: string;
  monto: number;
  metodo_pago: string;
  fecha: string;
  notas?: string | null;
};

const CONCEPTOS_INGRESO = [
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
  "Retiro de caja",
  "Otro egreso",
];

function formatMoney(n: number) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}
function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("T")[0].split("-");
  return new Date(+y, +m - 1, +d).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
  });
}

function HistorialTab({ complexId }: { complexId: string }) {
  const [sesiones, setSesiones] = useState<(CashSession & { movimientos: CashMovement[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Últimas sesiones cerradas
      const { data: sessionsData } = await supabase
        .from("cash_sessions")
        .select("*")
        .eq("complex_id", complexId)
        .eq("estado", "cerrada")
        .order("closed_at", { ascending: false })
        .limit(30);

      if (!sessionsData || sessionsData.length === 0) {
        setLoading(false);
        return;
      }

      const sessionIds = sessionsData.map(s => s.id);
      
      const { data: movsData } = await supabase
        .from("cash_movements")
        .select("*")
        .in("session_id", sessionIds)
        .order("fecha", { ascending: false });

      const movsBySession: Record<string, CashMovement[]> = {};
      if (movsData) {
        for (const m of movsData) {
          if (!movsBySession[m.session_id]) movsBySession[m.session_id] = [];
          movsBySession[m.session_id].push(m);
        }
      }

      setSesiones(sessionsData.map(s => ({
        ...s,
        movimientos: movsBySession[s.id] || []
      })));
      
      setLoading(false);
    };
    load();
  }, [complexId]);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 border-2 border-rodeo-lime/30 border-t-rodeo-lime rounded-full animate-spin" />
    </div>
  );

  if (!sesiones.length) return (
    <div className="p-10 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px" }}>
      <History size={28} className="text-rodeo-cream/20 mx-auto mb-2" />
      <p className="text-sm text-rodeo-cream/40">No hay sesiones de caja cerradas aún.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {sesiones.map((sesion) => {
        const isExpanded = expandedId === sesion.id;
        const totalIngresos = sesion.movimientos.filter(m => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0);
        const totalEgresos = sesion.movimientos.filter(m => m.tipo === "egreso").reduce((s, m) => s + m.monto, 0);
        const saldoNeto = totalIngresos - totalEgresos;

        return (
          <div key={sesion.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px" }}>
            <button
              className="w-full flex flex-col md:flex-row md:items-center justify-between px-4 py-3.5 text-left gap-3"
              onClick={() => setExpandedId(isExpanded ? null : sesion.id)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-[10px]">
                  <LockKeyhole size={18} className="text-rodeo-cream/40" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">Sesión cerrada</p>
                    <span className="text-[10px] font-mono text-rodeo-cream/40">
                      {formatDateTime(sesion.opened_at)} — {sesion.closed_at ? formatTime(sesion.closed_at) : ""}
                    </span>
                  </div>
                  <p className="text-[11px] text-rodeo-cream/50 mt-0.5">
                    Fondo inicial: {formatMoney(sesion.fondo_inicial)} • {sesion.movimientos.length} movimientos
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 w-full md:w-auto mt-2 md:mt-0 border-t md:border-0 border-white/5 pt-2 md:pt-0">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-green-400 font-bold">+{formatMoney(totalIngresos)}</p>
                  <p className="text-xs text-red-400">−{formatMoney(totalEgresos)}</p>
                </div>
                <div className="text-right flex-1 md:flex-initial">
                  <p className="text-[10px] text-rodeo-cream/40 font-bold uppercase tracking-widest mb-0.5">Saldo Final</p>
                  <p className="text-base font-black text-white">
                    {formatMoney(sesion.saldo_final || 0)}
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
                    {sesion.notas_cierre && (
                      <div className="mb-3 p-3 bg-white/5 rounded-[8px] border border-white/10">
                        <p className="text-xs font-bold text-rodeo-cream/60 mb-1">Notas de cierre:</p>
                        <p className="text-sm text-rodeo-cream/80">{sesion.notas_cierre}</p>
                      </div>
                    )}
                    
                    {sesion.movimientos.map(m => (
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
                    {sesion.movimientos.length === 0 && (
                      <p className="text-xs text-center py-2 text-rodeo-cream/30">Sin movimientos en esta sesión.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default function CajaPage() {
  const { user } = useAuth();
  const { activeComplexId } = useActiveComplex();

  const [activeTab, setActiveTab] = useState<"hoy" | "historial">("hoy");
  const [session, setSession] = useState<CashSession | null>(null);
  const [movimientos, setMovimientos] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de formularios
  const [showForm, setShowForm] = useState(false);
  const [tipo, setTipo] = useState<TipoMovimiento>("ingreso");
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const [showOpenForm, setShowOpenForm] = useState(false);
  const [fondoInicial, setFondoInicial] = useState("");

  const [showCloseForm, setShowCloseForm] = useState(false);
  const [notasCierre, setNotasCierre] = useState("");

  const fetchCurrentSession = useCallback(async () => {
    if (!activeComplexId) return;
    setLoading(true);
    
    // Buscar sesión abierta
    const { data: sessionData } = await supabase
      .from("cash_sessions")
      .select("*")
      .eq("complex_id", activeComplexId)
      .eq("estado", "abierta")
      .maybeSingle();
      
    if (sessionData) {
      setSession(sessionData);
      // Cargar movimientos de esta sesión
      const { data: movsData } = await supabase
        .from("cash_movements")
        .select("*")
        .eq("session_id", sessionData.id)
        .order("fecha", { ascending: false });
        
      if (movsData) setMovimientos(movsData);
    } else {
      setSession(null);
      setMovimientos([]);
    }
    
    setLoading(false);
  }, [activeComplexId]);

  useEffect(() => {
    if (!activeComplexId) return;
    fetchCurrentSession();
    
    const channel1 = supabase
      .channel(`caja-sesiones-${activeComplexId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cash_sessions", filter: `complex_id=eq.${activeComplexId}` }, fetchCurrentSession)
      .subscribe();
      
    const channel2 = supabase
      .channel(`caja-movs-${activeComplexId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cash_movements", filter: `complex_id=eq.${activeComplexId}` }, fetchCurrentSession)
      .subscribe();
      
    return () => { 
      supabase.removeChannel(channel1); 
      supabase.removeChannel(channel2); 
    };
  }, [activeComplexId, fetchCurrentSession]);

  const handleAbrirCaja = async () => {
    const fondoNum = parseFloat(fondoInicial) || 0;
    if (isNaN(fondoNum) || !user || !activeComplexId) return;
    
    setActionLoading(true);
    setActionError("");
    
    const { data, error } = await supabaseMut
      .from("cash_sessions")
      .insert({
        complex_id: activeComplexId,
        opened_by: user.id,
        fondo_inicial: fondoNum,
        estado: "abierta"
      })
      .select()
      .single();
      
    if (error) {
      setActionError(error.message);
    } else {
      setFondoInicial("");
      setShowOpenForm(false);
      setSession(data);
    }
    setActionLoading(false);
  };

  const handleCerrarCaja = async () => {
    if (!session || !user) return;
    
    setActionLoading(true);
    setActionError("");
    
    const totalIngresos = movimientos.filter(m => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0);
    const totalEgresos = movimientos.filter(m => m.tipo === "egreso").reduce((s, m) => s + m.monto, 0);
    const saldoFinal = session.fondo_inicial + totalIngresos - totalEgresos;
    
    const { error } = await supabaseMut
      .from("cash_sessions")
      .update({
        closed_by: user.id,
        closed_at: new Date().toISOString(),
        saldo_final: saldoFinal,
        notas_cierre: notasCierre.trim() || null,
        estado: "cerrada"
      })
      .eq("id", session.id);
      
    if (error) {
      setActionError(error.message);
    } else {
      setNotasCierre("");
      setShowCloseForm(false);
      setSession(null);
      setMovimientos([]);
    }
    setActionLoading(false);
  };

  const handleAgregarMovimiento = async () => {
    const montoNum = parseFloat(monto);
    if (!concepto || !monto || isNaN(montoNum) || montoNum <= 0 || !user || !activeComplexId || !session) return;
    
    setActionLoading(true);
    setActionError("");
    
    const { error } = await supabaseMut.from("cash_movements").insert({
      complex_id: activeComplexId,
      user_id: user.id,
      session_id: session.id,
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

  const handleEliminarMovimiento = async (id: string) => {
    if (!confirm("¿Eliminar este movimiento?")) return;
    await supabaseMut.from("cash_movements").delete().eq("id", id);
  };

  const totalIngresos = useMemo(() => movimientos.filter(m => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0), [movimientos]);
  const totalEgresos = useMemo(() => movimientos.filter(m => m.tipo === "egreso").reduce((s, m) => s + m.monto, 0), [movimientos]);
  const saldoActual = session ? session.fondo_inicial + totalIngresos - totalEgresos : 0;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "32px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }} className="text-white">Caja y Turnos</h1>
          <p className="text-xs text-rodeo-cream/50 mt-1">Control de sesiones de caja y movimientos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-[14px]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {([
          { key: "hoy", label: "🟢 Sesión Actual" },
          { key: "historial", label: "📊 Historial Cerradas" },
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

      {/* Tab: Hoy (Sesión Actual) */}
      {activeTab === "hoy" && (
        loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-rodeo-lime/30 border-t-rodeo-lime rounded-full animate-spin" />
          </div>
        ) : !session ? (
          /* Estado sin sesión abierta */
          <div className="p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "16px" }}>
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Lock size={28} className="text-rodeo-cream/40" />
            </div>
            <h2 className="text-lg font-black text-white mb-2">La caja está cerrada</h2>
            <p className="text-sm text-rodeo-cream/50 mb-6">Debés abrir la caja para comenzar a registrar ingresos y egresos del turno.</p>
            
            {showOpenForm ? (
              <div className="max-w-xs mx-auto space-y-4 p-5 bg-white/5 rounded-[14px] border border-white/10 text-left">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-rodeo-cream/40 uppercase tracking-widest">Fondo Inicial (Opcional)</label>
                  <div className="relative">
                    <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/40" />
                    <input type="number" placeholder="0" value={fondoInicial} onChange={e => setFondoInicial(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-white font-bold bg-white/5 border border-white/10 rounded-[10px] focus:outline-none focus:border-rodeo-lime/40" />
                  </div>
                  <p className="text-[10px] text-rodeo-cream/30 mt-1">Efectivo de cambio en caja al abrir.</p>
                </div>
                {actionError && <p className="text-xs text-red-400 font-bold">{actionError}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setShowOpenForm(false)} className="flex-1 py-2.5 bg-white/5 text-white font-bold text-sm rounded-[10px] hover:bg-white/10">Cancelar</button>
                  <button onClick={handleAbrirCaja} disabled={actionLoading} className="flex-1 py-2.5 bg-rodeo-lime text-rodeo-dark font-black text-sm rounded-[10px] hover:opacity-90 flex justify-center items-center gap-2">
                    {actionLoading ? <div className="w-4 h-4 border-2 border-rodeo-dark/30 border-t-rodeo-dark rounded-full animate-spin" /> : <Unlock size={16} />} Abrir Caja
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowOpenForm(true)}
                className="px-6 py-3 bg-rodeo-lime text-rodeo-dark rounded-[12px] text-sm font-black hover:opacity-90 transition-all flex items-center gap-2 mx-auto"
              >
                <Unlock size={18} /> Abrir Caja
              </button>
            )}
          </div>
        ) : (
          /* Estado con sesión abierta */
          <>
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-[14px]">
              <div>
                <p className="text-[10px] font-bold text-rodeo-lime uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rodeo-lime animate-pulse" /> Caja Abierta
                </p>
                <p className="text-xs text-white mt-0.5">Desde {formatDateTime(session.opened_at)}</p>
              </div>
              <button 
                onClick={() => setShowCloseForm(!showCloseForm)}
                className="px-3 py-1.5 bg-red-400/10 text-red-400 border border-red-400/20 rounded-[8px] text-xs font-bold hover:bg-red-400/20 transition-all flex items-center gap-1.5"
              >
                <Lock size={12} /> Cerrar Caja
              </button>
            </div>

            <AnimatePresence>
              {showCloseForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="p-4 bg-red-400/5 border border-red-400/20 rounded-[14px] mt-3 space-y-3">
                    <div>
                      <p className="text-sm text-white font-bold flex justify-between"><span>Saldo final calculado:</span> <span>{formatMoney(saldoActual)}</span></p>
                      <p className="text-xs text-rodeo-cream/50 mt-1">Verificá que el dinero físico coincida con el saldo calculado.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-rodeo-cream/40 uppercase tracking-widest">Notas de cierre (opcional)</label>
                      <input type="text" placeholder="Diferencias, retiros, comentarios..." value={notasCierre} onChange={e => setNotasCierre(e.target.value)}
                        className="w-full px-3 py-2 text-sm text-white bg-black/20 border border-white/10 rounded-[8px] focus:outline-none focus:border-red-400/40" />
                    </div>
                    {actionError && <p className="text-xs text-red-400 font-bold">{actionError}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setShowCloseForm(false)} className="px-4 py-2 bg-white/5 text-white text-xs font-bold rounded-[8px]">Cancelar</button>
                      <button onClick={handleCerrarCaja} disabled={actionLoading} className="px-5 py-2 bg-red-500 text-white text-xs font-black rounded-[8px] flex items-center gap-2">
                        {actionLoading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock size={12} />} Confirmar Cierre
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Fondo inicial", valor: session.fondo_inicial, color: "text-white", bg: "rgba(255,255,255,0.05)" },
                { label: "Ingresos", valor: totalIngresos, color: "text-green-400", bg: "rgba(74,222,128,0.08)" },
                { label: "Egresos", valor: totalEgresos, color: "text-red-400", bg: "rgba(255,64,64,0.08)" },
                { label: "Saldo en Caja", valor: saldoActual, color: "text-rodeo-lime", bg: "rgba(200,255,0,0.1)", border: "border-rodeo-lime/30" },
              ].map((card) => (
                <div key={card.label} style={{ background: card.bg }} className={`p-4 rounded-[16px] text-center border ${card.border || "border-white/5"}`}>
                  <p className="text-[10px] font-bold text-rodeo-cream/50 uppercase tracking-widest mb-1">{card.label}</p>
                  <p className={`text-xl font-black ${card.color}`}>{formatMoney(card.valor)}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Movimientos del turno</h2>
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
                  <p className="text-sm text-rodeo-cream/40">Sin movimientos registrados aún en este turno.</p>
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
                        <button onClick={() => handleEliminarMovimiento(m.id)} className="text-rodeo-cream/20 hover:text-red-400 transition-colors">
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
