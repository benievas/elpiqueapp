"use client";
export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect, useCallback } from "react";
import { useActiveComplex } from "@/lib/context/ActiveComplexContext";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase, supabaseMut } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Plus, Trash2, TrendingUp, TrendingDown, History,
  ChevronDown, ChevronRight, Lock, Unlock, X, AlertCircle,
  Banknote, CreditCard, Smartphone, Wallet, ArrowLeftRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TipoMovimiento = "ingreso" | "egreso";
type MetodoPago = "efectivo" | "transferencia" | "tarjeta" | "mercadopago" | "otro";

type CashSession = {
  id: string; complex_id: string; opened_by: string; closed_by: string | null;
  opened_at: string; closed_at: string | null; fondo_inicial: number;
  saldo_final: number | null; efectivo_contado: number | null;
  notas_cierre: string | null; estado: "abierta" | "cerrada";
};

type CashMovement = {
  id: string; complex_id: string; user_id: string; session_id: string;
  tipo: TipoMovimiento; categoria: string; monto: number;
  metodo_pago: MetodoPago; fecha: string; notas?: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CONCEPTOS_INGRESO = [
  "Reserva cancha fútbol", "Reserva cancha pádel", "Reserva cancha tenis",
  "Reserva cancha vóley", "Reserva cancha básquet", "Alquiler de equipo",
  "Inscripción torneo", "Buffet / cantina", "Otro ingreso",
];
const CONCEPTOS_EGRESO = [
  "Mantenimiento", "Limpieza", "Servicios (luz/agua/gas)", "Insumos",
  "Personal", "Publicidad", "Retiro de caja", "Otro egreso",
];

const METODOS: { value: MetodoPago; label: string; icon: any; color: string }[] = [
  { value: "efectivo",      label: "Efectivo",      icon: Banknote,      color: "#4ADE80" },
  { value: "transferencia", label: "Transferencia",  icon: ArrowLeftRight, color: "#60A5FA" },
  { value: "tarjeta",       label: "Tarjeta",        icon: CreditCard,    color: "#A78BFA" },
  { value: "mercadopago",   label: "MercadoPago",    icon: Smartphone,    color: "#009EE3" },
  { value: "otro",          label: "Otro",           icon: Wallet,        color: "#94A3B8" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-AR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
function getMetodo(val: MetodoPago) {
  return METODOS.find(m => m.value === val) ?? METODOS[4];
}

// ─── Historial Tab ────────────────────────────────────────────────────────────

type Periodo = "semana" | "mes" | "todo";

function HistorialTab({ complexId }: { complexId: string }) {
  const [sesiones, setSesiones] = useState<(CashSession & { movimientos: CashMovement[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("mes");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = (supabase as any).from("cash_sessions").select("*")
        .eq("complex_id", complexId).eq("estado", "cerrada")
        .order("closed_at", { ascending: false });

      if (periodo === "semana") {
        const desde = new Date(); desde.setDate(desde.getDate() - 7);
        query = query.gte("opened_at", desde.toISOString());
      } else if (periodo === "mes") {
        const desde = new Date(); desde.setDate(1); desde.setHours(0, 0, 0, 0);
        query = query.gte("opened_at", desde.toISOString());
      } else {
        query = query.limit(50);
      }

      const { data: sessionsData } = await query;
      if (!sessionsData?.length) { setSesiones([]); setLoading(false); return; }

      const sessionIds = sessionsData.map((s: any) => s.id);
      const { data: movsData } = await (supabase as any).from("cash_movements")
        .select("*").in("session_id", sessionIds).order("fecha", { ascending: true });

      const movsBySession: Record<string, CashMovement[]> = {};
      for (const m of (movsData ?? []) as CashMovement[]) {
        if (!movsBySession[m.session_id]) movsBySession[m.session_id] = [];
        movsBySession[m.session_id].push(m);
      }
      setSesiones(sessionsData.map((s: any) => ({ ...s, movimientos: movsBySession[s.id] ?? [] })));
      setLoading(false);
    };
    load();
  }, [complexId, periodo]);

  const globalStats = useMemo(() => {
    let ingresos = 0, egresos = 0;
    const byMethod: Record<string, number> = {};
    for (const s of sesiones) {
      for (const m of s.movimientos) {
        if (m.tipo === "ingreso") { ingresos += m.monto; byMethod[m.metodo_pago] = (byMethod[m.metodo_pago] ?? 0) + m.monto; }
        else egresos += m.monto;
      }
    }
    return { ingresos, egresos, neto: ingresos - egresos, byMethod, sesiones: sesiones.length };
  }, [sesiones]);

  return (
    <div className="space-y-5">
      {/* Period filter */}
      <div className="flex gap-2 flex-wrap">
        {([["semana", "Esta semana"], ["mes", "Este mes"], ["todo", "Todas"]] as [Periodo, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setPeriodo(k)}
            className="px-4 py-1.5 text-xs font-bold rounded-full transition-all"
            style={periodo === k
              ? { background: "#C8FF00", color: "#1A120B" }
              : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(225,212,194,0.5)" }}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-rodeo-lime/30 border-t-rodeo-lime rounded-full animate-spin" /></div>
      ) : sesiones.length === 0 ? (
        <div className="p-10 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px" }}>
          <History size={28} className="text-rodeo-cream/20 mx-auto mb-2" />
          <p className="text-sm text-rodeo-cream/40">No hay sesiones cerradas en este período.</p>
        </div>
      ) : (
        <>
          {/* Global summary */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" }} className="p-5 space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-rodeo-cream/40">
              Resumen del período · {globalStats.sesiones} sesión{globalStats.sesiones !== 1 ? "es" : ""}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Ingresos", value: globalStats.ingresos, color: "#4ADE80", bg: "rgba(74,222,128,0.08)" },
                { label: "Egresos",  value: globalStats.egresos,  color: "#F87171", bg: "rgba(248,113,113,0.08)" },
                { label: "Neto",     value: globalStats.neto,     color: "#C8FF00", bg: "rgba(200,255,0,0.08)" },
              ].map(c => (
                <div key={c.label} style={{ background: c.bg, borderRadius: "12px" }} className="p-3 text-center">
                  <p className="text-[10px] text-rodeo-cream/40 font-bold uppercase tracking-wider mb-1">{c.label}</p>
                  <p className="text-base font-black" style={{ color: c.color }}>{fmt(c.value)}</p>
                </div>
              ))}
            </div>
            {/* By method */}
            {Object.keys(globalStats.byMethod).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
                {METODOS.filter(m => globalStats.byMethod[m.value]).map(m => {
                  const Icon = m.icon;
                  return (
                    <div key={m.value} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                      style={{ background: `${m.color}15`, border: `1px solid ${m.color}30`, color: m.color }}>
                      <Icon size={11} /> {m.label}: {fmt(globalStats.byMethod[m.value])}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Session list */}
          <div className="space-y-2">
            {sesiones.map((sesion) => {
              const isExpanded = expandedId === sesion.id;
              const ing = sesion.movimientos.filter(m => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0);
              const eg = sesion.movimientos.filter(m => m.tipo === "egreso").reduce((s, m) => s + m.monto, 0);

              return (
                <div key={sesion.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", overflow: "hidden" }}>
                  <button className="w-full flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3.5 text-left gap-3"
                    onClick={() => setExpandedId(isExpanded ? null : sesion.id)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "10px" }} className="w-9 h-9 flex items-center justify-center shrink-0">
                        <Lock size={15} className="text-rodeo-cream/40" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-black text-white">{fmtDateTime(sesion.opened_at)}</p>
                          {sesion.closed_at && <span className="text-[10px] text-rodeo-cream/30">→ {fmtTime(sesion.closed_at)}</span>}
                        </div>
                        <p className="text-[11px] text-rodeo-cream/40 mt-0.5">
                          Fondo: {fmt(sesion.fondo_inicial)} · {sesion.movimientos.length} movs
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-green-400 font-bold">+{fmt(ing)}</p>
                        <p className="text-xs text-red-400">−{fmt(eg)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-rodeo-cream/40 font-bold uppercase tracking-wider">Saldo</p>
                        <p className="text-base font-black text-white">{fmt(sesion.saldo_final ?? 0)}</p>
                      </div>
                      {isExpanded ? <ChevronDown size={14} className="text-rodeo-cream/40" /> : <ChevronRight size={14} className="text-rodeo-cream/40" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4 pt-3 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                          {sesion.notas_cierre && (
                            <div className="mb-3 p-3 rounded-[10px] text-xs" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                              <span className="text-rodeo-cream/50 font-bold">Notas: </span>
                              <span className="text-rodeo-cream/80">{sesion.notas_cierre}</span>
                            </div>
                          )}
                          {sesion.efectivo_contado != null && (
                            <div className="mb-3 p-3 rounded-[10px] text-xs flex justify-between" style={{ background: "rgba(200,255,0,0.06)", border: "1px solid rgba(200,255,0,0.15)" }}>
                              <span className="text-rodeo-cream/50 font-bold">Efectivo contado</span>
                              <span className="text-rodeo-lime font-black">{fmt(sesion.efectivo_contado)}</span>
                            </div>
                          )}
                          {sesion.movimientos.length === 0
                            ? <p className="text-xs text-center py-3 text-rodeo-cream/30">Sin movimientos</p>
                            : sesion.movimientos.map(m => {
                                const met = getMetodo(m.metodo_pago);
                                const Icon = met.icon;
                                return (
                                  <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-[10px]" style={{ background: "rgba(255,255,255,0.03)" }}>
                                    <div className={`p-1.5 rounded-[7px] shrink-0 ${m.tipo === "ingreso" ? "bg-green-400/10" : "bg-red-400/10"}`}>
                                      {m.tipo === "ingreso" ? <TrendingUp size={12} className="text-green-400" /> : <TrendingDown size={12} className="text-red-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-white truncate">{m.categoria}</p>
                                      {m.notas && <p className="text-[10px] text-rodeo-cream/30 truncate">{m.notas}</p>}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Icon size={11} style={{ color: met.color }} />
                                      <span className="text-[10px] text-rodeo-cream/30 font-mono">{fmtTime(m.fecha)}</span>
                                      <span className={`text-xs font-black ${m.tipo === "ingreso" ? "text-green-400" : "text-red-400"}`}>
                                        {m.tipo === "egreso" ? "−" : "+"}{fmt(m.monto)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                          }
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Close Modal ──────────────────────────────────────────────────────────────

function CloseSessionModal({
  session, saldoCalculado, onClose, onConfirm, loading, error,
}: {
  session: CashSession; saldoCalculado: number;
  onClose: () => void; onConfirm: (notas: string, efectivoContado: number | null) => void;
  loading: boolean; error: string;
}) {
  const [notas, setNotas] = useState("");
  const [efectivoContado, setEfectivoContado] = useState("");

  const contado = efectivoContado !== "" ? parseFloat(efectivoContado) : null;
  const diferencia = contado != null ? contado - saldoCalculado : null;

  const inp = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#E1D4C2", outline: "none" } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        style={{ background: "linear-gradient(145deg,rgba(41,28,14,0.98),rgba(26,18,11,0.99))", border: "1px solid rgba(255,64,64,0.2)", borderRadius: "24px", width: "100%", maxWidth: "440px", maxHeight: "90vh", overflowY: "auto" }}
        className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2"><Lock size={18} className="text-red-400" /> Cerrar Caja</h3>
            <p className="text-xs text-rodeo-cream/50 mt-0.5">Revisá los números antes de confirmar</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-white/10 transition-all text-rodeo-cream/40"><X size={16} /></button>
        </div>

        {/* Saldo calculado */}
        <div style={{ background: "rgba(200,255,0,0.07)", border: "1px solid rgba(200,255,0,0.2)", borderRadius: "14px" }} className="p-4 space-y-2">
          <p className="text-[11px] text-rodeo-cream/50 font-bold uppercase tracking-widest">Saldo calculado por el sistema</p>
          <p className="text-3xl font-black text-rodeo-lime">{fmt(saldoCalculado)}</p>
          <p className="text-[11px] text-rodeo-cream/40">Fondo inicial {fmt(session.fondo_inicial)} + ingresos − egresos</p>
        </div>

        {/* Efectivo contado */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">
            Efectivo contado en caja (opcional)
          </label>
          <div className="relative">
            <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/40" />
            <input type="number" placeholder={`${saldoCalculado}`} value={efectivoContado} onChange={e => setEfectivoContado(e.target.value)}
              style={inp} className="w-full pl-9 pr-4 py-2.5 text-sm" />
          </div>
          {diferencia != null && (
            <p className={`text-xs font-bold ${Math.abs(diferencia) < 1 ? "text-green-400" : diferencia > 0 ? "text-blue-400" : "text-red-400"}`}>
              {Math.abs(diferencia) < 1 ? "✓ Cuadra perfectamente" : diferencia > 0 ? `Sobrante: ${fmt(diferencia)}` : `Faltante: ${fmt(Math.abs(diferencia))}`}
            </p>
          )}
        </div>

        {/* Notas */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Notas de cierre (opcional)</label>
          <textarea rows={2} placeholder="Diferencias, retiros, observaciones..." value={notas} onChange={e => setNotas(e.target.value)}
            style={{ ...inp, resize: "none" } as React.CSSProperties} className="w-full px-3 py-2.5 text-sm placeholder:text-rodeo-cream/25" />
        </div>

        {error && <p className="text-xs text-red-400 font-bold flex items-center gap-1"><AlertCircle size={12} />{error}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
            className="flex-1 py-3 text-sm font-bold text-rodeo-cream/60">Cancelar</button>
          <button onClick={() => onConfirm(notas, contado)} disabled={loading}
            style={{ background: "rgba(239,68,68,0.9)", borderRadius: "12px" }}
            className="flex-1 py-3 text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock size={15} />}
            Confirmar Cierre
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CajaPage() {
  const { user } = useAuth();
  const { activeComplexId } = useActiveComplex();

  const [activeTab, setActiveTab] = useState<"caja" | "historial">("caja");
  const [session, setSession] = useState<CashSession | null>(null);
  const [movimientos, setMovimientos] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Abrir caja
  const [showOpenForm, setShowOpenForm] = useState(false);
  const [fondoInicial, setFondoInicial] = useState("");
  const [openLoading, setOpenLoading] = useState(false);
  const [openError, setOpenError] = useState("");

  // Cerrar caja
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeError, setCloseError] = useState("");

  // Nuevo movimiento
  const [tipo, setTipo] = useState<TipoMovimiento>("ingreso");
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [notas, setNotas] = useState("");
  const [movLoading, setMovLoading] = useState(false);
  const [movError, setMovError] = useState("");

  // Fetch
  const fetchSession = useCallback(async () => {
    if (!activeComplexId) return;
    setLoading(true);
    const { data: sessionData } = await (supabase as any).from("cash_sessions")
      .select("*").eq("complex_id", activeComplexId).eq("estado", "abierta").maybeSingle();
    if (sessionData) {
      setSession(sessionData);
      const { data: movsData } = await (supabase as any).from("cash_movements")
        .select("*").eq("session_id", sessionData.id).order("fecha", { ascending: false });
      setMovimientos(movsData ?? []);
    } else { setSession(null); setMovimientos([]); }
    setLoading(false);
  }, [activeComplexId]);

  useEffect(() => {
    if (!activeComplexId) return;
    fetchSession();
    const c1 = supabase.channel(`cs-${activeComplexId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cash_sessions", filter: `complex_id=eq.${activeComplexId}` }, fetchSession).subscribe();
    const c2 = supabase.channel(`cm-${activeComplexId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cash_movements", filter: `complex_id=eq.${activeComplexId}` }, fetchSession).subscribe();
    return () => { supabase.removeChannel(c1); supabase.removeChannel(c2); };
  }, [activeComplexId, fetchSession]);

  // Actions
  const handleAbrirCaja = async () => {
    if (!user || !activeComplexId) return;
    setOpenLoading(true); setOpenError("");
    const { data, error } = await (supabaseMut as any).from("cash_sessions").insert({
      complex_id: activeComplexId, opened_by: user.id,
      fondo_inicial: parseFloat(fondoInicial) || 0, estado: "abierta",
    }).select().single();
    if (error) setOpenError(error.message);
    else { setFondoInicial(""); setShowOpenForm(false); setSession(data); }
    setOpenLoading(false);
  };

  const handleCerrarCaja = async (notasCierre: string, efectivoContado: number | null) => {
    if (!session || !user) return;
    setCloseLoading(true); setCloseError("");
    const saldoFinal = session.fondo_inicial + totalIngresos - totalEgresos;
    const { error } = await (supabaseMut as any).from("cash_sessions").update({
      closed_by: user.id, closed_at: new Date().toISOString(),
      saldo_final: saldoFinal, efectivo_contado: efectivoContado,
      notas_cierre: notasCierre.trim() || null, estado: "cerrada",
    }).eq("id", session.id);
    if (error) { setCloseError(error.message); setCloseLoading(false); return; }
    setShowCloseModal(false); setSession(null); setMovimientos([]);
    setCloseLoading(false);
  };

  const handleAgregarMovimiento = async () => {
    const montoNum = parseFloat(monto);
    if (!concepto || isNaN(montoNum) || montoNum <= 0 || !user || !activeComplexId || !session) return;
    setMovLoading(true); setMovError("");
    const { error } = await (supabaseMut as any).from("cash_movements").insert({
      complex_id: activeComplexId, user_id: user.id, session_id: session.id,
      tipo, categoria: concepto, monto: montoNum, metodo_pago: metodo,
      fecha: new Date().toISOString(), notas: notas.trim() || null,
    });
    if (error) setMovError(error.message);
    else { setMonto(""); setConcepto(""); setNotas(""); }
    setMovLoading(false);
  };

  const handleEliminar = async (id: string) => {
    await (supabaseMut as any).from("cash_movements").delete().eq("id", id);
  };

  // Computed
  const totalIngresos = useMemo(() => movimientos.filter(m => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0), [movimientos]);
  const totalEgresos  = useMemo(() => movimientos.filter(m => m.tipo === "egreso").reduce((s, m) => s + m.monto, 0), [movimientos]);
  const saldoActual   = session ? session.fondo_inicial + totalIngresos - totalEgresos : 0;

  const byMethod = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of movimientos.filter(m => m.tipo === "ingreso")) {
      map[m.metodo_pago] = (map[m.metodo_pago] ?? 0) + m.monto;
    }
    return map;
  }, [movimientos]);

  const inp = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#E1D4C2", outline: "none" } as React.CSSProperties;

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-rodeo-cream/50 font-bold tracking-widest uppercase">Panel de Control</p>
          <h1 style={{ fontFamily: "'Barlow Condensed',system-ui,sans-serif", fontWeight: 900, fontSize: "44px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }}
            className="text-white flex items-center gap-3">
            Caja
            {session && <span style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "999px" }}
              className="text-sm font-black text-green-400 px-3 py-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> ABIERTA
            </span>}
          </h1>
        </div>
        {session && (
          <button onClick={() => { setCloseError(""); setShowCloseModal(true); }}
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px" }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-black text-red-400 hover:bg-red-400/20 transition-all">
            <Lock size={15} /> Cerrar Caja
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px" }} className="flex gap-1 p-1">
        {([["caja", "Sesión actual"], ["historial", "Historial"]] as const).map(([key, lbl]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="flex-1 py-2.5 text-sm font-black rounded-[10px] transition-all"
            style={activeTab === key ? { background: "rgba(200,255,0,0.9)", color: "#1A120B" } : { color: "rgba(225,212,194,0.5)" }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ── Historial ── */}
      {activeTab === "historial" && activeComplexId && <HistorialTab complexId={activeComplexId} />}

      {/* ── Caja ── */}
      {activeTab === "caja" && (
        loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-rodeo-lime/30 border-t-rodeo-lime rounded-full animate-spin" /></div>
        ) : !session ? (

          /* ── Caja cerrada ── */
          <div className="p-10 text-center space-y-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "20px" }}>
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto">
              <Lock size={32} className="text-rodeo-cream/30" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Caja cerrada</h2>
              <p className="text-sm text-rodeo-cream/50 mt-1">Abrí la caja para registrar ingresos y egresos del turno.</p>
            </div>

            <AnimatePresence>
              {showOpenForm ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="max-w-xs mx-auto space-y-4 p-5 text-left"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px" }}>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Fondo inicial (efectivo de cambio)</label>
                    <div className="relative">
                      <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/40" />
                      <input type="number" placeholder="0" value={fondoInicial} onChange={e => setFondoInicial(e.target.value)}
                        style={inp} className="w-full pl-9 pr-4 py-2.5 text-sm" />
                    </div>
                  </div>
                  {openError && <p className="text-xs text-red-400 font-bold">{openError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => setShowOpenForm(false)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
                      className="flex-1 py-2.5 text-sm font-bold text-rodeo-cream/60">Cancelar</button>
                    <button onClick={handleAbrirCaja} disabled={openLoading}
                      style={{ background: "rgba(200,255,0,0.9)", borderRadius: "10px" }}
                      className="flex-1 py-2.5 text-sm font-black text-rodeo-dark flex items-center justify-center gap-2 disabled:opacity-50">
                      {openLoading ? <div className="w-4 h-4 border-2 border-rodeo-dark/30 border-t-rodeo-dark rounded-full animate-spin" /> : <Unlock size={15} />}
                      Abrir
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.button onClick={() => setShowOpenForm(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  style={{ background: "rgba(200,255,0,0.9)", borderRadius: "14px" }}
                  className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-black text-rodeo-dark mx-auto">
                  <Unlock size={18} /> Abrir Caja
                </motion.button>
              )}
            </AnimatePresence>
          </div>

        ) : (

          /* ── Caja abierta ── */
          <div className="space-y-5">

            {/* Info sesión */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px" }}
              className="flex items-center gap-3 px-4 py-3">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
              <p className="text-xs text-rodeo-cream/50">Abierta desde <strong className="text-white">{fmtDateTime(session.opened_at)}</strong></p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Fondo inicial", value: session.fondo_inicial, color: "#94A3B8", bg: "rgba(148,163,184,0.08)" },
                { label: "Ingresos",      value: totalIngresos,         color: "#4ADE80", bg: "rgba(74,222,128,0.08)" },
                { label: "Egresos",       value: totalEgresos,          color: "#F87171", bg: "rgba(248,113,113,0.08)" },
                { label: "Saldo actual",  value: saldoActual,           color: "#C8FF00", bg: "rgba(200,255,0,0.1)", big: true },
              ].map(c => (
                <div key={c.label} style={{ background: c.bg, borderRadius: "14px", border: c.big ? "1px solid rgba(200,255,0,0.2)" : "1px solid rgba(255,255,255,0.06)" }} className="p-4 text-center">
                  <p className="text-[10px] text-rodeo-cream/40 font-bold uppercase tracking-wider mb-1">{c.label}</p>
                  <p style={{ color: c.color }} className={`font-black leading-none ${c.big ? "text-2xl" : "text-lg"}`}>{fmt(c.value)}</p>
                </div>
              ))}
            </div>

            {/* Breakdown por método */}
            {Object.keys(byMethod).length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" }}
                className="px-4 py-3 flex flex-wrap gap-2 items-center">
                <p className="text-[10px] text-rodeo-cream/30 font-bold uppercase tracking-widest mr-1">Ingresos por método:</p>
                {METODOS.filter(m => byMethod[m.value]).map(m => {
                  const Icon = m.icon;
                  return (
                    <div key={m.value} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                      style={{ background: `${m.color}12`, border: `1px solid ${m.color}25`, color: m.color }}>
                      <Icon size={11} /> {m.label}: {fmt(byMethod[m.value])}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Formulario agregar movimiento ── */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px" }} className="p-5 space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-rodeo-cream/50 flex items-center gap-2">
                <Plus size={14} className="text-rodeo-lime" /> Registrar movimiento
              </p>

              {/* Ingreso / Egreso */}
              <div className="grid grid-cols-2 gap-2">
                {(["ingreso", "egreso"] as TipoMovimiento[]).map(t => (
                  <button key={t} onClick={() => { setTipo(t); setConcepto(""); }}
                    className="py-3 text-sm font-black rounded-[12px] flex items-center justify-center gap-2 transition-all"
                    style={tipo === t
                      ? t === "ingreso"
                        ? { background: "rgba(74,222,128,0.2)", border: "1px solid rgba(74,222,128,0.4)", color: "#4ADE80" }
                        : { background: "rgba(248,113,113,0.2)", border: "1px solid rgba(248,113,113,0.4)", color: "#F87171" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(225,212,194,0.4)" }}>
                    {t === "ingreso" ? <><TrendingUp size={15} /> Ingreso</> : <><TrendingDown size={15} /> Egreso</>}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Concepto */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Concepto</label>
                  <select value={concepto} onChange={e => setConcepto(e.target.value)} style={inp} className="w-full px-3 py-2.5 text-sm">
                    <option value="" style={{ background: "#1A120B" }}>Seleccionar...</option>
                    {(tipo === "ingreso" ? CONCEPTOS_INGRESO : CONCEPTOS_EGRESO).map(c => (
                      <option key={c} value={c} style={{ background: "#1A120B" }}>{c}</option>
                    ))}
                  </select>
                </div>
                {/* Monto */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Monto (ARS)</label>
                  <div className="relative">
                    <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/40" />
                    <input type="number" placeholder="0" value={monto} onChange={e => setMonto(e.target.value)}
                      style={inp} className="w-full pl-9 pr-4 py-2.5 text-sm"
                      onKeyDown={e => e.key === "Enter" && handleAgregarMovimiento()} />
                  </div>
                </div>
              </div>

              {/* Método de pago */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Método de pago</label>
                <div className="flex flex-wrap gap-2">
                  {METODOS.map(m => {
                    const Icon = m.icon;
                    const isActive = metodo === m.value;
                    return (
                      <button key={m.value} onClick={() => setMetodo(m.value)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-bold transition-all"
                        style={isActive
                          ? { background: `${m.color}20`, border: `1px solid ${m.color}50`, color: m.color }
                          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(225,212,194,0.4)" }}>
                        <Icon size={12} /> {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notas */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Notas (opcional)</label>
                <input type="text" placeholder="Ej: Reserva de Juan García, cancha 2" value={notas} onChange={e => setNotas(e.target.value)}
                  style={inp} className="w-full px-3 py-2.5 text-sm placeholder:text-rodeo-cream/20"
                  onKeyDown={e => e.key === "Enter" && handleAgregarMovimiento()} />
              </div>

              {movError && <p className="text-xs text-red-400 font-bold flex items-center gap-1"><AlertCircle size={12} />{movError}</p>}

              <button onClick={handleAgregarMovimiento}
                disabled={!concepto || !monto || parseFloat(monto) <= 0 || movLoading}
                className="w-full py-3 rounded-[12px] text-sm font-black flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                style={{ background: tipo === "ingreso" ? "rgba(74,222,128,0.9)" : "rgba(248,113,113,0.9)", color: "#0f172a" }}>
                {movLoading ? <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  : tipo === "ingreso" ? <><TrendingUp size={16} /> Registrar ingreso</> : <><TrendingDown size={16} /> Registrar egreso</>}
              </button>
            </div>

            {/* ── Lista de movimientos ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-black uppercase tracking-widest text-rodeo-cream/40">
                  Movimientos del turno <span className="text-rodeo-cream/25">({movimientos.length})</span>
                </p>
              </div>

              {movimientos.length === 0 ? (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "14px" }} className="p-8 text-center">
                  <History size={24} className="text-rodeo-cream/15 mx-auto mb-2" />
                  <p className="text-xs text-rodeo-cream/30">Sin movimientos en este turno aún</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {movimientos.map((m) => {
                    const met = getMetodo(m.metodo_pago);
                    const MetIcon = met.icon;
                    return (
                      <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, height: 0 }}
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", borderLeft: `3px solid ${m.tipo === "ingreso" ? "#4ADE80" : "#F87171"}` }}
                        className="flex items-center gap-3 px-4 py-3">
                        <div className={`p-1.5 rounded-[8px] shrink-0 ${m.tipo === "ingreso" ? "bg-green-400/10" : "bg-red-400/10"}`}>
                          {m.tipo === "ingreso" ? <TrendingUp size={14} className="text-green-400" /> : <TrendingDown size={14} className="text-red-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white">{m.categoria}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: met.color }}>
                              <MetIcon size={10} /> {met.label}
                            </span>
                            {m.notas && <span className="text-[10px] text-rodeo-cream/30 truncate max-w-[200px]">{m.notas}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className={`text-sm font-black ${m.tipo === "ingreso" ? "text-green-400" : "text-red-400"}`}>
                              {m.tipo === "egreso" ? "−" : "+"}{fmt(m.monto)}
                            </p>
                            <p className="text-[10px] text-rodeo-cream/30 font-mono">{fmtTime(m.fecha)}</p>
                          </div>
                          <button onClick={() => handleEliminar(m.id)} className="text-rodeo-cream/20 hover:text-red-400 transition-colors p-1">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        )
      )}

      {/* Close modal */}
      <AnimatePresence>
        {showCloseModal && session && (
          <CloseSessionModal
            session={session} saldoCalculado={saldoActual}
            onClose={() => setShowCloseModal(false)}
            onConfirm={handleCerrarCaja}
            loading={closeLoading} error={closeError} />
        )}
      </AnimatePresence>
    </div>
  );
}
