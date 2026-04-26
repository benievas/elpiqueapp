"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Zap, Star, Crown, AlertCircle, Loader, Calendar,
  Building2, Shield, CreditCard, Banknote, Upload, ChevronDown,
  ChevronUp, Info, Clock, Check, X, ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useActiveComplex } from "@/lib/context/ActiveComplexContext";
import { supabase, supabaseMut } from "@/lib/supabase";

// ─── Constantes ───────────────────────────────────────────────────────────────

const TRANSFER_ALIAS = "benievas.mp";
const TRANSFER_BANCO = "Mercado Pago";

const PLANS = {
  monthly: { label: "MENSUAL",  price: 60000,  priceStr: "$60.000/mes",  desc: "Renovación mensual. Cancelá cuando quieras." },
  annual:  { label: "ANUAL",    price: 600000, priceStr: "$600.000/año", desc: "2 meses de regalo. Equivale a $50.000/mes." },
};

const FEATURES = [
  "Panel de gestión completo",
  "Canchas, horarios y disponibilidad en tiempo real",
  "Sistema de reservas online con agenda visual",
  "Caja POS con historial de movimientos y cierre",
  "Publicaciones y promociones con imágenes",
  "Gestión de torneos con bracket automático",
  "Partidos sociales / Armá tu partido",
  "Link público y código QR para compartir",
  "Estadísticas y reportes de ingresos",
  "Soporte prioritario por WhatsApp",
];

const FAQS = [
  {
    q: "¿La licencia es por complejo o por cuenta?",
    a: "Es por complejo. Cada complejo tiene su propia licencia independiente. Si tenés 2 complejos, cada uno requiere su propio plan. Así podés elegir pagar solo los complejos que quieras mantener activos.",
  },
  {
    q: "¿Qué pasa si tengo 2 complejos y quiero mantener solo uno?",
    a: "Podés tener un complejo con licencia activa y el otro pausado (sin pagar). El complejo sin licencia queda inaccesible hasta que actives su plan. Los datos no se borran, quedan guardados.",
  },
  {
    q: "¿El primer mes de prueba aplica a todos mis complejos?",
    a: "El trial de 30 días aplica solo al primer complejo. Los complejos adicionales requieren licencia desde el primer día. Así el primer complejo es tu prueba gratuita del sistema.",
  },
  {
    q: "¿Puedo cambiar de plan mensual a anual después?",
    a: "Sí. En cualquier momento podés cambiar al plan anual y se descuenta el tiempo ya pagado. Contactanos por WhatsApp para hacer el cambio.",
  },
  {
    q: "¿Qué pasa si pago por transferencia?",
    a: "Subís el comprobante acá. Un administrador lo revisa manualmente (máximo 24 horas hábiles) y activa tu licencia. Te avisamos por email cuando queda habilitada.",
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type PayMethod = "mp" | "transfer";
type SubscriptionStatus = { status: "active" | "trial" | "expired" | "none"; endsAt: string | null; isTrial: boolean; daysLeft: number };

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14 }}>
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
        <span className="text-sm font-bold text-white">{q}</span>
        {open ? <ChevronUp size={15} className="text-rodeo-lime shrink-0"/> : <ChevronDown size={15} className="text-rodeo-cream/40 shrink-0"/>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <p className="px-5 pb-4 text-sm text-rodeo-cream/65 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuscripcionPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { activeComplexId, activeComplexName, complexes } = useActiveComplex();

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [payMethod, setPayMethod]       = useState<PayMethod>("mp");
  const [loading, setLoading]           = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loadingSub, setLoadingSub]     = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // Transfer state
  const [compFile, setCompFile]         = useState<File | null>(null);
  const [uploading, setUploading]       = useState(false);
  const [uploadOk, setUploadOk]         = useState(false);
  const [uploadError, setUploadError]   = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("error") === "pago_fallido") setError("El pago no pudo procesarse. Por favor, intentá de nuevo.");
  }, []);

  useEffect(() => {
    if (!user || !activeComplexId) return;
    (async () => {
      setLoadingSub(true);
      try {
        const { data } = await (supabase as any)
          .from("subscriptions")
          .select("status, ends_at, is_trial")
          .eq("plan", "owner")
          .eq("user_id", user.id)
          .in("status", ["active", "trial"])
          .maybeSingle();
        if (data) {
          const endsAt = data.ends_at ? new Date(data.ends_at) : null;
          const daysLeft = endsAt ? Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 86400000)) : 0;
          setSubscription({ status: data.status, endsAt: data.ends_at, isTrial: data.is_trial, daysLeft });
        } else {
          setSubscription({ status: "none", endsAt: null, isTrial: false, daysLeft: 0 });
        }
      } catch { setSubscription({ status: "none", endsAt: null, isTrial: false, daysLeft: 0 }); }
      finally { setLoadingSub(false); }
    })();
  }, [user, activeComplexId]);

  // ── MercadoPago checkout ───────────────────────────────────────────────────

  const handleCheckoutMP = async () => {
    if (!user) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/mp/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, userId: user.id, userEmail: user.email, complexId: activeComplexId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Error al iniciar el pago");
      window.location.href = process.env.NODE_ENV === "production" ? data.initPoint : (data.sandboxInitPoint || data.initPoint);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el pago");
    } finally { setLoading(false); }
  };

  // ── Transferencia: subir comprobante ──────────────────────────────────────

  const handleTransferSubmit = async () => {
    if (!compFile || !user) return;
    setUploading(true); setUploadError(null);
    try {
      const ext = compFile.name.split(".").pop() || "jpg";
      const path = `comprobantes/${user.id}/${Date.now()}.${ext}`;
      const { error: storageErr } = await supabaseMut.storage.from("app-media").upload(path, compFile, { upsert: true });
      if (storageErr) throw storageErr;
      const { data: urlData } = supabaseMut.storage.from("app-media").getPublicUrl(path);

      const { error: dbErr } = await (supabaseMut as any).from("payment_comprobantes").insert({
        user_id: user.id,
        complex_id: activeComplexId || null,
        plan: selectedPlan,
        monto: PLANS[selectedPlan].price,
        comprobante_url: urlData.publicUrl,
        estado: "pendiente",
      });
      if (dbErr) throw dbErr;
      setUploadOk(true);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "No se pudo subir el comprobante");
    } finally { setUploading(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (authLoading || loadingSub) {
    return <div className="flex items-center justify-center h-64"><Loader size={32} className="animate-spin text-rodeo-lime"/></div>;
  }

  const isActive = subscription?.status === "active";
  const isTrial  = subscription?.status === "trial";
  const isNew    = !subscription || subscription.status === "none";
  const complexLabel = activeComplexName || "este complejo";

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rodeo-lime/10 border border-rodeo-lime/20 text-rodeo-lime text-sm font-bold">
          <Crown size={16} /> LICENCIA ELPIQUEAPP
        </div>
        <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "clamp(36px, 6vw, 52px)", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }} className="text-white">
          {isActive ? `Licencia activa — ${complexLabel}` : `Activar licencia — ${complexLabel}`}
        </h1>
        <p className="text-rodeo-cream/55 text-sm max-w-md mx-auto">
          Una licencia por complejo. Gestioná solo los complejos que necesitás, pagando únicamente por ellos.
        </p>
      </motion.div>

      {/* Estado actual */}
      {subscription && subscription.status !== "none" && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          style={{ background: isTrial ? "rgba(255,179,0,0.07)" : "rgba(200,255,0,0.07)", border: `1px solid ${isTrial ? "rgba(255,179,0,0.3)" : "rgba(200,255,0,0.3)"}`, borderRadius: 18 }}
          className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl shrink-0" style={{ background: isTrial ? "rgba(255,179,0,0.15)" : "rgba(200,255,0,0.15)" }}>
            {isTrial ? <Star size={22} className="text-amber-400"/> : <CheckCircle2 size={22} className="text-rodeo-lime"/>}
          </div>
          <div className="flex-1">
            <p className="font-black text-white">{isTrial ? "Período de prueba activo" : "Licencia activa"}</p>
            <p className="text-sm text-rodeo-cream/60 mt-0.5">
              {subscription.daysLeft > 0
                ? `${subscription.daysLeft} días restantes${isTrial ? " de prueba gratuita" : ""}`
                : "Vence hoy"}
              {subscription.endsAt && <span className="ml-2 text-rodeo-cream/35">— {new Date(subscription.endsAt).toLocaleDateString("es-AR")}</span>}
            </p>
          </div>
          {isTrial && <span className="text-[11px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">TRIAL</span>}
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/15 border border-red-500/25 rounded-[14px] text-red-300 text-sm">
          <AlertCircle size={16} className="shrink-0"/> {error}
        </div>
      )}

      {/* ── Info licencia por complejo ────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        style={{ background: "rgba(200,255,0,0.04)", border: "1px solid rgba(200,255,0,0.15)", borderRadius: 18 }}
        className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-rodeo-lime shrink-0"/>
          <p className="text-sm font-black text-rodeo-lime uppercase tracking-widest">Cómo funciona la licencia</p>
        </div>
        <div className="space-y-2">
          {[
            { icon: Building2, text: `Esta licencia aplica exclusivamente a "${complexLabel}". Cada complejo requiere su propio plan.` },
            { icon: Star,      text: "El primer complejo tiene 30 días de prueba gratuita. Los complejos adicionales requieren licencia desde el día 1." },
            { icon: Clock,     text: "Si pausás un complejo (sin licencia), tus datos no se borran. Podés reactivarlo cuando quieras." },
            { icon: Shield,    text: "Podés tener un complejo en plan mensual y otro en plan anual. Son completamente independientes." },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-2.5">
              <Icon size={13} className="text-rodeo-lime/70 mt-0.5 shrink-0"/>
              <p className="text-xs text-rodeo-cream/70 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
        {complexes.length > 1 && (
          <div style={{ background: "rgba(200,255,0,0.06)", border: "1px solid rgba(200,255,0,0.12)", borderRadius: 10 }} className="p-3">
            <p className="text-[11px] font-black text-rodeo-lime mb-1">Tus complejos</p>
            {complexes.map(c => (
              <div key={c.id} className="flex items-center gap-2 py-1">
                <Building2 size={11} className="text-rodeo-cream/40"/>
                <span className="text-xs text-rodeo-cream/70 flex-1">{c.nombre}</span>
                {c.id === activeComplexId && <span className="text-[10px] font-black text-rodeo-lime">← licencia activa acá</span>}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Plan selector ────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid sm:grid-cols-2 gap-4">
        {(["monthly", "annual"] as const).map(plan => {
          const p = PLANS[plan];
          const sel = selectedPlan === plan;
          return (
            <button key={plan} onClick={() => setSelectedPlan(plan)} className="text-left transition-all"
              style={{ background: sel ? "rgba(200,255,0,0.07)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${sel ? "rgba(200,255,0,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: 18, padding: "20px", boxShadow: sel ? "0 0 32px rgba(200,255,0,0.1)" : "none" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {plan === "annual" ? <Crown size={18} className="text-rodeo-lime"/> : <Zap size={18} className="text-white/70"/>}
                  <span className={`text-[11px] font-black uppercase tracking-widest ${plan === "annual" ? "text-rodeo-lime" : "text-rodeo-cream/50"}`}>{p.label}</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${sel ? "border-rodeo-lime bg-rodeo-lime" : "border-white/20"}`}>
                  {sel && <div className="w-2 h-2 rounded-full bg-rodeo-dark"/>}
                </div>
              </div>
              <p className="text-2xl font-black text-white leading-none">
                {plan === "monthly" ? "$60.000" : "$600.000"}
                <span className="text-sm font-normal text-rodeo-cream/45">{plan === "monthly" ? "/mes" : "/año"}</span>
              </p>
              {plan === "annual" && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-rodeo-lime">2 meses de regalo</span>
                  <span className="text-[11px] text-rodeo-cream/35 line-through">$720.000</span>
                </div>
              )}
              <p className="text-xs text-rodeo-cream/45 mt-1.5">{p.desc}</p>
              {plan === "annual" && (
                <span className="inline-block mt-2 text-[10px] font-black bg-rodeo-lime text-rodeo-dark px-2 py-0.5 rounded-full">MEJOR VALOR</span>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* ── Método de pago ───────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
        <p className="text-xs font-black text-rodeo-cream/50 uppercase tracking-widest">Método de pago</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {([
            { id: "mp", icon: CreditCard, label: "MercadoPago", sub: "Tarjeta, débito o saldo MP" },
            { id: "transfer", icon: Banknote, label: "Transferencia bancaria", sub: "Habilitación manual en 24 hs" },
          ] as const).map(({ id, icon: Icon, label, sub }) => (
            <button key={id} onClick={() => setPayMethod(id)}
              className="flex items-center gap-3 p-4 text-left transition-all"
              style={{ background: payMethod === id ? "rgba(200,255,0,0.06)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${payMethod === id ? "rgba(200,255,0,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 14 }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: payMethod === id ? "rgba(200,255,0,0.15)" : "rgba(255,255,255,0.06)" }}>
                <Icon size={18} className={payMethod === id ? "text-rodeo-lime" : "text-rodeo-cream/40"}/>
              </div>
              <div>
                <p className={`text-sm font-bold ${payMethod === id ? "text-white" : "text-rodeo-cream/60"}`}>{label}</p>
                <p className="text-[11px] text-rodeo-cream/40">{sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* MercadoPago CTA */}
        {payMethod === "mp" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <button onClick={handleCheckoutMP} disabled={loading}
              className="w-full py-4 rounded-[16px] font-black text-base flex items-center justify-center gap-3 transition-all disabled:opacity-50"
              style={{ background: "rgba(200,255,0,0.95)", color: "#1A120B", boxShadow: "0 6px 28px rgba(200,255,0,0.35)" }}>
              {loading ? <><Loader size={20} className="animate-spin"/> Procesando...</> : <><Zap size={20}/>
                {isActive ? "Renovar licencia" : isTrial ? "Activar licencia completa" : "Comenzar con 1 mes gratis"}
                {" — "}{PLANS[selectedPlan].priceStr}</>}
            </button>
            <p className="text-center text-[11px] text-rodeo-cream/35">
              Pago seguro procesado por MercadoPago · SSL encriptado
            </p>
          </motion.div>
        )}

        {/* Transferencia bancaria */}
        {payMethod === "transfer" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18 }}
            className="p-6 space-y-5">

            {/* Aviso proceso manual */}
            <div style={{ background: "rgba(255,179,0,0.08)", border: "1px solid rgba(255,179,0,0.25)", borderRadius: 12 }} className="flex items-start gap-3 p-4">
              <Clock size={15} className="text-amber-400 shrink-0 mt-0.5"/>
              <div>
                <p className="text-sm font-bold text-amber-300">Habilitación manual — hasta 24 hs hábiles</p>
                <p className="text-xs text-rodeo-cream/60 mt-1 leading-relaxed">
                  Una vez que transferís y subís el comprobante, un administrador verifica el pago
                  y activa tu licencia manualmente. Te notificamos por email cuando queda habilitada.
                  Los fines de semana y feriados pueden demorar hasta el siguiente día hábil.
                </p>
              </div>
            </div>

            {/* Datos de transferencia */}
            <div className="space-y-3">
              <p className="text-xs font-black text-rodeo-cream/50 uppercase tracking-widest">Datos para transferir</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: "Titular", value: "Brandon Ezequiel Hernan Nievas" },
                  { label: "CUIL", value: "20-39758527-2" },
                  { label: "Alias MP", value: TRANSFER_ALIAS },
                  { label: "Banco / Billetera", value: TRANSFER_BANCO },
                  { label: "Monto", value: PLANS[selectedPlan].priceStr },
                  { label: "Concepto / Referencia", value: `Licencia ${activeComplexName || "complejo"}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10 }} className="p-3">
                    <p className="text-[10px] font-bold text-rodeo-cream/40 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-sm font-black text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Instrucciones paso a paso */}
            <div className="space-y-2">
              <p className="text-xs font-black text-rodeo-cream/50 uppercase tracking-widest">Pasos</p>
              {[
                `Transferí ${PLANS[selectedPlan].priceStr} al alias ${TRANSFER_ALIAS} (${TRANSFER_BANCO}).`,
                "Tomá captura de pantalla o descargá el comprobante de la transferencia.",
                "Subí el comprobante acá abajo.",
                "Esperá la confirmación por email (máx. 24 hs hábiles).",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black text-rodeo-dark mt-0.5"
                    style={{ background: "rgba(200,255,0,0.9)" }}>{i + 1}</span>
                  <p className="text-xs text-rodeo-cream/70 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>

            {/* Upload comprobante */}
            {!uploadOk ? (
              <div className="space-y-3">
                <p className="text-xs font-black text-rodeo-cream/50 uppercase tracking-widest">Subir comprobante</p>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="cursor-pointer flex flex-col items-center gap-3 py-8 transition-all"
                  style={{ background: compFile ? "rgba(200,255,0,0.05)" : "rgba(255,255,255,0.02)", border: `2px dashed ${compFile ? "rgba(200,255,0,0.4)" : "rgba(255,255,255,0.12)"}`, borderRadius: 14 }}>
                  {compFile
                    ? <><Check size={28} className="text-rodeo-lime"/><p className="text-sm font-bold text-rodeo-lime">{compFile.name}</p><p className="text-xs text-rodeo-cream/40">Click para cambiar</p></>
                    : <><Upload size={28} className="text-rodeo-cream/30"/><p className="text-sm font-bold text-rodeo-cream/60">Seleccionar comprobante</p><p className="text-xs text-rodeo-cream/35">JPG, PNG o PDF — máx. 10MB</p></>
                  }
                  <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
                    onChange={e => setCompFile(e.target.files?.[0] || null)}/>
                </div>

                {uploadError && <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertCircle size={13}/>{uploadError}</p>}

                <button onClick={handleTransferSubmit} disabled={!compFile || uploading}
                  className="w-full py-3.5 rounded-[14px] font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                  style={{ background: compFile ? "rgba(200,255,0,0.9)" : "rgba(255,255,255,0.08)", color: compFile ? "#1A120B" : "rgba(225,212,194,0.4)" }}>
                  {uploading ? <><Loader size={16} className="animate-spin"/> Subiendo...</> : <><Upload size={16}/> Enviar comprobante</>}
                </button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                style={{ background: "rgba(200,255,0,0.06)", border: "1px solid rgba(200,255,0,0.3)", borderRadius: 16 }}
                className="p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-rodeo-lime/20 flex items-center justify-center shrink-0">
                    <Check size={24} className="text-rodeo-lime"/>
                  </div>
                  <div>
                    <p className="font-black text-white text-base">¡Comprobante enviado con éxito!</p>
                    <p className="text-sm text-rodeo-cream/60 mt-0.5">Tu solicitud fue recibida y está en revisión.</p>
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
                  className="p-4 space-y-2">
                  {[
                    { icon: Clock, text: "Estamos verificando tu pago. Puede demorar hasta 24 hs hábiles." },
                    { icon: Shield, text: "Una vez confirmado, activamos tu licencia de forma inmediata." },
                    { icon: Info, text: "Te notificaremos por email cuando tu acceso quede habilitado." },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-start gap-3">
                      <Icon size={13} className="text-rodeo-lime/70 mt-0.5 shrink-0"/>
                      <p className="text-xs text-rodeo-cream/60 leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-rodeo-cream/35 text-center">
                  ¿Dudas? Contactanos por WhatsApp y te respondemos en el acto.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* ── Funciones incluidas ───────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18 }}
        className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-rodeo-lime"/>
          <p className="font-black text-white text-sm uppercase tracking-wide">Todo incluido en la licencia</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {FEATURES.map(f => (
            <div key={f} className="flex items-center gap-2.5 text-sm text-rodeo-cream/75">
              <CheckCircle2 size={14} className="text-rodeo-lime shrink-0"/> {f}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-3">
        <p className="text-xs font-black text-rodeo-cream/50 uppercase tracking-widest">Preguntas frecuentes</p>
        {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a}/>)}
      </motion.div>

      {/* Trial note */}
      {isNew && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex items-start gap-3 px-4 py-3 rounded-[14px]"
          style={{ background: "rgba(200,255,0,0.04)", border: "1px solid rgba(200,255,0,0.15)" }}>
          <Star size={16} className="text-rodeo-lime mt-0.5 shrink-0"/>
          <p className="text-sm text-rodeo-cream/65">
            <span className="text-white font-bold">30 días de prueba gratuita</span> para el primer complejo. Sin tarjeta. Sin compromiso.
          </p>
        </motion.div>
      )}
    </div>
  );
}
