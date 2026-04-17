"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Loader, Bell, Shield, Globe, Mail, Lock, Check, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase, supabaseMut } from "@/lib/supabase";

export default function OwnerSettingsPage() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [telefono, setTelefono] = useState(profile?.telefono || "");
  const [nombre, setNombre] = useState(profile?.nombre_completo || "");

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Password reset
  const [passLoading, setPassLoading] = useState(false);
  const [passSent, setPassSent] = useState(false);

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);
    setSuccess(false);
    await supabaseMut
      .from("profiles")
      .update({ telefono, nombre_completo: nombre })
      .eq("id", user.id);
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleEmailChange = async () => {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      setEmailMsg({ type: "err", text: "Ingresá un email válido." });
      return;
    }
    setEmailLoading(true);
    setEmailMsg(null);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailLoading(false);
    if (error) {
      setEmailMsg({ type: "err", text: error.message });
    } else {
      setEmailMsg({ type: "ok", text: "Te enviamos un mail de confirmación al nuevo email." });
      setNewEmail("");
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setPassLoading(true);
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/owner/settings`,
    });
    setPassLoading(false);
    setPassSent(true);
    setTimeout(() => setPassSent(false), 6000);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <p className="text-xs text-rodeo-cream/50 font-bold tracking-widest uppercase mb-1">Ajustes</p>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Configuración</h1>
      </div>

      {/* Perfil */}
      <div className="liquid-panel p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={18} className="text-rodeo-lime" />
          <h2 className="text-base font-bold text-white">Datos de la cuenta</h2>
        </div>

        <div>
          <label className="text-xs text-rodeo-cream/50 font-bold uppercase tracking-widest block mb-1.5">Nombre completo</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full px-4 py-3 rounded-[12px] bg-white/8 border border-white/10
              text-rodeo-cream text-sm focus:outline-none focus:border-rodeo-lime/50 transition-all"
          />
        </div>
        <div>
          <label className="text-xs text-rodeo-cream/50 font-bold uppercase tracking-widest block mb-1.5">Email actual</label>
          <input
            type="text"
            value={user?.email || ""}
            disabled
            className="w-full px-4 py-3 rounded-[12px] bg-white/4 border border-white/5 text-rodeo-cream/40 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-rodeo-cream/50 font-bold uppercase tracking-widest block mb-1.5">Teléfono</label>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+54 383 ..."
            className="w-full px-4 py-3 rounded-[12px] bg-white/8 border border-white/10
              text-rodeo-cream text-sm focus:outline-none focus:border-rodeo-lime/50 transition-all"
          />
        </div>

        <motion.button
          onClick={handleSave}
          disabled={loading}
          whileHover={!loading ? { scale: 1.02 } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
          className="flex items-center gap-2 px-6 py-3 rounded-[12px] bg-rodeo-lime text-rodeo-dark font-bold text-sm
            disabled:opacity-50 transition-all"
        >
          {loading ? <Loader size={16} className="animate-spin" /> : success ? <Check size={16} /> : <Save size={16} />}
          {success ? "¡Guardado!" : "Guardar cambios"}
        </motion.button>
      </div>

      {/* Cambiar email */}
      <div className="liquid-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Mail size={18} className="text-rodeo-lime" />
          <h2 className="text-base font-bold text-white">Cambiar email</h2>
        </div>
        <p className="text-xs text-rodeo-cream/50 leading-relaxed">
          Te enviaremos un link de confirmación al nuevo email antes de actualizar la cuenta.
        </p>
        <div className="flex gap-3">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="nuevo@email.com"
            className="flex-1 px-4 py-3 rounded-[12px] bg-white/8 border border-white/10
              text-rodeo-cream text-sm focus:outline-none focus:border-rodeo-lime/50 transition-all"
          />
          <button
            onClick={handleEmailChange}
            disabled={emailLoading || !newEmail}
            className="px-5 py-3 rounded-[12px] font-bold text-sm flex items-center gap-2 disabled:opacity-40 transition-all"
            style={{ background: "rgba(200,255,0,0.9)", color: "#1A120B" }}
          >
            {emailLoading ? <Loader size={14} className="animate-spin" /> : <Mail size={14} />}
            Actualizar
          </button>
        </div>
        <AnimatePresence>
          {emailMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-[10px] text-sm"
              style={{
                background: emailMsg.type === "ok" ? "rgba(200,255,0,0.1)" : "rgba(239,68,68,0.12)",
                border: `1px solid ${emailMsg.type === "ok" ? "rgba(200,255,0,0.25)" : "rgba(239,68,68,0.3)"}`,
                color: emailMsg.type === "ok" ? "#C8FF00" : "#EF4444",
              }}
            >
              {emailMsg.type === "ok" ? <Check size={14} /> : <AlertTriangle size={14} />}
              {emailMsg.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cambiar contraseña */}
      <div className="liquid-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Lock size={18} className="text-rodeo-lime" />
          <h2 className="text-base font-bold text-white">Contraseña</h2>
        </div>
        <p className="text-xs text-rodeo-cream/50 leading-relaxed">
          Te enviaremos un link a <span className="text-rodeo-cream/80 font-bold">{user?.email}</span> para que puedas crear una nueva contraseña.
        </p>
        <button
          onClick={handlePasswordReset}
          disabled={passLoading || passSent}
          className="flex items-center gap-2 px-5 py-3 rounded-[12px] font-bold text-sm disabled:opacity-50 transition-all"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
        >
          {passLoading ? <Loader size={14} className="animate-spin" /> : passSent ? <Check size={14} className="text-rodeo-lime" /> : <Lock size={14} />}
          {passSent ? "¡Email enviado! Revisá tu bandeja" : "Restablecer contraseña"}
        </button>
      </div>

      {/* Notificaciones (futuro) */}
      <div className="liquid-panel p-6 opacity-50">
        <div className="flex items-center gap-3 mb-2">
          <Bell size={18} className="text-rodeo-cream/40" />
          <h2 className="text-base font-bold text-rodeo-cream/50">Notificaciones</h2>
          <span className="text-xs bg-white/10 text-rodeo-cream/40 px-2 py-0.5 rounded-full">Próximamente</span>
        </div>
        <p className="text-sm text-rodeo-cream/30">Configurá alertas de nuevas reservas, vencimientos y más.</p>
      </div>

      {/* Dominio/Link (futuro) */}
      <div className="liquid-panel p-6 opacity-50">
        <div className="flex items-center gap-3 mb-2">
          <Globe size={18} className="text-rodeo-cream/40" />
          <h2 className="text-base font-bold text-rodeo-cream/50">Link público personalizado</h2>
          <span className="text-xs bg-white/10 text-rodeo-cream/40 px-2 py-0.5 rounded-full">Próximamente</span>
        </div>
        <p className="text-sm text-rodeo-cream/30">Personalizá la URL de tu complejo.</p>
      </div>
    </div>
  );
}
