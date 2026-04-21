"use client";
export const dynamic = 'force-dynamic';

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Settings, Info, Globe, CreditCard, Clock } from "lucide-react";

// Toda la configuración es informativa: los valores de negocio se
// controlan desde el código o se modifican con SQL directo.
const CONFIG_ITEMS = [
  {
    section: "Supabase",
    icon: Globe,
    items: [
      { label: "URL del proyecto", value: "https://aracmkttghzxdnujxuca.supabase.co", type: "text" },
      { label: "Panel Supabase", value: "https://app.supabase.com", type: "link" },
    ],
  },
  {
    section: "Autenticación",
    icon: Settings,
    items: [
      { label: "Google OAuth — Site URL (prod)", value: "https://elpiqueapp.com", type: "text", note: "Configurar en Supabase → Auth → URL Configuration" },
      { label: "Google OAuth — Redirect URL", value: "https://elpiqueapp.com/auth/callback", type: "text" },
    ],
  },
  {
    section: "Suscripciones",
    icon: CreditCard,
    items: [
      { label: "Duración trial (días)", value: "30", type: "text", note: "Definido en src/lib/hooks/useTrialStatus.ts — TRIAL_DAYS" },
      { label: "Precio mensual (ARS)", value: "Configurado en MercadoPago", type: "text", note: "Variables de entorno MP_*" },
    ],
  },
  {
    section: "Deploy",
    icon: Globe,
    items: [
      { label: "Railway dashboard", value: "https://railway.app", type: "link" },
      { label: "Dominio productivo", value: "https://elpiqueapp.com", type: "link" },
      { label: "Repositorio", value: "GitHub — rama main → deploy automático", type: "text" },
    ],
  },
];

export default function AdminSettingsPage() {

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
          <ChevronLeft size={20} className="text-rodeo-cream/50" />
        </Link>
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40">Admin</p>
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "28px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }} className="text-white"><span className="section-slash">/</span>Configuración</h1>
        </div>
      </div>

      <div style={{ background: "rgba(200,255,0,0.05)", border: "1px solid rgba(200,255,0,0.15)", borderRadius: "14px" }}
        className="flex items-start gap-3 px-4 py-3">
        <Info size={15} className="text-rodeo-lime shrink-0 mt-0.5" />
        <p className="text-xs text-rodeo-cream/60 leading-relaxed">
          Vista informativa. Los valores críticos (trial, precios, OAuth) se modifican en código, variables de entorno o SQL directo.
        </p>
      </div>

      {CONFIG_ITEMS.map((section, si) => (
        <motion.div key={section.section} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.06 }}
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px" }}
          className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <section.icon size={15} className="text-rodeo-lime" />
            <p className="text-xs font-black text-white uppercase tracking-widest">{section.section}</p>
          </div>
          <div className="space-y-4">
            {section.items.map((item: any) => (
              <div key={item.label} className="space-y-1.5">
                <label className="text-[11px] font-bold text-rodeo-cream/40 uppercase tracking-widest">{item.label}</label>
                {item.type === "link" ? (
                  <a href={item.value} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-rodeo-lime hover:underline">
                    <Globe size={13} /> {item.value}
                  </a>
                ) : (
                  <div>
                    <p className="text-sm text-rodeo-cream/60 font-mono break-all">{item.value}</p>
                    {item.note && <p className="text-[11px] text-rodeo-cream/30 mt-1">{item.note}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Acciones rápidas de gestión */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px" }} className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-rodeo-lime" />
          <p className="text-xs font-black text-white uppercase tracking-widest">Acciones de mantenimiento</p>
        </div>
        <p className="text-xs text-rodeo-cream/40">Para ejecutar estas acciones usá el SQL Editor de Supabase:</p>
        <div className="space-y-2">
          {[
            { label: "Vencer trials expirados", sql: "UPDATE subscriptions SET estado='expired' WHERE estado='trial' AND fecha_fin < NOW()::date;" },
            { label: "Ver todos los superadmins", sql: "SELECT email, rol FROM profiles WHERE rol IN ('admin','superadmin');" },
            { label: "Activar complejo manualmente", sql: "UPDATE complexes SET activo=true WHERE slug='<slug>';" },
          ].map((action) => (
            <div key={action.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }} className="p-3 space-y-1">
              <p className="text-xs font-bold text-rodeo-cream/60">{action.label}</p>
              <code className="text-[11px] text-rodeo-lime/70 block break-all">{action.sql}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
