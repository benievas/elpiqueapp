"use client";
export const dynamic = 'force-dynamic';

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode, Copy, Check, Share2, Download, ExternalLink,
  Instagram, MessageCircle, Loader, ImagePlus, Sparkles, X,
} from "lucide-react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const APP_DOMAIN = "https://elpique.app";

// ─── Flyer Generator ──────────────────────────────────────────────────────────

function FlyerGenerator({ publicUrl, complexName }: { publicUrl: string; complexName: string }) {
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenQrRef = useRef<HTMLDivElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const generateFlyer = useCallback(async () => {
    setGenerating(true);

    // Get QR canvas data from the hidden QRCodeCanvas
    const qrCanvas = document.getElementById("flyer-qr-canvas") as HTMLCanvasElement | null;
    const qrDataUrl = qrCanvas?.toDataURL("image/png") ?? null;

    const canvas = document.createElement("canvas");
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#1A120B");
    grad.addColorStop(0.5, "#291C0E");
    grad.addColorStop(1, "#1A120B");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Decorative circle top-right
    ctx.beginPath();
    ctx.arc(W + 100, -100, 500, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(200,255,0,0.06)";
    ctx.fill();

    // Decorative circle bottom-left
    ctx.beginPath();
    ctx.arc(-150, H + 100, 500, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(200,255,0,0.04)";
    ctx.fill();

    // Top brand bar
    ctx.fillStyle = "rgba(200,255,0,0.12)";
    ctx.beginPath();
    ctx.roundRect(60, 80, W - 120, 100, 20);
    ctx.fill();

    ctx.fillStyle = "#C8FF00";
    ctx.font = "bold 36px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ElPiqueApp · Tu complejo deportivo online", W / 2, 142);

    // Complex name
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "black 88px system-ui, sans-serif";
    ctx.textAlign = "center";
    const name = complexName.toUpperCase();
    // Wrap text if too long
    const maxWidth = W - 120;
    const words = name.split(" ");
    let line = "";
    const lines: string[] = [];
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    lines.push(line);
    const nameY = 340;
    lines.forEach((l, i) => ctx.fillText(l, W / 2, nameY + i * 100));

    // "Escaneá y reservá" subtitle
    const subtitleY = nameY + lines.length * 100 + 40;
    ctx.fillStyle = "rgba(225,212,194,0.7)";
    ctx.font = "500 44px system-ui, sans-serif";
    ctx.fillText("Escaneá el QR y reservá tu cancha", W / 2, subtitleY);

    // QR white card
    const qrSize = 560;
    const qrX = (W - qrSize) / 2;
    const qrY = subtitleY + 80;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(qrX - 40, qrY - 40, qrSize + 80, qrSize + 80, 32);
    ctx.fill();

    // Draw QR
    if (qrDataUrl) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
          resolve();
        };
        img.src = qrDataUrl;
      });
    }

    // Owner logo (if uploaded)
    if (logoDataUrl) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const logoSize = 200;
          const logoX = (W - logoSize) / 2;
          const logoY = qrY + qrSize + 120;
          // Circle clip for logo
          ctx.save();
          ctx.beginPath();
          ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 8, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.15)";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
          ctx.restore();
          resolve();
        };
        img.src = logoDataUrl;
      });
    }

    // Bottom tag
    const bottomY = H - 120;
    ctx.fillStyle = "rgba(200,255,0,0.9)";
    ctx.font = "black 42px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("elpique.app", W / 2, bottomY);

    ctx.fillStyle = "rgba(225,212,194,0.4)";
    ctx.font = "400 30px system-ui, sans-serif";
    ctx.fillText("Reservas online · Sin llamadas · Sin esperas", W / 2, bottomY + 50);

    // Download
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `flyer-historia-${complexName.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();

    setGenerating(false);
  }, [publicUrl, complexName, logoDataUrl]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      style={{ background: "rgba(200,255,0,0.05)", border: "1px solid rgba(200,255,0,0.18)", borderRadius: "20px" }}
      className="p-6 space-y-5"
    >
      <div className="flex items-center gap-3">
        <Sparkles size={18} className="text-rodeo-lime" />
        <p className="text-sm font-bold text-white">Generar flyer para historia</p>
        <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(200,255,0,0.2)", color: "#C8FF00" }}>
          Instagram 9:16
        </span>
      </div>
      <p className="text-xs text-rodeo-cream/50 leading-relaxed">
        Generamos un flyer listo para subir a tus historias de Instagram, con el QR de tu complejo y la marca de ElPiqueApp.
        Podés sumar tu propio logo.
      </p>

      {/* Logo upload */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-rodeo-cream/50 mb-2">Logo del complejo (opcional)</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px" }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-rodeo-cream/70 hover:text-white transition-all hover:bg-white/10"
          >
            <ImagePlus size={16} />
            {logoDataUrl ? "Cambiar logo" : "Subir logo"}
          </button>
          {logoDataUrl && (
            <div className="flex items-center gap-2">
              <img src={logoDataUrl} alt="Logo preview" className="w-10 h-10 rounded-lg object-cover" />
              <button onClick={() => setLogoDataUrl(null)} className="text-rodeo-cream/40 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Preview hint */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }}
        className="p-4 flex items-start gap-3"
      >
        <span className="text-2xl shrink-0">📱</span>
        <div className="space-y-1">
          <p className="text-xs font-bold text-white">El flyer incluye:</p>
          <ul className="text-xs text-rodeo-cream/50 space-y-1">
            {["Nombre de tu complejo en grande", "QR listo para escanear", logoDataUrl ? "Tu logo ✓" : "Tu logo (opcional)", "Branding de ElPiqueApp"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-rodeo-lime/50 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        onClick={generateFlyer}
        disabled={generating}
        style={{ background: "rgba(200,255,0,0.9)", borderRadius: "14px" }}
        className="w-full flex items-center justify-center gap-2 py-3.5 text-rodeo-dark font-black text-sm uppercase tracking-wider hover:brightness-105 disabled:opacity-60 transition-all"
      >
        {generating ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
        {generating ? "Generando flyer..." : "Descargar flyer para historia"}
      </button>

      {/* Hidden QR canvas for flyer generation */}
      <div style={{ position: "absolute", left: -9999, top: -9999 }} ref={hiddenQrRef}>
        <QRCodeCanvas
          id="flyer-qr-canvas"
          value={publicUrl}
          size={560}
          bgColor="#ffffff"
          fgColor="#1A120B"
          level="M"
        />
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

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
        const data = response.data as { slug: string; nombre: string } | null;
        if (data) { setSlug(data.slug); setComplexName(data.nombre); }
        setLoadingSlug(false);
      });
  }, [user?.id]);

  const publicUrl = slug ? `${APP_DOMAIN}/complejo/${slug}` : "";

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

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
          Compartí, imprimí o generá un flyer listo para redes.
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
          <div
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
              {["Imprimilo en afiches o tarjetas", "Pegalo en la entrada del complejo", "Alta resolución 512×512px"].map((tip) => (
                <li key={tip} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-rodeo-lime/50" />
                  {tip}
                </li>
              ))}
            </ul>
            <button
              onClick={handleDownloadQR}
              style={{ background: "rgba(200,255,0,0.9)", borderRadius: "12px" }}
              className="flex items-center gap-2 px-5 py-2.5 text-rodeo-dark font-black text-sm hover:brightness-105 transition-all"
            >
              <Download size={16} />
              {downloading ? "Descargando..." : "Descargar QR (PNG)"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Flyer Generator */}
      <FlyerGenerator publicUrl={publicUrl} complexName={complexName} />

      {/* Compartir en redes */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
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
    </div>
  );
}
