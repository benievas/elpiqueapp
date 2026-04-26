"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck, RefreshCw, CheckCircle2, XCircle, Clock,
  ExternalLink, Search, ChevronDown, Building2, User, Calendar,
  Banknote, AlertCircle, Loader, X,
} from "lucide-react";
import { supabase, supabaseMut } from "@/lib/supabase";

interface Comprobante {
  id: string;
  user_id: string;
  complex_id: string | null;
  plan: "monthly" | "annual";
  monto: number;
  comprobante_url: string;
  estado: "pendiente" | "aprobado" | "rechazado";
  notas_admin: string | null;
  created_at: string;
  reviewed_at: string | null;
  owner_email?: string;
  owner_nombre?: string;
  complejo_nombre?: string;
}

const ESTADOS = ["Todos", "pendiente", "aprobado", "rechazado"] as const;

const ESTADO_META = {
  pendiente: { icon: Clock,        color: "#FBBF24", label: "Pendiente",  bg: "rgba(251,191,36,0.12)"  },
  aprobado:  { icon: CheckCircle2, color: "#4ADE80", label: "Aprobado",   bg: "rgba(74,222,128,0.10)"  },
  rechazado: { icon: XCircle,      color: "#F87171", label: "Rechazado",  bg: "rgba(248,113,113,0.10)" },
};

const PLAN_DAYS: Record<string, number> = { monthly: 30, annual: 365 };

export default function AdminComprobantesPage() {
  const [items, setItems] = useState<Comprobante[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("pendiente");
  const [busqueda, setBusqueda] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [selected, setSelected] = useState<Comprobante | null>(null);
  const [notaAdmin, setNotaAdmin] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("payment_comprobantes")
        .select("*, profiles!user_id(email, nombre_completo), complexes!complex_id(nombre)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setItems((data || []).map((r: any) => ({
        ...r,
        owner_email:   r.profiles?.email,
        owner_nombre:  r.profiles?.nombre_completo,
        complejo_nombre: r.complexes?.nombre,
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAprobar(comp: Comprobante) {
    setProcessing(comp.id);
    setActionError(null);
    try {
      const now = new Date();
      const endsAt = new Date(now);
      endsAt.setDate(endsAt.getDate() + PLAN_DAYS[comp.plan]);

      const subPayload = {
        user_id: comp.user_id,
        plan: "owner",
        status: "active",
        is_trial: false,
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        amount: comp.monto,
        notes: `Activado por comprobante ${comp.id} (${comp.plan})`,
      };

      // Check if subscription exists for this user
      const { data: existingSub } = await (supabase as any)
        .from("subscriptions")
        .select("id")
        .eq("user_id", comp.user_id)
        .eq("plan", "owner")
        .maybeSingle();

      if (existingSub?.id) {
        await (supabaseMut as any).from("subscriptions").update({
          status: "active",
          is_trial: false,
          starts_at: now.toISOString(),
          ends_at: endsAt.toISOString(),
          amount: comp.monto,
          notes: subPayload.notes,
        }).eq("id", existingSub.id);
      } else {
        await (supabaseMut as any).from("subscriptions").insert(subPayload);
      }

      // Mark comprobante as approved
      await (supabaseMut as any).from("payment_comprobantes").update({
        estado: "aprobado",
        notas_admin: notaAdmin || null,
        reviewed_at: now.toISOString(),
      }).eq("id", comp.id);

      setActionOk(`Licencia activada hasta ${endsAt.toLocaleDateString("es-AR")} — ${comp.plan === "monthly" ? "30 días" : "365 días"}`);
      setSelected(null);
      setNotaAdmin("");
      await load();
    } catch (e: any) {
      setActionError(e?.message || "Error al aprobar");
    } finally {
      setProcessing(null);
    }
  }

  async function handleRechazar(comp: Comprobante) {
    setProcessing(comp.id);
    setActionError(null);
    try {
      await (supabaseMut as any).from("payment_comprobantes").update({
        estado: "rechazado",
        notas_admin: notaAdmin || null,
        reviewed_at: new Date().toISOString(),
      }).eq("id", comp.id);

      setActionOk("Comprobante rechazado.");
      setSelected(null);
      setNotaAdmin("");
      await load();
    } catch (e: any) {
      setActionError(e?.message || "Error al rechazar");
    } finally {
      setProcessing(null);
    }
  }

  const filtered = items.filter(c => {
    const matchEstado = filtroEstado === "Todos" || c.estado === filtroEstado;
    const q = busqueda.toLowerCase();
    const matchBusqueda = !q || [c.owner_email, c.owner_nombre, c.complejo_nombre].some(v => v?.toLowerCase().includes(q));
    return matchEstado && matchBusqueda;
  });

  const pendingCount = items.filter(c => c.estado === "pendiente").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileCheck size={20} className="text-rodeo-lime" />
            <h1 className="text-2xl font-black text-white">Comprobantes de Pago</h1>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-black text-rodeo-dark bg-amber-400">
                {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-sm text-rodeo-cream/50">Revisá los comprobantes de transferencia y activá licencias manualmente.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-[12px] text-sm font-bold text-rodeo-cream/70 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* Success / error feedback */}
      <AnimatePresence>
        {actionOk && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 12 }}
            className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-green-400 shrink-0" />
              <p className="text-sm font-bold text-green-300">{actionOk}</p>
            </div>
            <button onClick={() => setActionOk(null)}><X size={14} className="text-green-400/50 hover:text-green-400" /></button>
          </motion.div>
        )}
        {actionError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 12 }}
            className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <p className="text-sm font-bold text-red-300">{actionError}</p>
            </div>
            <button onClick={() => setActionError(null)}><X size={14} className="text-red-400/50 hover:text-red-400" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-[12px] flex-1 min-w-[200px]"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Search size={14} className="text-rodeo-cream/40 shrink-0" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por owner o complejo..."
            className="bg-transparent text-sm text-white placeholder:text-rodeo-cream/30 outline-none w-full" />
        </div>
        <div className="flex gap-1.5">
          {ESTADOS.map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)}
              className="px-3 py-2 rounded-[10px] text-xs font-bold transition-all"
              style={filtroEstado === e
                ? { background: "rgba(200,255,0,0.2)", border: "1px solid rgba(200,255,0,0.4)", color: "#C8FF00" }
                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(225,212,194,0.5)" }}>
              {e === "Todos" ? "Todos" : ESTADO_META[e as keyof typeof ESTADO_META]?.label ?? e}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader size={24} className="text-rodeo-lime animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileCheck size={32} className="text-rodeo-cream/20 mx-auto mb-3" />
          <p className="text-rodeo-cream/40 font-bold">No hay comprobantes {filtroEstado !== "Todos" ? `en estado "${ESTADO_META[filtroEstado as keyof typeof ESTADO_META]?.label}"` : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(comp => {
            const meta = ESTADO_META[comp.estado];
            const Icon = meta.icon;
            const isProcessing = processing === comp.id;
            return (
              <motion.div key={comp.id} layout
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}
                className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left: info */}
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black"
                        style={{ background: meta.bg, color: meta.color }}>
                        <Icon size={10} /> {meta.label}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-black"
                        style={{ background: "rgba(200,255,0,0.1)", color: "#C8FF00", border: "1px solid rgba(200,255,0,0.2)" }}>
                        {comp.plan === "monthly" ? "MENSUAL — 30 días" : "ANUAL — 365 días"}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <User size={12} className="text-rodeo-cream/40 shrink-0" />
                        <span className="text-white font-bold truncate">{comp.owner_nombre || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 size={12} className="text-rodeo-cream/40 shrink-0" />
                        <span className="text-rodeo-cream/70 truncate">{comp.complejo_nombre || "Sin complejo"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-rodeo-cream/40 shrink-0">Email:</span>
                        <span className="text-rodeo-cream/60 truncate">{comp.owner_email || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Banknote size={11} className="text-rodeo-cream/40 shrink-0" />
                        <span className="text-rodeo-lime font-black">${comp.monto.toLocaleString("es-AR")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar size={11} className="text-rodeo-cream/40 shrink-0" />
                        <span className="text-rodeo-cream/40">Recibido: {new Date(comp.created_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</span>
                      </div>
                      {comp.reviewed_at && (
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar size={11} className="text-rodeo-cream/40 shrink-0" />
                          <span className="text-rodeo-cream/40">Revisado: {new Date(comp.reviewed_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</span>
                        </div>
                      )}
                    </div>

                    {comp.notas_admin && (
                      <p className="text-xs text-rodeo-cream/50 italic">Nota: {comp.notas_admin}</p>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <a href={comp.comprobante_url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-bold transition-all hover:brightness-110"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(225,212,194,0.8)" }}>
                      <ExternalLink size={12} /> Ver comprobante
                    </a>
                    {comp.estado === "pendiente" && (
                      <button onClick={() => { setSelected(comp); setNotaAdmin(""); setActionError(null); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-black transition-all hover:brightness-110"
                        style={{ background: "rgba(200,255,0,0.15)", border: "1px solid rgba(200,255,0,0.35)", color: "#C8FF00" }}>
                        Revisar
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Review modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
            onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
            <motion.div initial={{ scale: 0.93, y: 16, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.93, y: 16, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{ background: "rgba(26,18,11,0.97)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, maxWidth: 480, width: "100%" }}
              className="p-6 space-y-5">

              <div className="flex items-center justify-between">
                <p className="text-lg font-black text-white">Revisar comprobante</p>
                <button onClick={() => setSelected(null)}><X size={18} className="text-rodeo-cream/40 hover:text-white" /></button>
              </div>

              {/* Summary */}
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
                className="p-4 space-y-2.5">
                {[
                  { label: "Owner",     value: selected.owner_nombre || "—" },
                  { label: "Email",     value: selected.owner_email || "—" },
                  { label: "Complejo",  value: selected.complejo_nombre || "Sin complejo" },
                  { label: "Plan",      value: selected.plan === "monthly" ? "Mensual (30 días)" : "Anual (365 días)" },
                  { label: "Monto",     value: `$${selected.monto.toLocaleString("es-AR")}` },
                  { label: "Recibido",  value: new Date(selected.created_at).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" }) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-rodeo-cream/40 font-bold">{label}</span>
                    <span className="text-sm text-white font-bold text-right truncate max-w-[260px]">{value}</span>
                  </div>
                ))}
              </div>

              <a href={selected.comprobante_url} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[12px] text-sm font-bold transition-all hover:brightness-110"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(225,212,194,0.8)" }}>
                <ExternalLink size={14} /> Abrir comprobante
              </a>

              <div className="space-y-2">
                <label className="text-xs font-bold text-rodeo-cream/50 uppercase tracking-wider">Nota interna (opcional)</label>
                <textarea value={notaAdmin} onChange={e => setNotaAdmin(e.target.value)} rows={2}
                  placeholder="Ej: Pago verificado, monto correcto..."
                  className="w-full rounded-[10px] px-3 py-2.5 text-sm text-white placeholder:text-rodeo-cream/25 outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>

              {actionError && (
                <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{actionError}</p>
              )}

              <div className="flex gap-3">
                <button onClick={() => handleRechazar(selected)} disabled={!!processing}
                  className="flex-1 py-3 rounded-[12px] text-sm font-black transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", color: "#F87171" }}>
                  {processing === selected.id ? <Loader size={14} className="animate-spin"/> : <XCircle size={14} />}
                  Rechazar
                </button>
                <button onClick={() => handleAprobar(selected)} disabled={!!processing}
                  className="flex-1 py-3 rounded-[12px] text-sm font-black transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: "rgba(200,255,0,0.9)", color: "#1A120B" }}>
                  {processing === selected.id ? <Loader size={14} className="animate-spin"/> : <CheckCircle2 size={14} />}
                  Aprobar y activar
                </button>
              </div>

              <p className="text-[11px] text-rodeo-cream/30 text-center">
                Al aprobar se activa la licencia del complejo por {selected.plan === "monthly" ? "30 días" : "365 días"} desde hoy.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
