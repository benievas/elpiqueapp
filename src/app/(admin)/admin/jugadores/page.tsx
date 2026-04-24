"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase, supabaseMut } from "@/lib/supabase";
import {
  Users, Search, RefreshCw, Loader, Shield, ShieldOff,
  Calendar, Mail, Phone, Star, Trash2, X,
} from "lucide-react";

interface Jugador {
  id: string; email: string; nombre_completo: string | null;
  telefono: string | null; ciudad: string | null; rol: string;
  created_at: string; avatar_url: string | null;
  total_reservas?: number; total_reviews?: number;
}

export default function AdminJugadoresPage() {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("jugador");
  const [acting, setActing] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; action: string } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, nombre_completo, telefono, ciudad, rol, created_at, avatar_url")
        .order("created_at", { ascending: false });

      const profiles = data || [];
      const ids = profiles.map((p: any) => p.id);

      // Contar reservas y reviews por usuario
      const [resData, revData] = await Promise.all([
        ids.length ? supabase.from("reservations").select("user_id").in("user_id", ids) : Promise.resolve({ data: [] }),
        ids.length ? supabase.from("reviews").select("user_id").in("user_id", ids) : Promise.resolve({ data: [] }),
      ]);

      const resCount: Record<string, number> = {};
      const revCount: Record<string, number> = {};
      (resData.data || []).forEach((r: any) => { resCount[r.user_id] = (resCount[r.user_id] || 0) + 1; });
      (revData.data || []).forEach((r: any) => { revCount[r.user_id] = (revCount[r.user_id] || 0) + 1; });

      setJugadores(profiles.map((p: any) => ({
        ...p,
        total_reservas: resCount[p.id] || 0,
        total_reviews: revCount[p.id] || 0,
      })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function cambiarRol(id: string, nuevoRol: string) {
    setActing(id);
    await supabaseMut.from("profiles").update({ rol: nuevoRol }).eq("id", id);
    setJugadores(prev => prev.map(j => j.id === id ? { ...j, rol: nuevoRol } : j));
    setActing(null);
    setConfirm(null);
  }

  const ROL_COLORES: Record<string, { color: string; bg: string; label: string }> = {
    jugador:     { color: "#60A5FA", bg: "rgba(96,165,250,0.1)",  label: "Jugador" },
    propietario: { color: "#C8FF00", bg: "rgba(200,255,0,0.1)",   label: "Propietario" },
    admin:       { color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  label: "Admin" },
  };

  const ROLES = ["todos", "jugador", "propietario", "admin"];

  const filtrados = jugadores.filter(j => {
    const matchRol = filtroRol === "todos" || j.rol === filtroRol;
    const q = busqueda.toLowerCase();
    const matchQ = !q || [j.email, j.nombre_completo, j.ciudad].some(v => v?.toLowerCase().includes(q));
    return matchRol && matchQ;
  });

  const totalPorRol = (rol: string) => jugadores.filter(j => j.rol === rol).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40">Admin</p>
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "28px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }}
            className="text-white"><span className="section-slash">/</span>Usuarios</h1>
        </div>
        <button onClick={load} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
          className="px-3 py-2 text-xs text-rodeo-cream/60">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(["jugador", "propietario", "admin"] as const).map(rol => {
          const m = ROL_COLORES[rol];
          return (
            <div key={rol} style={{ background: m.bg, border: `1px solid ${m.color}25`, borderRadius: 14 }} className="p-4">
              <p className="text-xl font-black" style={{ color: m.color }}>{totalPorRol(rol)}</p>
              <p className="text-xs text-rodeo-cream/50">{m.label}s</p>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rodeo-cream/30" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre, email o ciudad..."
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }}
            className="w-full pl-8 pr-3 py-2.5 text-sm text-white placeholder:text-rodeo-cream/25 focus:outline-none" />
        </div>
        <div className="flex gap-1">
          {ROLES.map(r => (
            <button key={r} onClick={() => setFiltroRol(r)}
              style={filtroRol === r
                ? { background: "rgba(200,255,0,0.15)", border: "1px solid rgba(200,255,0,0.3)", borderRadius: 8 }
                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}
              className={`px-3 py-2 text-xs font-bold capitalize ${filtroRol === r ? "text-rodeo-lime" : "text-rodeo-cream/50"}`}>
              {r === "todos" ? "Todos" : ROL_COLORES[r]?.label + "s"}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-rodeo-lime" /></div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((j, i) => {
            const m = ROL_COLORES[j.rol] ?? ROL_COLORES.jugador;
            return (
              <motion.div key={j.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14 }}
                className="flex items-center gap-4 px-5 py-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-black"
                  style={{ background: m.bg, color: m.color }}>
                  {j.avatar_url
                    ? <img src={j.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    : (j.nombre_completo?.[0] ?? j.email[0]).toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-white truncate">{j.nombre_completo || "Sin nombre"}</p>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: m.bg, color: m.color }}>{m.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-rodeo-cream/40"><Mail size={10} />{j.email}</span>
                    {j.telefono && <span className="flex items-center gap-1 text-xs text-rodeo-cream/30"><Phone size={10} />{j.telefono}</span>}
                    {j.ciudad && <span className="text-xs text-rodeo-cream/30">{j.ciudad}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-rodeo-cream/30">{j.total_reservas} reservas · {j.total_reviews} reseñas</span>
                    <span className="text-[11px] text-rodeo-cream/20">Desde {new Date(j.created_at).toLocaleDateString("es-AR")}</span>
                  </div>
                </div>
                {/* Acciones */}
                <div className="flex items-center gap-2 shrink-0">
                  {j.rol === "jugador" && (
                    <button onClick={() => setConfirm({ id: j.id, action: "propietario" })}
                      style={{ background: "rgba(200,255,0,0.08)", border: "1px solid rgba(200,255,0,0.2)", borderRadius: 8 }}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-rodeo-lime/70 hover:text-rodeo-lime transition-colors">
                      → Owner
                    </button>
                  )}
                  {j.rol === "propietario" && (
                    <button onClick={() => setConfirm({ id: j.id, action: "jugador" })}
                      style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8 }}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-red-400/70 hover:text-red-400 transition-colors">
                      → Jugador
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
          {filtrados.length === 0 && <p className="text-center py-10 text-rodeo-cream/30 text-sm">Sin resultados</p>}
        </div>
      )}

      {/* Modal confirmación cambio de rol */}
      {confirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setConfirm(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "rgba(26,18,11,0.97)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, maxWidth: 360, width: "100%" }} className="p-6 space-y-4">
            <p className="font-black text-white">Cambiar rol</p>
            <p className="text-sm text-rodeo-cream/60">
              ¿Cambiar a <strong className="text-white">{ROL_COLORES[confirm.action]?.label}</strong>?
              {confirm.action === "propietario" ? " El usuario podrá crear y gestionar complejos." : " El usuario perderá acceso al panel de owner."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 rounded-[12px] text-sm font-bold text-rodeo-cream/60"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>Cancelar</button>
              <button onClick={() => cambiarRol(confirm.id, confirm.action)} disabled={!!acting}
                className="flex-1 py-2.5 rounded-[12px] text-sm font-black text-rodeo-dark disabled:opacity-40"
                style={{ background: "rgba(200,255,0,0.9)" }}>
                {acting ? <Loader size={14} className="animate-spin mx-auto" /> : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
