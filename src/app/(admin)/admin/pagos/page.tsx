"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  Banknote, Search, RefreshCw, Loader, Building2,
  CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp,
  Calendar, CreditCard, User, ExternalLink,
} from "lucide-react";

interface Complejo {
  id: string; nombre: string; owner_nombre: string | null; owner_email: string | null;
}

interface Pago {
  id: string; tipo: "subscription" | "comprobante"; plan: string; monto: number;
  estado: string; fecha: string; notas: string | null; comprobante_url?: string | null;
}

const ESTADO_META: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  active:    { icon: CheckCircle2, color: "#4ADE80", bg: "rgba(74,222,128,0.1)",  label: "Activa"    },
  trial:     { icon: Clock,        color: "#FBBF24", bg: "rgba(251,191,36,0.1)",  label: "Trial"     },
  expired:   { icon: XCircle,      color: "#F87171", bg: "rgba(248,113,113,0.1)", label: "Vencida"   },
  cancelled: { icon: XCircle,      color: "#9CA3AF", bg: "rgba(156,163,175,0.1)", label: "Cancelada" },
  pending:   { icon: Clock,        color: "#FBBF24", bg: "rgba(251,191,36,0.1)",  label: "Pendiente" },
  pendiente: { icon: Clock,        color: "#FBBF24", bg: "rgba(251,191,36,0.1)",  label: "Pendiente" },
  aprobado:  { icon: CheckCircle2, color: "#4ADE80", bg: "rgba(74,222,128,0.1)",  label: "Aprobado"  },
  rechazado: { icon: XCircle,      color: "#F87171", bg: "rgba(248,113,113,0.1)", label: "Rechazado" },
};

export default function AdminPagosPage() {
  const [complejos, setComplejos] = useState<Complejo[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pagosMap, setPagosMap] = useState<Record<string, Pago[]>>({});
  const [loadingPagos, setLoadingPagos] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("complexes")
        .select("id, nombre, profiles!owner_id(nombre_completo, email)")
        .order("nombre");

      setComplejos((data || []).map((c: any) => ({
        id: c.id,
        nombre: c.nombre,
        owner_nombre: c.profiles?.nombre_completo,
        owner_email: c.profiles?.email,
      })));
    } finally { setLoading(false); }
  }

  async function loadPagos(complexId: string) {
    if (pagosMap[complexId]) return;
    setLoadingPagos(complexId);
    try {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("id, plan, status, starts_at, ends_at, amount, notes")
        .eq("complex_id", complexId)
        .order("starts_at", { ascending: false });

      const { data: comps } = await (supabase as any)
        .from("payment_comprobantes")
        .select("id, plan, estado, monto, comprobante_url, notas_admin, created_at")
        .eq("complex_id", complexId)
        .order("created_at", { ascending: false });

      const pagos: Pago[] = [
        ...(subs || []).map((s: any) => ({
          id: s.id,
          tipo: "subscription" as const,
          plan: s.plan ?? "owner",
          monto: s.amount ?? 0,
          estado: s.status,
          fecha: s.starts_at ?? "",
          notas: s.notes,
        })),
        ...(comps || []).map((c: any) => ({
          id: c.id,
          tipo: "comprobante" as const,
          plan: c.plan,
          monto: c.monto,
          estado: c.estado,
          fecha: c.created_at?.split("T")[0] ?? "",
          notas: c.notas_admin,
          comprobante_url: c.comprobante_url,
        })),
      ].sort((a, b) => b.fecha.localeCompare(a.fecha));

      setPagosMap(prev => ({ ...prev, [complexId]: pagos }));
    } finally { setLoadingPagos(null); }
  }

  function toggleComplejo(id: string) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    loadPagos(id);
  }

  const filtrados = complejos.filter(c => {
    const q = busqueda.toLowerCase();
    return !q || [c.nombre, c.owner_nombre, c.owner_email].some(v => v?.toLowerCase().includes(q));
  });

  const totalIngresos = Object.values(pagosMap).flat()
    .filter(p => p.tipo === "subscription" && p.estado === "active")
    .reduce((s, p) => s + p.monto, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40">Admin</p>
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "28px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }}
            className="text-white"><span className="section-slash">/</span>Historial de Pagos</h1>
          <p className="text-xs text-rodeo-cream/40 mt-1">Historial completo por complejo — suscripciones y comprobantes</p>
        </div>
        <button onClick={load} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }}
          className="px-3 py-2 text-xs text-rodeo-cream/60">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {totalIngresos > 0 && (
        <div style={{ background: "rgba(200,255,0,0.06)", border: "1px solid rgba(200,255,0,0.2)", borderRadius: 14 }} className="p-4 flex items-center justify-between">
          <p className="text-sm text-rodeo-cream/60">Total licencias activas cargadas</p>
          <p className="text-2xl font-black text-rodeo-lime">${totalIngresos.toLocaleString("es-AR")}</p>
        </div>
      )}

      {/* Búsqueda */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rodeo-cream/30" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar complejo u owner..."
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }}
          className="w-full pl-8 pr-3 py-2.5 text-sm text-white placeholder:text-rodeo-cream/25 focus:outline-none" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-rodeo-lime" /></div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((c, i) => {
            const isOpen = expandedId === c.id;
            const pagos = pagosMap[c.id] ?? [];
            const subActiva = pagos.find(p => p.tipo === "subscription" && p.estado === "active");
            const pendientes = pagos.filter(p => p.tipo === "comprobante" && p.estado === "pendiente").length;

            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${isOpen ? "rgba(200,255,0,0.2)" : "rgba(255,255,255,0.07)"}`, borderRadius: 14 }}>
                {/* Header del complejo */}
                <button onClick={() => toggleComplejo(c.id)} className="w-full flex items-center gap-4 px-5 py-4 text-left">
                  <div className="w-9 h-9 rounded-xl bg-rodeo-lime/10 flex items-center justify-center shrink-0">
                    <Building2 size={15} className="text-rodeo-lime" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-white">{c.nombre}</p>
                      {subActiva && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-400/10 text-green-400">Activa</span>
                      )}
                      {pendientes > 0 && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-rodeo-dark">{pendientes} pendiente{pendientes > 1 ? "s" : ""}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-rodeo-cream/40">
                      <span className="flex items-center gap-1"><User size={10} />{c.owner_nombre ?? "—"}</span>
                      <span>{c.owner_email}</span>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-rodeo-cream/30 shrink-0" /> : <ChevronDown size={16} className="text-rodeo-cream/30 shrink-0" />}
                </button>

                {/* Historial expandido */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-5 pb-4 pt-0 space-y-2 border-t border-white/6">
                        {loadingPagos === c.id ? (
                          <div className="py-6 flex justify-center"><Loader size={18} className="animate-spin text-rodeo-lime" /></div>
                        ) : pagos.length === 0 ? (
                          <p className="text-xs text-rodeo-cream/30 py-4 text-center">Sin historial de pagos</p>
                        ) : pagos.map(p => {
                          const m = ESTADO_META[p.estado] ?? ESTADO_META.pendiente;
                          return (
                            <div key={p.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}
                              className="flex items-center gap-3 px-4 py-3">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: m.bg }}>
                                {p.tipo === "comprobante"
                                  ? <Banknote size={12} style={{ color: m.color }} />
                                  : <CreditCard size={12} style={{ color: m.color }} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-white">
                                    {p.tipo === "comprobante" ? "Transferencia" : "Suscripción"} — {p.plan === "monthly" || p.plan === "owner" ? "Mensual" : p.plan === "annual" ? "Anual" : p.plan}
                                  </span>
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ background: m.bg, color: m.color }}>{m.label}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-rodeo-cream/35">
                                  <span className="flex items-center gap-1"><Calendar size={9} />{p.fecha ? new Date(p.fecha).toLocaleDateString("es-AR") : "—"}</span>
                                  {p.monto > 0 && <span className="font-bold text-rodeo-lime/70">${p.monto.toLocaleString("es-AR")}</span>}
                                  {p.notas && <span className="italic truncate max-w-[180px]">{p.notas}</span>}
                                </div>
                              </div>
                              {p.comprobante_url && (
                                <a href={p.comprobante_url} target="_blank" rel="noreferrer"
                                  className="p-1.5 rounded-lg hover:bg-white/8 transition-colors shrink-0">
                                  <ExternalLink size={12} className="text-rodeo-cream/40" />
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
          {filtrados.length === 0 && <p className="text-center py-10 text-rodeo-cream/30 text-sm">Sin complejos</p>}
        </div>
      )}
    </div>
  );
}
