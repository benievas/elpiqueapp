"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { QrCode, Copy, Check, Share2, Download, ExternalLink, Instagram, MessageCircle, Loader } from "lucide-react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const APP_DOMAIN = "https://elpique.app";

export default function MiLinkPage() {
  const { user } = useAuth();
  const [slug, setSlug] = useState<string | null>(null);
  const [complexName, setComplexName] = useState<string>("");
  const [loadingSlug, setLoadingSlug] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("complexes")
      .select("slug, nombre")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .single()
      .then((response) => {
        const data = response.data as any;
        if (data) { setSlug(data.slug); setComplexName(data.nombre); }
        setLoadingSlug(false);
      });
  }, [user?.id]);

  const publicUrl = slug ? `${APP_DOMAIN}/complejo/${slug}` : "";

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [publicUrl]);

  const handleDownloadQR = useCallback(() => {
    setDownloading(true);
    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-elpique-${slug}.png`;
      a.click();
    }
    setTimeout(() => setDownloading(false), 1000);
  }, [slug]);

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`¡Reservá canchas en mi complejo! 🏟️\n${publicUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleShareInstagram = () => {
    // Instagram doesn't support direct link sharing via web — copy to clipboard instead
    handleCopy();
    alert("Link copiado. Pegalo en tu bio o historia de Instagram.");
  };

  if (loadingSlug) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="animate-spin text-rodeo-lime" size={28} />
      </div>
    );
  }

  if (!slug) {
    return (
      <div className="space-y-4 max-w-xl">
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Mi Link y QR</h1>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" }} className="p-8 text-center space-y-3">
          <p className="text-rodeo-cream/60 text-sm">Primero debés crear tu complejo para obtener tu link público.</p>
          <a href="/owner/complejo" style={{ background: "rgba(200,255,0,0.9)", borderRadius: "12px" }} className="inline-block px-6 py-2.5 text-rodeo-dark font-black text-sm">Crear complejo</a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <p className="text-xs text-rodeo-cream/50 font-bold tracking-widest uppercase mb-1">Tu perfil público</p>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Mi Link y QR</h1>
        <p className="text-sm text-rodeo-cream/60 mt-1">
          {complexName && <span className="text-rodeo-lime font-bold">{complexName} · </span>}
          Compartí el link en redes, imprimí el QR en tu local o descargalo para tus flyers.
        </p>
      </div>

      {/* Link box */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: "rgba(200,255,0,0.06)", border: "1px solid rgba(200,255,0,0.2)", borderRadius: "20px" }}
        className="p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <ExternalLink size={18} className="text-rodeo-lime shrink-0" />
          <p className="text-sm font-bold text-white">Tu link público</p>
        </div>
        <div className="flex items-center gap-2">
          <div
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
            className="flex-1 px-4 py-3 text-sm text-rodeo-lime font-mono truncate"
          >
            {publicUrl}
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? "rgba(200,255,0,0.9)" : "rgba(200,255,0,0.15)",
              border: "1px solid rgba(200,255,0,0.3)",
              borderRadius: "12px",
            }}
            className="p-3 transition-all hover:bg-rodeo-lime/25 shrink-0"
          >
            {copied ? <Check size={18} className="text-rodeo-dark" /> : <Copy size={18} className="text-rodeo-lime" />}
          </button>
        </div>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-rodeo-lime/70 hover:text-rodeo-lime transition-colors"
        >
          <ExternalLink size={12} /> Ver mi página pública →
        </a>
      </motion.div>

      {/* QR Code */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px" }}
        className="p-6 space-y-5"
      >
        <div className="flex items-center gap-3">
          <QrCode size={18} className="text-rodeo-lime" />
          <p className="text-sm font-bold text-white">Código QR descargable</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* SVG preview (visible) */}
          <div
            ref={canvasRef}
            style={{ background: "white", borderRadius: "16px", padding: "16px" }}
            className="shrink-0"
          >
            <QRCodeSVG
              value={publicUrl}
              size={160}
              bgColor="#ffffff"
              fgColor="#1A120B"
              level="M"
              imageSettings={{
                src: "/assets/elpique.png",
                x: undefined,
                y: undefined,
                height: 32,
                width: 32,
                excavate: true,
              }}
            />
          </div>

          {/* Hidden canvas for download */}
          <div style={{ display: "none" }}>
            <QRCodeCanvas
              id="qr-canvas"
              value={publicUrl}
              size={512}
              bgColor="#ffffff"
              fgColor="#1A120B"
              level="M"
              imageSettings={{
                src: "/assets/elpique.png",
                x: undefined,
                y: undefined,
                height: 96,
                width: 96,
                excavate: true,
              }}
            />
          </div>

          <div className="space-y-3 flex-1">
            <p className="text-sm text-rodeo-cream/70 leading-relaxed">
              El QR apunta directamente a tu complejo. Tus clientes lo escanean y ven tus canchas disponibles al instante.
            </p>
            <ul className="space-y-1.5 text-xs text-rodeo-cream/50">
              {["Imprimilo en afiches o tarjetas", "Pegalo en la entrada del complejo", "Usalo en flyers digitales", "Alta resolución 512×512px"].map((tip) => (
                <li key={tip} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-rodeo-lime/50" />
                  {tip}
                </li>
              ))}
            </ul>
            <button
              onClick={handleDownloadQR}
              style={{ background: "rgba(200,255,0,0.9)", borderRadius: "12px" }}
              className="flex items-center gap-2 px-5 py-2.5 text-rodeo-dark font-black text-sm hover:bg-rodeo-lime transition-all"
            >
              <Download size={16} />
              {downloading ? "Descargando..." : "Descargar QR (PNG)"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Compartir en redes */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px" }}
        className="p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <Share2 size={18} className="text-rodeo-lime" />
          <p className="text-sm font-bold text-white">Compartir en redes</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={handleShareWhatsApp}
            style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: "14px" }}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-green-500/20 transition-all"
          >
            <MessageCircle size={20} className="text-green-400 shrink-0" />
            <div className="text-left">
              <p className="text-sm font-bold text-white">WhatsApp</p>
              <p className="text-xs text-rodeo-cream/40">Compartir con clientes</p>
            </div>
          </button>
          <button
            onClick={handleShareInstagram}
            style={{ background: "rgba(225,48,108,0.1)", border: "1px solid rgba(225,48,108,0.2)", borderRadius: "14px" }}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-pink-500/15 transition-all"
          >
            <Instagram size={20} className="text-pink-400 shrink-0" />
            <div className="text-left">
              <p className="text-sm font-bold text-white">Instagram</p>
              <p className="text-xs text-rodeo-cream/40">Copiar para bio/historia</p>
            </div>
          </button>
          <button
            onClick={handleCopy}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px" }}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/10 transition-all"
          >
            {copied ? <Check size={20} className="text-rodeo-lime shrink-0" /> : <Copy size={20} className="text-rodeo-cream/60 shrink-0" />}
            <div className="text-left">
              <p className="text-sm font-bold text-white">{copied ? "¡Copiado!" : "Copiar link"}</p>
              <p className="text-xs text-rodeo-cream/40">Para cualquier red</p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Tip flyer */}
      <div
        style={{ background: "rgba(200,255,0,0.04)", border: "1px solid rgba(200,255,0,0.12)", borderRadius: "16px" }}
        className="px-5 py-4 flex items-start gap-3"
      >
        <span className="text-xl shrink-0">💡</span>
        <div>
          <p className="text-sm font-bold text-white">Tip: Armá tu flyer con el QR</p>
          <p className="text-xs text-rodeo-cream/50 mt-1 leading-relaxed">
            Descargá el QR, abrí Canva o cualquier editor, y combinalo con el logo de tu complejo y el logo de ElPiqueApp.
            Te generamos el texto automáticamente desde la sección <strong className="text-rodeo-cream/70">Flyers IA</strong> (próximamente).
          </p>
        </div>
      </div>
    </div>
  );
}
