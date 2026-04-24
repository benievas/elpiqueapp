"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type DeviceOS = "android" | "ios" | null;

function detectOS(): DeviceOS {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return null;
}

export default function DeviceDetection() {
  const [os, setOS] = useState<DeviceOS>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSSheet, setShowIOSSheet] = useState(false);

  useEffect(() => {
    setOS(detectOS());
  }, []);

  if (!os || dismissed) return null;

  // Android: pill glassmorphism flotante en la parte inferior
  if (os === "android") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 1.5 }}
          className="fixed bottom-24 left-4 right-4 z-50 md:hidden"
        >
          <div
            style={{
              background: "linear-gradient(135deg, rgba(200,255,0,0.12) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 100%)",
              backdropFilter: "blur(40px) saturate(200%)",
              WebkitBackdropFilter: "blur(40px) saturate(200%)",
              border: "1px solid rgba(200,255,0,0.25)",
              borderTopColor: "rgba(255,255,255,0.3)",
              borderRadius: "24px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 0.5px rgba(200,255,0,0.1)",
            }}
            className="flex items-center gap-4 px-5 py-4"
          >
            {/* Ícono de la app */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(200,255,0,0.3), rgba(200,255,0,0.1))",
                border: "1px solid rgba(200,255,0,0.3)",
                borderRadius: "14px",
                boxShadow: "0 2px 8px rgba(200,255,0,0.2)",
              }}
              className="w-12 h-12 flex items-center justify-center shrink-0"
            >
              <span className="text-2xl">⚽</span>
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">ElPiqueApp</p>
              <p className="text-white/50 text-xs mt-0.5">Mejor experiencia en la app nativa</p>
            </div>

            {/* Botones */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                style={{
                  background: "rgba(200,255,0,0.12)",
                  border: "1px solid rgba(200,255,0,0.25)",
                  borderRadius: "12px",
                  color: "#C8FF00",
                }}
                className="px-4 py-2 text-xs font-black"
              >
                Próximamente
              </span>
              <button
                onClick={() => setDismissed(true)}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "10px",
                }}
                className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
                aria-label="Cerrar"
              >
                <span className="text-xs font-bold">✕</span>
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // iOS: banner pill + sheet desde abajo
  return (
    <>
      {/* Pill flotante */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 1.5 }}
          className="fixed bottom-24 left-4 right-4 z-50 md:hidden"
        >
          <div
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%)",
              backdropFilter: "blur(40px) saturate(200%)",
              WebkitBackdropFilter: "blur(40px) saturate(200%)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderTopColor: "rgba(255,255,255,0.35)",
              borderRadius: "24px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
            className="flex items-center gap-4 px-5 py-4"
          >
            <div
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "14px",
              }}
              className="w-12 h-12 flex items-center justify-center shrink-0"
            >
              <span className="text-2xl">⚽</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">Agregar a inicio</p>
              <p className="text-white/50 text-xs mt-0.5">Instalá ElPiqueApp en tu iPhone</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowIOSSheet(true)}
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: "12px",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                }}
                className="px-4 py-2 text-xs font-bold text-white"
              >
                Cómo
              </button>
              <button
                onClick={() => setDismissed(true)}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                }}
                className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
              >
                <span className="text-xs font-bold">✕</span>
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Sheet iOS */}
      <AnimatePresence>
        {showIOSSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowIOSSheet(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed bottom-0 left-0 right-0 z-50"
            >
              <div
                style={{
                  background: "linear-gradient(160deg, rgba(20,35,20,0.97) 0%, rgba(10,20,12,0.98) 100%)",
                  backdropFilter: "blur(60px) saturate(200%)",
                  WebkitBackdropFilter: "blur(60px) saturate(200%)",
                  borderTop: "1px solid rgba(255,255,255,0.15)",
                  borderTopLeftRadius: "28px",
                  borderTopRightRadius: "28px",
                  boxShadow: "0 -8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
                className="p-8 pb-12 space-y-6"
              >
                {/* Handle */}
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto -mt-2" />

                <div className="flex items-center gap-4">
                  <div
                    style={{
                      background: "linear-gradient(135deg, rgba(200,255,0,0.2), rgba(200,255,0,0.08))",
                      border: "1px solid rgba(200,255,0,0.3)",
                      borderRadius: "16px",
                    }}
                    className="w-14 h-14 flex items-center justify-center"
                  >
                    <span className="text-3xl">⚽</span>
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">Instalá ElPiqueApp</h2>
                    <p className="text-white/50 text-sm">Agregar a pantalla de inicio</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { num: "1", text: "Tocá el botón", bold: "Compartir", suffix: " en Safari (cuadrado con flecha ↑)" },
                    { num: "2", text: "Desplazate y elegí", bold: "\"Agregar a pantalla de inicio\"" },
                    { num: "3", text: "Tocá", bold: "Agregar", suffix: ". ¡Listo, la tenés!" },
                  ].map((step) => (
                    <div
                      key={step.num}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "16px",
                      }}
                      className="flex items-start gap-4 px-4 py-3"
                    >
                      <div
                        style={{ background: "rgba(200,255,0,0.15)", border: "1px solid rgba(200,255,0,0.3)", borderRadius: "10px" }}
                        className="w-8 h-8 flex items-center justify-center shrink-0"
                      >
                        <span className="text-rodeo-lime font-black text-sm">{step.num}</span>
                      </div>
                      <p className="text-white/80 text-sm leading-relaxed pt-1">
                        {step.text} <strong className="text-white">{step.bold}</strong>{step.suffix || ""}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { setShowIOSSheet(false); setDismissed(true); }}
                  style={{
                    background: "linear-gradient(135deg, #C8FF00, #A8D800)",
                    borderRadius: "18px",
                    boxShadow: "0 4px 20px rgba(200,255,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4)",
                  }}
                  className="w-full py-4 text-rodeo-dark font-black text-base"
                >
                  Entendido ✓
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
