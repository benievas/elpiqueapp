"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  Plus,
  Minus,
  Lock,
  Unlock,
  ChevronDown,
  Trash2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

type TipoMovimiento = "ingreso" | "egreso";

interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  concepto: string;
  monto: number;
  hora: string;
}

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
  "Otro egreso",
];

function formatMoney(n: number) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function nowTime() {
  return new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export default function CajaPage() {
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [fondoInicial, setFondoInicial] = useState("");
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cajaCerrada, setCajaCerrada] = useState(false);

  // Form nuevo movimiento
  const [tipo, setTipo] = useState<TipoMovimiento>("ingreso");
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fondo = parseFloat(fondoInicial) || 0;
  const totalIngresos = useMemo(() => movimientos.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0), [movimientos]);
  const totalEgresos = useMemo(() => movimientos.filter((m) => m.tipo === "egreso").reduce((s, m) => s + m.monto, 0), [movimientos]);
  const saldoFinal = fondo + totalIngresos - totalEgresos;

  const handleAbrirCaja = () => {
    if (!fondoInicial || parseFloat(fondoInicial) < 0) return;
    setCajaAbierta(true);
  };

  const handleAgregarMovimiento = () => {
    const montoNum = parseFloat(monto);
    if (!concepto || !monto || isNaN(montoNum) || montoNum <= 0) return;
    setMovimientos((prev) => [
      {
        id: Date.now().toString(),
        tipo,
        concepto,
        monto: montoNum,
        hora: nowTime(),
      },
      ...prev,
    ]);
    setMonto("");
    setConcepto("");
    setShowForm(false);
  };

  const handleEliminar = (id: string) => {
    setMovimientos((prev) => prev.filter((m) => m.id !== id));
  };

  const handleCerrarCaja = () => {
    setCajaCerrada(true);
  };

  const handleNuevaCaja = () => {
    setCajaAbierta(false);
    setCajaCerrada(false);
    setFondoInicial("");
    setMovimientos([]);
    setShowForm(false);
  };

  // ── ESTADO: Caja cerrada (resumen) ──────────────────────────────────────
  if (cajaCerrada) {
    return (
      <div className="space-y-8 max-w-xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rodeo-lime/10 border border-rodeo-lime/20 text-rodeo-lime text-xs font-bold tracking-widest uppercase">
            <CheckCircle2 size={12} /> Caja Cerrada
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Resumen del día</h1>
          <p className="text-sm text-rodeo-cream/50">{new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </motion.div>

        <div
          style={{ background: "rgba(200,255,0,0.06)", border: "1px solid rgba(200,255,0,0.2)", borderRadius: "20px" }}
          className="p-6 space-y-5"
        >
          {[
            { label: "Fondo inicial", valor: fondo, color: "text-rodeo-cream/70" },
            { label: "Total ingresos", valor: totalIngresos, color: "text-green-400" },
            { label: "Total egresos", valor: totalEgresos, color: "text-red-400" },
          ].map((row) => (
            <div key={row.label} className="flex justify-between items-center border-b border-white/5 pb-4 last:border-0 last:pb-0">
              <span className="text-sm text-rodeo-cream/60">{row.label}</span>
              <span className={`text-lg font-black ${row.color}`}>{formatMoney(row.valor)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2">
            <span className="text-base font-black text-white uppercase tracking-wide">Saldo final en caja</span>
            <span className="text-2xl font-black text-rodeo-lime">{formatMoney(saldoFinal)}</span>
          </div>
        </div>

        {/* Detalle de movimientos */}
        {movimientos.length > 0 && (
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40 mb-3">Movimientos registrados</p>
            <div className="space-y-2">
              {movimientos.map((m) => (
                <div
                  key={m.id}
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" }}
                  className="flex justify-between items-center px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {m.tipo === "ingreso" ? <TrendingUp size={14} className="text-green-400" /> : <TrendingDown size={14} className="text-red-400" />}
                    <div>
                      <p className="text-sm font-bold text-white">{m.concepto}</p>
                      <p className="text-xs text-rodeo-cream/40">{m.hora}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-black ${m.tipo === "ingreso" ? "text-green-400" : "text-red-400"}`}>
                    {m.tipo === "egreso" ? "−" : "+"}{formatMoney(m.monto)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleNuevaCaja}
          style={{ background: "rgba(200,255,0,0.15)", border: "1px solid rgba(200,255,0,0.3)", borderRadius: "14px" }}
          className="w-full py-3 text-rodeo-lime font-bold text-sm hover:bg-rodeo-lime/25 transition-all"
        >
          Abrir nueva caja
        </button>
      </div>
    );
  }

  // ── ESTADO: Caja no abierta ─────────────────────────────────────────────
  if (!cajaAbierta) {
    return (
      <div className="space-y-8 max-w-xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <p className="text-xs text-rodeo-cream/50 font-bold tracking-widest uppercase">Panel de Control</p>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Caja y Cierre</h1>
          <p className="text-sm text-rodeo-cream/60">Registrá ingresos y egresos del día. Cerrá la caja al final con el resumen completo.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px" }}
          className="p-8 space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[14px] bg-rodeo-lime/15 border border-rodeo-lime/30 flex items-center justify-center">
              <Unlock size={22} className="text-rodeo-lime" />
            </div>
            <div>
              <p className="text-white font-black">Apertura de Caja</p>
              <p className="text-xs text-rodeo-cream/50">Ingresá el fondo inicial para comenzar</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-rodeo-cream/50 uppercase tracking-widest">Fondo inicial (ARS)</label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/40" />
              <input
                type="number"
                placeholder="0"
                value={fondoInicial}
                onChange={(e) => setFondoInicial(e.target.value)}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px" }}
                className="w-full pl-9 pr-4 py-3.5 text-white font-bold text-lg focus:outline-none focus:border-rodeo-lime/50 transition-all placeholder-white/20"
              />
            </div>
            <p className="text-xs text-rodeo-cream/30">El monto que tenés en efectivo al comenzar el día</p>
          </div>

          <button
            onClick={handleAbrirCaja}
            disabled={!fondoInicial || parseFloat(fondoInicial) < 0}
            style={{ background: "rgba(200,255,0,0.9)", borderRadius: "14px" }}
            className="w-full py-4 text-rodeo-dark font-black text-base flex items-center justify-center gap-2 hover:bg-rodeo-lime transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Unlock size={18} /> Abrir Caja
          </button>
        </motion.div>

        {/* Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: TrendingUp, text: "Registrá cada ingreso: reservas, walk-ins, buffet" },
            { icon: TrendingDown, text: "Anotá egresos: mantenimiento, servicios, personal" },
            { icon: CheckCircle2, text: "Cerrá la caja con el resumen completo del día" },
          ].map((item, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px" }} className="p-4 flex items-start gap-3">
              <item.icon size={16} className="text-rodeo-lime/60 mt-0.5 shrink-0" />
              <p className="text-xs text-rodeo-cream/50 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── ESTADO: Caja abierta ────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/25 text-green-400 text-[10px] font-bold tracking-widest uppercase mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Caja abierta
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Caja del día</h1>
          <p className="text-xs text-rodeo-cream/50 mt-0.5">{new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <button
          onClick={handleCerrarCaja}
          style={{ background: "rgba(255,64,64,0.12)", border: "1px solid rgba(255,64,64,0.25)", borderRadius: "12px" }}
          className="flex items-center gap-2 px-4 py-2.5 text-red-400 text-sm font-bold hover:bg-red-500/20 transition-all"
        >
          <Lock size={15} /> Cerrar caja
        </button>
      </div>

      {/* Resumen en tiempo real */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Fondo inicial", valor: fondo, color: "text-rodeo-cream/80", bg: "rgba(255,255,255,0.04)" },
          { label: "Ingresos", valor: totalIngresos, color: "text-green-400", bg: "rgba(74,222,128,0.06)" },
          { label: "Egresos", valor: totalEgresos, color: "text-red-400", bg: "rgba(255,64,64,0.06)" },
        ].map((card) => (
          <div
            key={card.label}
            style={{ background: card.bg, border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px" }}
            className="p-4 text-center"
          >
            <p className="text-[10px] font-bold text-rodeo-cream/40 uppercase tracking-widest mb-1">{card.label}</p>
            <p className={`text-lg font-black ${card.color}`}>{formatMoney(card.valor)}</p>
          </div>
        ))}
      </div>

      {/* Saldo actual */}
      <div
        style={{ background: "rgba(200,255,0,0.07)", border: "1px solid rgba(200,255,0,0.2)", borderRadius: "16px" }}
        className="px-5 py-4 flex justify-between items-center"
      >
        <span className="text-sm font-bold text-rodeo-cream/70">Saldo actual en caja</span>
        <span className="text-2xl font-black text-rodeo-lime">{formatMoney(saldoFinal)}</span>
      </div>

      {/* Botón agregar + Form */}
      <div>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{ background: "rgba(200,255,0,0.9)", borderRadius: "12px" }}
          className="flex items-center gap-2 px-5 py-3 text-rodeo-dark font-black text-sm hover:bg-rodeo-lime transition-all"
        >
          <Plus size={17} /> Registrar movimiento
          <ChevronDown size={15} className={`transition-transform ${showForm ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-3"
            >
              <div
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px" }}
                className="p-5 space-y-4"
              >
                {/* Tipo */}
                <div className="flex gap-2">
                  {(["ingreso", "egreso"] as TipoMovimiento[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setTipo(t); setConcepto(""); }}
                      style={tipo === t
                        ? t === "ingreso"
                          ? { background: "rgba(74,222,128,0.2)", border: "1px solid rgba(74,222,128,0.4)", borderRadius: "10px" }
                          : { background: "rgba(255,64,64,0.2)", border: "1px solid rgba(255,64,64,0.4)", borderRadius: "10px" }
                        : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }
                      }
                      className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        tipo === t
                          ? t === "ingreso" ? "text-green-400" : "text-red-400"
                          : "text-rodeo-cream/50"
                      }`}
                    >
                      {t === "ingreso" ? <Plus size={15} /> : <Minus size={15} />}
                      {t === "ingreso" ? "Ingreso" : "Egreso"}
                    </button>
                  ))}
                </div>

                {/* Concepto */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-rodeo-cream/40 uppercase tracking-widest">Concepto</label>
                  <select
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px" }}
                    className="w-full px-3.5 py-3 text-sm text-white focus:outline-none focus:border-rodeo-lime/40 transition-all"
                  >
                    <option value="" style={{ background: "#1A120B" }}>Seleccionar concepto...</option>
                    {(tipo === "ingreso" ? CONCEPTOS_INGRESO : CONCEPTOS_EGRESO).map((c) => (
                      <option key={c} value={c} style={{ background: "#1A120B" }}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Monto */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-rodeo-cream/40 uppercase tracking-widest">Monto (ARS)</label>
                  <div className="relative">
                    <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/40" />
                    <input
                      type="number"
                      placeholder="0"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px" }}
                      className="w-full pl-9 pr-4 py-3 text-white font-bold focus:outline-none focus:border-rodeo-lime/40 transition-all placeholder-white/20"
                    />
                  </div>
                </div>

                {/* Guardar */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleAgregarMovimiento}
                    disabled={!concepto || !monto || parseFloat(monto) <= 0}
                    style={{ background: "rgba(200,255,0,0.85)", borderRadius: "10px" }}
                    className="flex-1 py-3 text-rodeo-dark font-black text-sm flex items-center justify-center gap-2 hover:bg-rodeo-lime transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 size={15} /> Guardar
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
                    className="px-4 py-3 text-rodeo-cream/60 text-sm font-bold hover:bg-white/10 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Movimientos */}
      <div>
        <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40 mb-3">
          Movimientos del día ({movimientos.length})
        </p>

        {movimientos.length === 0 ? (
          <div
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px" }}
            className="p-8 text-center"
          >
            <AlertCircle size={28} className="text-rodeo-cream/20 mx-auto mb-2" />
            <p className="text-sm text-rodeo-cream/40">Sin movimientos registrados todavía</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {movimientos.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px" }}
                  className="flex items-center justify-between px-4 py-3 gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      style={{
                        background: m.tipo === "ingreso" ? "rgba(74,222,128,0.15)" : "rgba(255,64,64,0.15)",
                        borderRadius: "8px",
                      }}
                      className="p-1.5 shrink-0"
                    >
                      {m.tipo === "ingreso"
                        ? <TrendingUp size={14} className="text-green-400" />
                        : <TrendingDown size={14} className="text-red-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{m.concepto}</p>
                      <p className="text-xs text-rodeo-cream/40">{m.hora}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-black shrink-0 ${m.tipo === "ingreso" ? "text-green-400" : "text-red-400"}`}>
                    {m.tipo === "egreso" ? "−" : "+"}{formatMoney(m.monto)}
                  </span>
                  <button
                    onClick={() => handleEliminar(m.id)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors shrink-0"
                  >
                    <Trash2 size={13} className="text-rodeo-cream/30 hover:text-red-400 transition-colors" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
