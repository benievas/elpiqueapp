"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setError(null);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/login/update-password`,
        }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark overflow-hidden flex items-center justify-center px-6">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-rodeo-lime/5 via-transparent to-rodeo-terracotta/5" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md space-y-6"
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-rodeo-cream/60 hover:text-rodeo-cream transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Volver
        </button>

        <div className="liquid-panel p-8 space-y-6">
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <CheckCircle size={48} className="text-rodeo-lime mx-auto" />
              <h2 className="text-xl font-bold text-rodeo-cream">Email enviado</h2>
              <p className="text-rodeo-cream/60 text-sm">
                Revisá tu bandeja de entrada y seguí el link para restablecer tu contraseña.
              </p>
              <Link
                href="/login"
                className="inline-block mt-2 text-rodeo-lime font-bold text-sm hover:underline"
              >
                Volver al inicio de sesión
              </Link>
            </motion.div>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-bold text-rodeo-cream mb-1">Recuperar contraseña</h2>
                <p className="text-rodeo-cream/50 text-sm">
                  Ingresá tu email y te enviamos un link para crear una nueva contraseña.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-[12px] text-red-300 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.02 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  className="w-full py-3.5 rounded-[14px] font-bold text-sm
                    bg-rodeo-lime text-rodeo-dark hover:brightness-110
                    flex items-center justify-center gap-2
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? <Loader size={18} className="animate-spin" /> : "Enviar link de recuperación"}
                </motion.button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
