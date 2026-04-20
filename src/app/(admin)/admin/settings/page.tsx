"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Settings, Save, Info, Globe, CreditCard, Clock } from "lucide-react";

// Config puramente informativa + links útiles de gestión externa
const CONFIG_ITEMS = [
  {
    section: "Supabase",
    icon: Globe,
    items: [
      { label: "URL del proyecto", value: "https://aracmkttghzxdnujxuca.supabase.co", type: "text", readonly: true },
      { label: "Panel Supabase", value: "https://app.supabase.com", type: "link" },
    ],
  },
  {
    section: "Autenticación",
    icon: Settings,
    items: [
      { label: "Google OAuth — Site URL (prod)", value: "https://elpiqueapp.com", type: "text", readonly: true, note: "Configurar en Supabase → Auth → URL Configuration" },
      { label: "Google OAuth — Redirect URL", value: "https://elpiqueapp.com/auth/callback", type: "text", readonly: true },
    ],
  },
  {
    section: "Suscripciones",
    icon: CreditCard,
    items: [
      { label: "Duración trial (días)", value: "14", type: "editable", key: "trial_days" },
      { label: "Precio mensual (ARS)", value: "15000", type: "editable", key: "precio_mensual" },
      { label: "Precio anual (ARS)", value: "150000", type: "editable", key: "precio_anual" },
    ],
  },
  {
    section: "Deploy",
    icon: Globe,
    items: [
      { label: "Vercel dashboard", value: "https://vercel.com/dashboard", type: "link" },
      { label: "Dominio productivo", value: "https://elpiqueapp.com", type: "link" },
      { label: "Repositorio", value: "GitHub — rama main → deploy automático", type: "text", readonly: true },
    ],
  },
];

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({
    trial_days: "14", precio_mensual: "15000", precio_anual: "150000",
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    // En el futuro: persistir en tabla config de Supabase
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#E1D4C2", outline: "none" } as React.CSSProperties;

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
          Las configuraciones editables se guardan localmente por ahora. Para persistir en DB, se necesita una tabla <code className="text-rodeo-lime">config</code> en Supabase.
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
                ) : item.type === "editable" ? (
                  <input value={values[item.key] ?? item.value}
                    onChange={e => setValues(v => ({ ...v, [item.key]: e.target.value }))}
                    style={inputStyle} className="w-full px-3 py-2.5 text-sm" />
                ) : (
                  <div>
                    <p className="text-sm text-rodeo-cream/60 font-mono">{item.value}</p>
                    {item.note && <p className="text-[11px] text-rodeo-cream/30 mt-1">{item.note}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      <button onClick={handleSave}
        style={{ background: saved ? "rgba(74,222,128,0.2)" : "rgba(200,255,0,0.9)", borderRadius: "12px", border: saved ? "1px solid rgba(74,222,128,0.4)" : "none" }}
        className="flex items-center gap-2 px-6 py-3 text-sm font-black text-rodeo-dark hover:bg-rodeo-lime transition-all">
        {saved ? <><span className="text-green-400">✓</span> <span className="text-green-300">Guardado</span></> : <><Save size={15} /> Guardar cambios</>}
      </button>

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
