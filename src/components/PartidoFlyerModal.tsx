"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2, RefreshCw } from "lucide-react";

interface PartidoFlyerProps {
  partido: {
    id: string;
    deporte: string;
    fecha: string;
    hora_inicio: string;
    slots_totales: number;
    slots_ocupados: number;
    complejo_nombre: string | null;
    ciudad: string;
    descripcion: string | null;
    creador_nombre: string | null;
    fecha_confirmada: boolean;
  };
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEPORTE_META: Record<string, { emoji: string; color: string; bg: string }> = {
  futbol:  { emoji: "⚽", color: "#C8FF00", bg: "#051A05" },
  padel:   { emoji: "🎾", color: "#00E5FF", bg: "#03121A" },
  tenis:   { emoji: "🏸", color: "#FFD600", bg: "#1A1503" },
  voley:   { emoji: "🏐", color: "#FF6B35", bg: "#1A0803" },
  basquet: { emoji: "🏀", color: "#FF4081", bg: "#1A0310" },
  hockey:  { emoji: "🏑", color: "#A78BFA", bg: "#0D0518" },
};

function formatFecha(iso: string) {
  const d = new Date(iso + "T12:00:00");
  const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]}`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function drawPartidoFlyer(canvas: HTMLCanvasElement, p: PartidoFlyerProps["partido"]) {
  const W = 1080, H = 1920;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const meta = DEPORTE_META[p.deporte] ?? DEPORTE_META.futbol;
  const libres = p.slots_totales - p.slots_ocupados;

  // Load fonts
  try {
    const fonts = [
      new FontFace("Barlow Condensed", "url(https://fonts.gstatic.com/s/barlowcondensed/v12/HTxwL3I-JCGChYJ8VI-L6OO_au7B4-Lr.woff2)"),
      new FontFace("Barlow Condensed", "url(https://fonts.gstatic.com/s/barlowcondensed/v12/HTxxL3I-JCGChYJ8VI-L6OO_au7B43LT3w.woff2)", { weight: "700" }),
      new FontFace("Barlow Condensed", "url(https://fonts.gstatic.com/s/barlowcondensed/v12/HTxxL3I-JCGChYJ8VI-L6OO_au7B2-PT3w.woff2)", { weight: "900" }),
    ];
    await Promise.allSettled(fonts.map(f => f.load().then(loaded => document.fonts.add(loaded))));
  } catch { /* fallback */ }

  // ── Background gradient ──
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, meta.bg);
  bgGrad.addColorStop(0.5, "#0A0F0A");
  bgGrad.addColorStop(1, meta.bg + "CC");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle grid pattern
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Glow orb top
  const glow = ctx.createRadialGradient(W / 2, 300, 0, W / 2, 300, 600);
  glow.addColorStop(0, meta.color + "18");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Top bar ──
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(0, 0, W, 110);
  ctx.fillStyle = meta.color;
  ctx.font = "700 38px 'Barlow Condensed', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("EL PIQUE APP · PARTIDOS", W / 2, 68);

  // ── Big emoji ──
  ctx.font = "200px serif";
  ctx.textAlign = "center";
  ctx.fillText(meta.emoji, W / 2, 380);

  // Glow under emoji
  const emojiGlow = ctx.createRadialGradient(W / 2, 360, 0, W / 2, 360, 280);
  emojiGlow.addColorStop(0, meta.color + "22");
  emojiGlow.addColorStop(1, "transparent");
  ctx.fillStyle = emojiGlow;
  ctx.fillRect(0, 180, W, 400);

  // ── SE ARMA PARTIDO ──
  ctx.fillStyle = meta.color;
  ctx.font = "900 88px 'Barlow Condensed', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SE ARMA PARTIDO", W / 2, 530);

  // Deporte label
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "700 52px 'Barlow Condensed', sans-serif";
  ctx.fillText(p.deporte.toUpperCase(), W / 2, 600);

  // ── Divider ──
  const divGrad = ctx.createLinearGradient(80, 0, W - 80, 0);
  divGrad.addColorStop(0, "transparent");
  divGrad.addColorStop(0.5, meta.color + "60");
  divGrad.addColorStop(1, "transparent");
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(80, 638); ctx.lineTo(W - 80, 638); ctx.stroke();

  // ── Info cards ──
  const cards = [
    { icon: "📅", label: p.fecha_confirmada ? formatFecha(p.fecha) : "Fecha a confirmar" },
    { icon: "🕐", label: p.hora_inicio.slice(0, 5) + " hs" },
    { icon: "📍", label: p.complejo_nombre ?? p.ciudad },
  ];

  const cardW = (W - 80 * 2 - 20 * 2) / 3;
  cards.forEach((card, i) => {
    const x = 80 + i * (cardW + 20);
    const y = 670;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(ctx, x, y, cardW, 160, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, cardW, 160, 20);
    ctx.stroke();

    ctx.font = "52px serif";
    ctx.textAlign = "center";
    ctx.fillText(card.icon, x + cardW / 2, y + 64);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 28px 'Barlow Condensed', sans-serif";
    // Truncate long text
    let txt = card.label;
    while (ctx.measureText(txt).width > cardW - 20 && txt.length > 3) txt = txt.slice(0, -1);
    if (txt !== card.label) txt += "…";
    ctx.fillText(txt, x + cardW / 2, y + 108);
  });

  // ── Slots section ──
  const slotsY = 880;
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  roundRect(ctx, 80, slotsY, W - 160, 280, 28);
  ctx.fill();
  ctx.strokeStyle = meta.color + "30";
  ctx.lineWidth = 2;
  roundRect(ctx, 80, slotsY, W - 160, 280, 28);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "600 34px 'Barlow Condensed', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("JUGADORES", W / 2, slotsY + 48);

  // Slot circles
  const circleR = 54;
  const totalSlots = Math.min(p.slots_totales, 10);
  const circleSpacing = Math.min(130, (W - 160 - 60) / totalSlots);
  const startX = W / 2 - (totalSlots - 1) * circleSpacing / 2;

  for (let i = 0; i < totalSlots; i++) {
    const cx = startX + i * circleSpacing;
    const cy = slotsY + 155;
    const filled = i < p.slots_ocupados;

    if (filled) {
      ctx.fillStyle = meta.color + "25";
      ctx.beginPath(); ctx.arc(cx, cy, circleR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = meta.color;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, circleR, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = meta.color;
      ctx.font = "900 36px 'Barlow Condensed', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✓", cx, cy + 13);
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.arc(cx, cy, circleR, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.font = "900 44px 'Barlow Condensed', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("+", cx, cy + 16);
    }
  }

  // Slots label
  ctx.fillStyle = libres === 0 ? meta.color : "rgba(255,255,255,0.6)";
  ctx.font = "700 32px 'Barlow Condensed', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    libres === 0 ? "¡Completo!" : `${libres} lugar${libres !== 1 ? "es" : ""} libre${libres !== 1 ? "s" : ""}`,
    W / 2, slotsY + 248
  );

  // ── Description ──
  if (p.descripcion) {
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "500 36px 'Barlow Condensed', sans-serif";
    ctx.textAlign = "center";
    let desc = p.descripcion.slice(0, 80);
    if (p.descripcion.length > 80) desc += "...";
    ctx.fillText(`"${desc}"`, W / 2, 1220);
  }

  // ── CTA banner ──
  const ctaY = 1310;
  const ctaGrad = ctx.createLinearGradient(80, ctaY, W - 80, ctaY);
  ctaGrad.addColorStop(0, meta.color + "00");
  ctaGrad.addColorStop(0.5, meta.color + "18");
  ctaGrad.addColorStop(1, meta.color + "00");
  ctx.fillStyle = ctaGrad;
  roundRect(ctx, 80, ctaY, W - 160, 160, 24);
  ctx.fill();
  ctx.strokeStyle = meta.color + "30";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 80, ctaY, W - 160, 160, 24);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "600 36px 'Barlow Condensed', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("¿Querés jugar? Buscá el partido en", W / 2, ctaY + 56);
  ctx.fillStyle = meta.color;
  ctx.font = "900 64px 'Barlow Condensed', sans-serif";
  ctx.fillText("ElPiqueApp", W / 2, ctaY + 130);

  // ── Slot pills row ──
  const pillsY = 1530;
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(0, pillsY, W, 120);
  const pills = ["Gratis unirse", "Sin registro", `Ciudad: ${p.ciudad}`];
  const pillW = (W - 80) / pills.length;
  pills.forEach((txt, i) => {
    const px = 40 + i * pillW + pillW / 2;
    ctx.fillStyle = meta.color + "15";
    roundRect(ctx, 40 + i * pillW + 10, pillsY + 20, pillW - 20, 80, 40);
    ctx.fill();
    ctx.fillStyle = meta.color + "80";
    ctx.font = "700 30px 'Barlow Condensed', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(txt, px, pillsY + 68);
  });

  // ── Bottom ──
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, H - 230, W, 230);

  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "500 32px 'Barlow Condensed', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Armá partidos · Reservá canchas · Encontrá jugadores", W / 2, H - 152);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 72px 'Barlow Condensed', sans-serif";
  ctx.fillText("elpiqueapp.com", W / 2, H - 72);

  ctx.fillStyle = meta.color + "60";
  ctx.font = "500 28px 'Barlow Condensed', sans-serif";
  ctx.fillText("La app de deporte social en Catamarca", W / 2, H - 30);
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function PartidoFlyerModal({ partido, onClose }: PartidoFlyerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);

  const redraw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setGenerating(true);
    await drawPartidoFlyer(canvas, partido);
    setGenerating(false);
  }, [partido]);

  useEffect(() => { redraw(); }, [redraw]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `partido-${partido.deporte}-${partido.fecha}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "partido-elpique.png", { type: "image/png" });
      const nav = navigator as any;
      if (nav.share && nav.canShare?.({ files: [file] })) {
        try { await nav.share({ files: [file], title: `Partido de ${partido.deporte} — ElPiqueApp` }); return; } catch { /* cancelled */ }
      }
      handleDownload();
    }, "image/png");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
          style={{ background: "linear-gradient(145deg,rgba(41,28,14,0.98),rgba(26,18,11,0.99))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", width: "100%", maxWidth: "480px", maxHeight: "92vh", overflowY: "auto" }}
          className="p-5 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">Flyer del partido</h3>
              <p className="text-xs text-rodeo-cream/40 mt-0.5">Compartilo en Instagram Stories para sumar jugadores</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-white/10 transition-all text-rodeo-cream/40">
              <X size={16} />
            </button>
          </div>

          {/* Canvas preview */}
          <div style={{ position: "relative" }}>
            {generating && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[16px]"
                style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
                <div className="w-7 h-7 border-2 border-rodeo-lime/30 border-t-rodeo-lime rounded-full animate-spin" />
              </div>
            )}
            <canvas ref={canvasRef}
              style={{ width: "100%", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", display: "block" }} />
          </div>

          <p className="text-[10px] text-center text-rodeo-cream/25">Formato 1080×1920 · Listo para Instagram Stories</p>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleDownload}
              className="flex items-center justify-center gap-2 py-3.5 rounded-[14px] text-sm font-black"
              style={{ background: "rgba(200,255,0,0.9)", color: "#1A120B" }}>
              <Download size={15} /> Descargar
            </button>
            <button onClick={handleShare}
              className="flex items-center justify-center gap-2 py-3.5 rounded-[14px] text-sm font-black"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}>
              <Share2 size={15} /> Compartir
            </button>
          </div>

          <button onClick={redraw} disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-xs font-bold text-rodeo-cream/40 hover:text-rodeo-cream/70 transition-colors disabled:opacity-40">
            <RefreshCw size={12} className={generating ? "animate-spin" : ""} /> Regenerar
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
