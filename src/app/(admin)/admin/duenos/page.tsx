"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Users, Search, ChevronLeft, RefreshCw, Building2, ExternalLink } from "lucide-react";

interface Owner {
  id: string; email: string; nombre_completo: string | null; telefono: string | null;
  ciudad: string; created_at: string;
  complejo_nombre?: string; complejo_slug?: string;
  sub_estado?: string; sub_vence?: string;
}

const ESTADO_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  active:  { bg: "rgba(74,222,128,0.12)",  text: "#4ADE80", label: "Activa" },
  trial:   { bg: "rgba(251,191,36,0.12)",  text: "#FBBF24", label: "Trial" },
  expired: { bg: "rgba(248,113,113,0.12)", text: "#F87171", label: "Vencida" },
};

export default function AdminDuenosPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, nombre_completo, telefono, ciudad, created_at")
        .eq("rol", "propietario")
        .order("created_at", { ascending: false }) as { data: any[] | null };

      if (!profiles?.length) { setOwners([]); setLoading(false); return; }

      const ids = profiles.map(p => p.id);
      const [complejosRes, subsRes] = await Promise.all([
        supabase.from("complexes").select("owner_id, nombre, slug").in("owner_id", ids),
        supabase.from("subscriptions").select("owner_id, estado, fecha_fin").in("owner_id", ids),
      ]);

      const compMap: Record<string, { nombre: string; slug: string }> = {};
      (complejosRes.data || []).forEach((c: any) => { compMap[c.owner_id] = { nombre: c.nombre, slug: c.slug }; });
      const subMap: Record<string, { estado: string; fecha_fin: string }> = {};
      (subsRes.data || []).forEach((s: any) => { subMap[s.owner_id] = { estado: s.estado, fecha_fin: s.fecha_fin }; });

      setOwners(profiles.map(p => ({
        ...p,
        complejo_nombre: compMap[p.id]?.nombre,
        complejo_slug: compMap[p.id]?.slug,
        sub_estado: subMap[p.id]?.estado,
        sub_vence: subMap[p.id]?.fecha_fin,
      })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filtrados = owners.filter(o =>
    (o.nombre_completo ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
    o.email.toLowerCase().includes(busqueda.toLowerCase()) ||
    (o.complejo_nombre ?? "").toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
          <ChevronLeft size={20} className="text-rodeo-cream/50" />
        </Link>
        <div className="flex-1">
          <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40">Admin</p>
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "28px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }} className="text-white"><span className="section-slash">/</span>Propietarios</h1>
        </div>
        <button onClick={load} disabled={loading}
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-rodeo-cream/60 disabled:opacity-40">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/30" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, email o complejo..."
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
          className="w-full pl-9 pr-4 py-3 text-sm text-white placeholder:text-rodeo-cream/25 focus:outline-none focus:border-rodeo-lime/40" />
      </div>

      <div className="flex gap-3 text-xs">
        <span className="px-3 py-1 rounded-full bg-white/5 text-rodeo-cream/50">{owners.length} propietarios</span>
        <span className="px-3 py-1 rounded-full bg-green-400/10 text-green-400">{owners.filter(o => o.sub_estado === "active").length} suscripción activa</span>
        <span className="px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-400">{owners.filter(o => o.sub_estado === "trial").length} en trial</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 80, borderRadius: 14, background: "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.5s infinite" }} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((o, i) => {
            const est = o.sub_estado ? (ESTADO_COLOR[o.sub_estado] ?? ESTADO_COLOR.expired) : null;
            return (
              <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px" }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors">
                <div className="w-9 h-9 rounded-full bg-rodeo-lime/10 border border-rodeo-lime/20 flex items-center justify-center shrink-0 text-sm font-black text-rodeo-lime">
                  {(o.nombre_completo?.[0] ?? o.email[0]).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{o.nombre_completo ?? o.email}</p>
                  <p className="text-xs text-rodeo-cream/40">{o.email}</p>
                  {o.complejo_nombre && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Building2 size={10} className="text-rodeo-cream/30" />
                      <span className="text-[11px] text-rodeo-cream/40">{o.complejo_nombre}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {est && (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: est.bg, color: est.text }}>
                      {est.label}
                    </span>
                  )}
                  {o.sub_vence && (
                    <span className="text-[10px] text-rodeo-cream/30">vence {new Date(o.sub_vence).toLocaleDateString("es-AR")}</span>
                  )}
                  {o.complejo_slug && (
                    <a href={`/complejo/${o.complejo_slug}`} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                      <ExternalLink size={13} className="text-rodeo-cream/30 hover:text-rodeo-lime" />
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
          {filtrados.length === 0 && (
            <div className="text-center py-12 text-rodeo-cream/30 text-sm flex flex-col items-center gap-3">
              <Users size={28} className="opacity-20" />
              {busqueda ? `Sin resultados para "${busqueda}"` : "Aún no hay propietarios registrados"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
