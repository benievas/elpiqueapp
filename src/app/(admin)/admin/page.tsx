"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Building2, Users, Calendar, TrendingUp, CreditCard, Layers,
  ArrowRight, RefreshCw, CheckCircle2, AlertCircle, Clock,
} from "lucide-react";

interface Stats {
  totalComplejos: number;
  complejosActivos: number;
  totalOwners: number;
  totalReservas: number;
  reservasHoy: number;
  ingresosMes: number;
  suscripcionesActivas: number;
  suscripcionesTrial: number;
  suscripcionesVencidas: number;
}

interface RecentComplex {
  id: string; nombre: string; ciudad: string; activo: boolean; created_at: string;
  owner_email?: string;
}

function StatCard({ icon: Icon, label, value, sub, color = "#C8FF00", delay = 0 }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" }}
      className="p-5 flex flex-col gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-xs text-rodeo-cream/50 mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-rodeo-cream/30 mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recientes, setRecientes] = useState<RecentComplex[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const hoy = new Date().toISOString().split("T")[0];
      const primerMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

      const [complejosRes, ownersRes, reservasRes, reservasHoyRes, ingresosMesRes, subsRes, complejosRecRes] = await Promise.all([
        supabase.from("complexes").select("id, activo", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }).eq("rol", "propietario"),
        supabase.from("reservations").select("id", { count: "exact" }),
        supabase.from("reservations").select("id", { count: "exact", head: true }).eq("fecha", hoy),
        supabase.from("reservations").select("precio_total").in("estado", ["confirmada", "completada"]).gte("fecha", primerMes),
        supabase.from("subscriptions").select("status"),
        supabase.from("complexes").select("id, nombre, ciudad, activo, created_at, profiles!owner_id(email)").order("created_at", { ascending: false }).limit(5),
      ]);

      const complejos = (complejosRes.data || []) as { id: string; activo: boolean }[];
      const subs = (subsRes.data || []) as { status: string }[];
      const ingresos = (ingresosMesRes.data || []).reduce((s: number, r: any) => s + (r.precio_total || 0), 0);

      setStats({
        totalComplejos: complejosRes.count ?? 0,
        complejosActivos: complejos.filter(c => c.activo).length,
        totalOwners: ownersRes.count ?? 0,
        totalReservas: reservasRes.count ?? 0,
        reservasHoy: reservasHoyRes.count ?? 0,
        ingresosMes: ingresos,
        suscripcionesActivas: subs.filter(s => s.status === "active").length,
        suscripcionesTrial: subs.filter(s => s.status === "trial").length,
        suscripcionesVencidas: subs.filter(s => s.status === "expired").length,
      });

      setRecientes((complejosRecRes.data || []).map((c: any) => ({
        id: c.id, nombre: c.nombre, ciudad: c.ciudad, activo: c.activo, created_at: c.created_at,
        owner_email: Array.isArray(c.profiles) ? c.profiles[0]?.email : c.profiles?.email,
      })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40">Superadmin</p>
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "34px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }} className="text-white mt-0.5"><span className="section-slash">/</span>Dashboard</h1>
        </div>
        <button onClick={load} disabled={loading}
          style={{ background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.2)", borderRadius: "10px" }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-rodeo-lime disabled:opacity-40">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Actualizar
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", height: 110,
              backgroundImage: "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)",
              backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.5s infinite" }} />
          ))}
        </div>
      ) : stats && (
        <>
          {/* Row 1 — Plataforma */}
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-rodeo-cream/30 mb-3">Plataforma</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Building2} label="Complejos totales" value={stats.totalComplejos} sub={`${stats.complejosActivos} activos`} delay={0} />
              <StatCard icon={Users} label="Propietarios" value={stats.totalOwners} color="#00E5FF" delay={0.05} />
              <StatCard icon={Calendar} label="Reservas totales" value={stats.totalReservas} sub={`${stats.reservasHoy} hoy`} color="#A78BFA" delay={0.1} />
              <StatCard icon={TrendingUp} label="Ingresos este mes" value={`$${stats.ingresosMes.toLocaleString("es-AR")}`} sub="confirmadas + completadas" color="#34D399" delay={0.15} />
            </div>
          </div>

          {/* Row 2 — Suscripciones */}
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-rodeo-cream/30 mb-3">Suscripciones</p>
            <div className="grid grid-cols-3 gap-4">
              <StatCard icon={CheckCircle2} label="Activas (pagas)" value={stats.suscripcionesActivas} color="#34D399" delay={0.2} />
              <StatCard icon={Clock} label="En trial" value={stats.suscripcionesTrial} color="#FBBF24" delay={0.25} />
              <StatCard icon={AlertCircle} label="Vencidas" value={stats.suscripcionesVencidas} color="#F87171" delay={0.3} />
            </div>
          </div>

          {/* Últimos complejos registrados */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px" }}
            className="p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-black text-white uppercase tracking-wide">Últimos complejos registrados</p>
              <Link href="/admin/complejos" className="flex items-center gap-1 text-xs text-rodeo-lime/70 hover:text-rodeo-lime transition-colors">
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {recientes.map((c) => (
                <div key={c.id} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/4 transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{c.nombre}</p>
                    <p className="text-xs text-rodeo-cream/40">{c.ciudad} · {c.owner_email ?? "sin owner"}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.activo ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"}`}>
                    {c.activo ? "activo" : "inactivo"}
                  </span>
                  <p className="text-[11px] text-rodeo-cream/30 shrink-0">{new Date(c.created_at).toLocaleDateString("es-AR")}</p>
                </div>
              ))}
              {recientes.length === 0 && <p className="text-xs text-rodeo-cream/30 text-center py-4">Sin complejos registrados aún</p>}
            </div>
          </motion.div>

          {/* Accesos rápidos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/admin/complejos",    icon: Building2,  label: "Complejos"         },
              { href: "/admin/jugadores",    icon: Users,      label: "Usuarios"           },
              { href: "/admin/torneos",      icon: Layers,     label: "Torneos"            },
              { href: "/admin/reservas",     icon: Calendar,   label: "Reservas"           },
              { href: "/admin/resenas",      icon: TrendingUp, label: "Reseñas"            },
              { href: "/admin/suscripciones",icon: CreditCard, label: "Suscripciones"      },
              { href: "/admin/comprobantes", icon: CheckCircle2,label:"Comprobantes"       },
              { href: "/admin/pagos",        icon: TrendingUp, label: "Historial de pagos" },
              { href: "/admin/feed",         icon: TrendingUp, label: "Feed / Anuncios"    },
              { href: "/admin/home-config",  icon: Layers,     label: "Slides del home"    },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <div style={{ background: "rgba(200,255,0,0.06)", border: "1px solid rgba(200,255,0,0.15)", borderRadius: "14px" }}
                  className="p-4 flex items-center gap-3 hover:bg-rodeo-lime/10 transition-all group">
                  <item.icon size={16} className="text-rodeo-lime shrink-0" />
                  <span className="text-xs font-bold text-rodeo-cream/70 group-hover:text-white transition-colors">{item.label}</span>
                  <ArrowRight size={12} className="text-rodeo-cream/30 ml-auto group-hover:text-rodeo-lime transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
