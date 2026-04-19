"use client";
export const dynamic = 'force-dynamic';

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Mail, Lock, Eye, EyeOff, User, Phone,
  ArrowRight, ArrowLeft, Loader, CheckCircle2, Rocket, ChevronLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Step = 1 | 2 | 3;

function RegistroDuenoForm() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — cuenta
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 — datos personales
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");

  // Step 3 — nombre del complejo (guardado para después)
  const [nombreComplejo, setNombreComplejo] = useState("");

  const STEPS = [
    { n: 1, label: "Cuenta" },
    { n: 2, label: "Tus datos" },
    { n: 3, label: "Tu complejo" },
  ];

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    setError(null);
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError("Ingresá tu nombre completo."); return; }
    setError(null);
    setStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Crear cuenta en Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { nombre_completo: nombre.trim(), rol: 'propietario' } },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("Ese email ya está registrado. ¿Querés iniciar sesión?");
        } else {
          setError(signUpError.message);
        }
        setStep(1);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) throw new Error("No se pudo obtener el usuario");

      // 2. Crear perfil con rol=propietario via API (service role)
      const res = await fetch("/api/auth/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email: email.trim().toLowerCase(),
          nombre_completo: nombre.trim(),
          telefono: telefono.trim() || null,
          ciudad: "Catamarca",
          rol: "propietario",
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Error al crear el perfil");
      }

      // 3. Si necesita confirmar email
      if (authData.session === null) {
        router.push("/registro/dueno/confirmar?email=" + encodeURIComponent(email));
        return;
      }

      // 4. Tiene sesión → activar trial
      router.push("/owner/activar-trial");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark flex items-center justify-center px-6 py-10">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-32 -right-32 w-96 h-96 bg-rodeo-lime/8 rounded-full blur-3xl" />
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 10, repeat: Infinity, delay: 3 }}
          className="absolute -bottom-32 -left-32 w-96 h-96 bg-rodeo-terracotta/8 rounded-full blur-3xl" />
      </div>

      {/* Botón volver */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/login" className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-white/8 border border-white/10 text-rodeo-cream/70 hover:text-rodeo-cream hover:bg-white/12 transition-all text-sm">
          <ChevronLeft size={16} /> Volver
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rodeo-lime/10 border border-rodeo-lime/25 text-rodeo-lime text-sm font-black mb-1">
            <Building2 size={15} /> REGISTRO DE DUEÑO
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "38px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }} className="text-white">Sumá tu complejo</h1>
          <p className="text-rodeo-cream/50 text-sm">30 días gratis, sin tarjeta de crédito</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                step === s.n ? "bg-rodeo-lime text-rodeo-dark" :
                step > s.n ? "bg-rodeo-lime/20 text-rodeo-lime" : "bg-white/8 text-rodeo-cream/40"
              }`}>
                {step > s.n ? <CheckCircle2 size={12} /> : <span>{s.n}</span>}
                {s.label}
              </div>
              {i < STEPS.length - 1 && <div className={`w-6 h-px ${step > s.n ? "bg-rodeo-lime/40" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="liquid-panel p-7 space-y-5">
          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-red-500/20 border border-red-500/30 rounded-[12px] text-red-300 text-sm">{error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* STEP 1: Cuenta */}
            {step === 1 && (
              <motion.form key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleStep1} className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-rodeo-cream/50 uppercase tracking-widest mb-4">Creá tu cuenta</p>
                  <div className="space-y-3">
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/35" />
                      <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                        className="w-full pl-10 pr-4 py-3 rounded-[12px] bg-white/8 border border-white/10 text-rodeo-cream placeholder:text-rodeo-cream/25 text-sm focus:outline-none focus:border-rodeo-lime/50 transition-all" />
                    </div>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/35" />
                      <input type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password"
                        className="w-full pl-10 pr-10 py-3 rounded-[12px] bg-white/8 border border-white/10 text-rodeo-cream placeholder:text-rodeo-cream/25 text-sm focus:outline-none focus:border-rodeo-lime/50 transition-all" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/35 hover:text-rodeo-cream/60 transition-colors">
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
                <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-[14px] bg-rodeo-lime text-rodeo-dark font-black text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all">
                  Continuar <ArrowRight size={16} />
                </motion.button>
              </motion.form>
            )}

            {/* STEP 2: Datos personales */}
            {step === 2 && (
              <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleStep2} className="space-y-4">
                <p className="text-xs font-bold text-rodeo-cream/50 uppercase tracking-widest">Tus datos de contacto</p>
                <div className="space-y-3">
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/35" />
                    <input type="text" placeholder="Tu nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} required
                      className="w-full pl-10 pr-4 py-3 rounded-[12px] bg-white/8 border border-white/10 text-rodeo-cream placeholder:text-rodeo-cream/25 text-sm focus:outline-none focus:border-rodeo-lime/50 transition-all" />
                  </div>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/35" />
                    <input type="tel" placeholder="Teléfono (opcional)" value={telefono} onChange={e => setTelefono(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-[12px] bg-white/8 border border-white/10 text-rodeo-cream placeholder:text-rodeo-cream/25 text-sm focus:outline-none focus:border-rodeo-lime/50 transition-all" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-[12px] bg-white/6 border border-white/10 text-rodeo-cream/60 text-sm font-bold hover:bg-white/10 transition-all">
                    <ArrowLeft size={15} />
                  </button>
                  <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3.5 rounded-[14px] bg-rodeo-lime text-rodeo-dark font-black text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all">
                    Continuar <ArrowRight size={16} />
                  </motion.button>
                </div>
              </motion.form>
            )}

            {/* STEP 3: Nombre del complejo */}
            {step === 3 && (
              <motion.form key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleFinalSubmit} className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-rodeo-cream/50 uppercase tracking-widest mb-1">Nombre de tu complejo</p>
                  <p className="text-xs text-rodeo-cream/40 mb-4">Podés completar el resto de los datos del complejo después desde el panel.</p>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/35" />
                    <input type="text" placeholder="Ej: Sportivo Central" value={nombreComplejo} onChange={e => setNombreComplejo(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-[12px] bg-white/8 border border-white/10 text-rodeo-cream placeholder:text-rodeo-cream/25 text-sm focus:outline-none focus:border-rodeo-lime/50 transition-all" />
                  </div>
                  <p className="text-[11px] text-rodeo-cream/30 mt-2">* Opcional. Podés dejarlo vacío y completarlo después.</p>
                </div>

                <div className="px-3 py-3 rounded-[12px] bg-rodeo-lime/6 border border-rodeo-lime/15 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Rocket size={13} className="text-rodeo-lime" />
                    <span className="text-xs font-bold text-rodeo-lime">Lo que obtenés al registrarte</span>
                  </div>
                  {["30 días gratis sin tarjeta", "Panel de gestión completo", "Soporte durante la prueba"].map(item => (
                    <div key={item} className="flex items-center gap-2 ml-5">
                      <CheckCircle2 size={11} className="text-rodeo-lime/60" />
                      <span className="text-[11px] text-rodeo-cream/60">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-[12px] bg-white/6 border border-white/10 text-rodeo-cream/60 text-sm font-bold hover:bg-white/10 transition-all">
                    <ArrowLeft size={15} />
                  </button>
                  <motion.button type="submit" disabled={loading} whileHover={!loading ? { scale: 1.02 } : {}} whileTap={!loading ? { scale: 0.98 } : {}}
                    className="flex-1 py-3.5 rounded-[14px] bg-rodeo-lime text-rodeo-dark font-black text-sm flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    {loading ? <Loader size={18} className="animate-spin" /> : <><Rocket size={16} /> Crear cuenta</>}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-xs text-rodeo-cream/35 text-center">
            Al registrarte aceptás los{" "}
            <Link href="/terminos" className="underline hover:text-rodeo-cream/60">Términos</Link>{" "}y{" "}
            <Link href="/privacidad" className="underline hover:text-rodeo-cream/60">Privacidad</Link>
          </p>
        </div>

        <div className="text-center text-sm text-rodeo-cream/50">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-rodeo-lime font-bold hover:underline">Iniciá sesión</Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegistroDuenoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-rodeo-dark flex items-center justify-center"><Loader size={28} className="animate-spin text-rodeo-lime" /></div>}>
      <RegistroDuenoForm />
    </Suspense>
  );
}
