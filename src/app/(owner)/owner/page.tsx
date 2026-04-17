"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, BarChart3, Calendar, ClipboardList, Crown, ArrowRight, Wallet, QrCode } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase";

interface DashboardStats {
  reservasHoy: number;
  canchasActivas: number;
  ingresosMes: number;
  rating: number | null;
}

const QUICK_ACCESS = [
  { icon: Building2, label: "Mi Complejo", desc: "Información y datos del complejo", href: "/owner/complejo" },
  { icon: Wallet, label: "Caja y Cierre", desc: "Registrá ingresos y egresos del día", href: "/owner/caja" },
  { icon: Calendar, label: "Canchas", desc: "Gestión de canchas y horarios", href: "/owner/canchas" },
  { icon: ClipboardList, label: "Reservas", desc: "Ver y gestionar reservas entrantes", href: "/owner/reservas" },
  { icon: BarChart3, label: "Estadísticas", desc: "Rendimiento y métricas del complejo", href: "/owner/stats" },
  { icon: QrCode, label: "Mi Link / QR", desc: "Compartí tu complejo en redes", href: "/owner/mi-link" },
  { icon: Crown, label: "Suscripción", desc: "Plan activo y facturación", href: "/owner/suscripcion" },
];

export default function OwnerPage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [complexName, setComplexName] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const fetchStats = async () => {
      // Fetch owner's complex IDs
      const { data: complejos } = await supabase
        .from("complexes")
        .select("id, nombre, rating_promedio")
        .eq("owner_id", user.id) as { data: { id: string; nombre: string; rating_promedio: number | null }[] | null };

      if (!complejos?.length) { setStats({ reservasHoy: 0, canchasActivas: 0, ingresosMes: 0, rating: null }); return; }
      setComplexName(complejos[0].nombre);

      const complexIds = complejos.map((c) => c.id);
      const todayISO = new Date().toISOString().split("T")[0];
      const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

      const [reservasHoyRes, canchasRes, ingresosMesRes] = await Promise.all([
        supabase.from("reservations").select("id", { count: "exact", head: true }).in("complex_id", complexIds).eq("fecha", todayISO),
        supabase.from("courts").select("id", { count: "exact", head: true }).in("complex_id", complexIds).eq("activa", true),
        supabase.from("reservations").select("precio_total").in("complex_id", complexIds).in("estado", ["confirmada", "completada"]).gte("fecha", firstOfMonth),
      ]);

      const ingresosTotal = (ingresosMesRes.data || []).reduce((s: number, r: { precio_total: number }) => s + (r.precio_total || 0), 0);
      const withRating = complejos.filter((c) => c.rating_promedio);
      const avgRating = withRating.length ? withRating.reduce((s, c) => s + (c.rating_promedio ?? 0), 0) / withRating.length : null;

      setStats({
        reservasHoy: reservasHoyRes.count ?? 0,
        canchasActivas: canchasRes.count ?? 0,
        ingresosMes: ingresosTotal,
        rating: avgRating || null,
      });
    };
    fetchStats();
  }, [user?.id]);

  const formatARS = (n: number) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

  const STAT_CARDS = [
    { label: "Reservas hoy", valor: stats ? String(stats.reservasHoy) : "…", icon: "📅", color: "#C8FF00" },
    { label: "Canchas activas", valor: stats ? String(stats.canchasActivas) : "…", icon: "⚽", color: "#00E5FF" },
    { label: "Ingresos este mes", valor: stats ? formatARS(stats.ingresosMes) : "…", icon: "💰", color: "#C8FF00" },
    { label: "Calificación", valor: stats ? (stats.rating ? `${stats.rating.toFixed(1)}/5` : "S/D") : "…", icon: "⭐", color: "#FFD600" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs text-rodeo-cream/50 font-bold tracking-widest uppercase mb-1">Panel de Control</p>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
          {complexName ? `Bienvenido, ${complexName}` : profile?.nombre_completo ? `Hola, ${profile.nombre_completo.split(" ")[0]}` : "Bienvenido"}
        </h1>
        <p className="text-sm text-rodeo-cream/60 mt-1">Gestioná tu complejo deportivo desde acá.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((stat) => (
          <div
            key={stat.label}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" }}
            className="p-4 flex flex-col gap-2"
          >
            <span className="text-2xl">{stat.icon}</span>
            <p className="text-xl font-black" style={{ color: stat.color }}>{stat.valor}</p>
            <p className="text-xs text-rodeo-cream/50">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div>
        <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40 mb-4">Accesos rápidos</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {QUICK_ACCESS.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" }}
                className="p-5 flex items-center gap-4 hover:bg-white/8 transition-all group cursor-pointer"
              >
                <div
                  style={{ background: "rgba(200,255,0,0.12)", border: "1px solid rgba(200,255,0,0.25)", borderRadius: "12px", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  <item.icon size={20} className="text-rodeo-lime" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{item.label}</p>
                  <p className="text-xs text-rodeo-cream/50 truncate">{item.desc}</p>
                </div>
                <ArrowRight size={16} className="text-rodeo-cream/30 group-hover:text-rodeo-lime transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
