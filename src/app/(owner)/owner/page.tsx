"use client";

import Link from "next/link";
import { Building2, BarChart3, Calendar, ClipboardList, Crown, ArrowRight, Wallet } from "lucide-react";

export default function OwnerPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs text-rodeo-cream/50 font-bold tracking-widest uppercase mb-1">Panel de Control</p>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Bienvenido, Propietario</h1>
        <p className="text-sm text-rodeo-cream/60 mt-1">Gestioná tu complejo deportivo desde acá.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Reservas hoy", valor: "—", icon: "📅" },
          { label: "Canchas activas", valor: "—", icon: "⚽" },
          { label: "Ingresos este mes", valor: "—", icon: "💰" },
          { label: "Calificación", valor: "—", icon: "⭐" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
            }}
            className="p-4 flex flex-col gap-2"
          >
            <span className="text-2xl">{stat.icon}</span>
            <p className="text-2xl font-black text-rodeo-lime">{stat.valor}</p>
            <p className="text-xs text-rodeo-cream/50">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div>
        <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40 mb-4">Accesos rápidos</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: Building2, label: "Mi Complejo", desc: "Información y datos del complejo", href: "/complejo" },
            { icon: Wallet, label: "Caja y Cierre", desc: "Registrá ingresos y egresos del día", href: "/owner/caja" },
            { icon: Calendar, label: "Canchas", desc: "Gestión de canchas y horarios", href: "/owner/canchas" },
            { icon: ClipboardList, label: "Reservas", desc: "Ver y gestionar reservas entrantes", href: "/owner/reservas" },
            { icon: BarChart3, label: "Estadísticas", desc: "Rendimiento y métricas del complejo", href: "/owner/stats" },
            { icon: Crown, label: "Suscripción", desc: "Plan activo y facturación", href: "/suscripcion" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "16px",
                }}
                className="p-5 flex items-center gap-4 hover:bg-white/8 transition-all group cursor-pointer"
              >
                <div
                  style={{
                    background: "rgba(200,255,0,0.12)",
                    border: "1px solid rgba(200,255,0,0.25)",
                    borderRadius: "12px",
                    width: 44, height: 44,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
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
