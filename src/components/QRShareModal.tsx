"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { X, Copy, Check, Download, Share2, QrCode } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
  subtitle?: string;
}

export default function QRShareModal({ open, onClose, url, title, subtitle }: Props) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert(url);
    }
  }

  function descargarPNG() {
    const canvas = canvasRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    const safe = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    a.download = `qr-${safe || "elpiqueapp"}.png`;
    a.click();
  }

  async function compartir() {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) {
      try { await nav.share({ title, url }); return; } catch { /* cancelled */ }
    }
    copiarLink();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#1A120B", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px" }}
            className="w-full max-w-sm p-6">

            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <QrCode size={12} className="text-rodeo-lime"/>
                  <p className="text-[10px] font-black text-rodeo-lime uppercase tracking-widest">Compartir</p>
                </div>
                <h3 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "22px", letterSpacing: "-0.01em", textTransform: "uppercase", lineHeight: 1 }} className="text-white">
                  {title}
                </h3>
                {subtitle && <p className="text-xs text-rodeo-cream/50 mt-0.5">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-rodeo-cream/50">
                <X size={18}/>
              </button>
            </div>

            <div ref={canvasRef} className="bg-white rounded-2xl p-5 flex items-center justify-center my-4">
              <QRCodeCanvas value={url} size={220} level="M" includeMargin={false}/>
            </div>

            <div
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px" }}
              className="flex items-center gap-2 px-3 py-2 mb-3">
              <p className="flex-1 text-xs text-rodeo-cream/70 truncate" title={url}>{url}</p>
              <button onClick={copiarLink} className="shrink-0 p-1.5 rounded-md hover:bg-white/10 text-rodeo-lime">
                {copied ? <Check size={14}/> : <Copy size={14}/>}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={descargarPNG}
                style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"10px" }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-rodeo-cream/80 hover:bg-white/10 transition-colors">
                <Download size={13}/> Descargar PNG
              </button>
              <button onClick={compartir}
                style={{ background:"rgba(200,255,0,0.9)", borderRadius:"10px" }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-black text-rodeo-dark hover:brightness-110 transition-all">
                <Share2 size={13}/> Compartir
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
