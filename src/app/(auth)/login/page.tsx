"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader, User } from "lucide-react";
import { supabase, supabaseMut } from "@/lib/supabase";

type Mode = "signin" | "signup";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mostrar error de callback si viene en la URL
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError(null);

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (signInError) {
        setError(signInError.message);
        setGoogleLoading(false);
      }
      // Si no hay error, el browser redirige a Google → no resetear loading
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
      setGoogleLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          setError("Email o contraseña incorrectos.");
        } else if (signInError.message.includes("Email not confirmed")) {
          setError("Confirmá tu email antes de ingresar. Revisá tu bandeja de entrada.");
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (data.user) {
        // Redirigir según rol
        const { data: profile } = await supabaseMut
          .from("profiles")
          .select("rol")
          .eq("id", data.user.id)
          .single();

        if (profile?.rol === "propietario") {
          router.push("/mi-negocio");
        } else if (profile?.rol === "admin" || profile?.rol === "superadmin") {
          router.push("/admin");
        } else {
          router.push("/explorar");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !nombre) return;

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            nombre_completo: nombre.trim(),
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("Ese email ya está registrado. ¿Querés iniciar sesión?");
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (data.user && !data.session) {
        // Necesita confirmar email
        setSuccess(
          "¡Cuenta creada! Te enviamos un email de confirmación. Revisá tu bandeja de entrada."
        );
      } else if (data.session) {
        // Login automático (email confirm desactivado)
        router.push("/explorar");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark overflow-hidden">
      {/* Fondo animado */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-rodeo-lime/5 via-transparent to-rodeo-terracotta/5" />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-rodeo-lime/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-rodeo-terracotta/10 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <motion.img
              src="/assets/elpique.png"
              alt="ElPiqueApp"
              className="h-16 w-auto"
              whileHover={{ scale: 1.05 }}
            />
            <p className="text-rodeo-cream/70 text-sm">
              Reserva canchas deportivas en tu ciudad
            </p>
          </div>

          {/* Card */}
          <motion.div
            className="liquid-panel p-6 space-y-5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Tabs */}
            <div className="flex bg-white/5 rounded-[14px] p-1 gap-1">
              {(["signin", "signup"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-2.5 rounded-[10px] text-sm font-bold transition-all ${
                    mode === m
                      ? "bg-rodeo-lime text-rodeo-dark shadow"
                      : "text-rodeo-cream/60 hover:text-rodeo-cream"
                  }`}
                >
                  {m === "signin" ? "Iniciar sesión" : "Registrarse"}
                </button>
              ))}
            </div>

            {/* Error / Success */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-red-500/20 border border-red-500/30 rounded-[12px] text-red-300 text-sm"
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-green-500/20 border border-green-500/30 rounded-[12px] text-green-300 text-sm"
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google */}
            <motion.button
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              whileHover={!googleLoading ? { scale: 1.02, y: -1 } : {}}
              whileTap={!googleLoading ? { scale: 0.98 } : {}}
              className="w-full py-3.5 rounded-[14px] bg-white text-rodeo-dark font-bold
                flex items-center justify-center gap-3 transition-all
                hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {googleLoading ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar con Google
                </>
              )}
            </motion.button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-transparent text-rodeo-cream/40">o con email</span>
              </div>
            </div>

            {/* Form */}
            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: mode === "signup" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "signup" ? -20 : 20 }}
                transition={{ duration: 0.25 }}
                onSubmit={mode === "signin" ? handleEmailSignIn : handleEmailSignUp}
                className="space-y-3"
              >
                {/* Nombre (solo registro) */}
                {mode === "signup" && (
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/40" />
                    <input
                      type="text"
                      placeholder="Tu nombre completo"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-[12px] bg-white/8 border border-white/10
                        text-rodeo-cream placeholder:text-rodeo-cream/30 text-sm
                        focus:outline-none focus:border-rodeo-lime/50 focus:bg-white/12 transition-all"
                    />
                  </div>
                )}

                {/* Email */}
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/40" />
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 rounded-[12px] bg-white/8 border border-white/10
                      text-rodeo-cream placeholder:text-rodeo-cream/30 text-sm
                      focus:outline-none focus:border-rodeo-lime/50 focus:bg-white/12 transition-all"
                  />
                </div>

                {/* Contraseña */}
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/40" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "Contraseña"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    className="w-full pl-10 pr-10 py-3 rounded-[12px] bg-white/8 border border-white/10
                      text-rodeo-cream placeholder:text-rodeo-cream/30 text-sm
                      focus:outline-none focus:border-rodeo-lime/50 focus:bg-white/12 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rodeo-cream/40 hover:text-rodeo-cream/70 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Olvidé contraseña */}
                {mode === "signin" && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => router.push("/login/reset")}
                      className="text-xs text-rodeo-cream/50 hover:text-rodeo-lime transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                )}

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading || googleLoading}
                  whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  className="w-full py-3.5 rounded-[14px] font-bold text-sm transition-all
                    bg-rodeo-lime text-rodeo-dark hover:brightness-110
                    flex items-center justify-center gap-2
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader size={18} className="animate-spin" />
                  ) : mode === "signin" ? (
                    "Ingresar"
                  ) : (
                    "Crear cuenta"
                  )}
                </motion.button>
              </motion.form>
            </AnimatePresence>

            {/* Info términos */}
            <p className="text-xs text-rodeo-cream/40 text-center">
              Al continuar aceptás nuestros{" "}
              <Link href="/terminos" className="underline hover:text-rodeo-cream transition-colors">
                Términos
              </Link>{" "}
              y{" "}
              <Link href="/privacidad" className="underline hover:text-rodeo-cream transition-colors">
                Privacidad
              </Link>
            </p>
          </motion.div>

          {/* Nota dueños */}
          <div
            className="text-center px-4 py-3 rounded-[16px]"
            style={{ background: "rgba(200,255,0,0.05)", border: "1px solid rgba(200,255,0,0.15)" }}
          >
            <p className="text-xs text-rodeo-cream/60">
              <span className="text-rodeo-lime font-bold">¿Sos dueño de un complejo?</span>{" "}
              Usá el mismo email con el que te registraste y accedés automáticamente a tu panel.
            </p>
          </div>

          {/* Guest Link */}
          <div className="text-center">
            <p className="text-sm text-rodeo-cream/50 mb-2">¿Preferís explorar primero?</p>
            <Link
              href="/explorar"
              className="inline-flex items-center gap-2 text-rodeo-lime font-bold hover:gap-3 transition-all text-sm"
            >
              Ver canchas
              <ArrowRight size={15} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-rodeo-dark flex items-center justify-center">
        <Loader size={32} className="animate-spin text-rodeo-lime" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
