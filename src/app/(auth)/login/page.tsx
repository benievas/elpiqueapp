"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark overflow-hidden">
      {/* Fondo animado */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-rodeo-lime/5 via-transparent to-rodeo-terracotta/5" />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-rodeo-lime/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-rodeo-terracotta/10 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-2">
            <motion.img
              src="/assets/logo-main.png"
              alt="ElPiqueApp"
              className="h-14 w-auto"
              whileHover={{ scale: 1.05 }}
            />
            <p className="text-rodeo-cream/70 text-sm">
              Reserva canchas deportivas en tu ciudad
            </p>
          </div>

          {/* Card */}
          <motion.div
            className="liquid-panel p-8 space-y-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-red-500/20 border border-red-500/30 rounded-liquid text-red-300 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Google Login Button */}
            <motion.button
              onClick={handleGoogleLogin}
              disabled={loading}
              whileHover={!loading ? { scale: 1.02, y: -2 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className="w-full py-4 rounded-liquid bg-white text-rodeo-dark font-bold
                flex items-center justify-center gap-3 transition-all
                hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continuar con Google
                </>
              )}
            </motion.button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white/2 text-rodeo-cream/50">
                  O continúa con email
                </span>
              </div>
            </div>

            {/* Email Button (Future) */}
            <button
              disabled
              className="w-full py-4 rounded-liquid bg-white/5 border border-white/10 text-rodeo-cream font-bold
                flex items-center justify-center gap-3 transition-all opacity-50 cursor-not-allowed"
            >
              <Mail size={20} />
              Email (Próximamente)
            </button>

            {/* Info */}
            <p className="text-xs text-rodeo-cream/50 text-center">
              Al continuar, aceptas nuestros Términos y Política de Privacidad
            </p>
          </motion.div>

          {/* Guest Link */}
          <div className="text-center">
            <p className="text-sm text-rodeo-cream/60 mb-3">
              ¿Prefieres explorar primero?
            </p>
            <Link
              href="/explorar"
              className="inline-flex items-center gap-2 text-rodeo-lime font-bold hover:gap-3 transition-all"
            >
              Ver canchas
              <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
