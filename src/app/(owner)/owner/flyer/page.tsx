"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from "react";
import { useActiveComplex } from "@/lib/context/ActiveComplexContext";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Download, Share2, RefreshCw, Image as ImageIcon, ChevronDown } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Court = {
  id: string; nombre: string; deporte: string;
  precio_por_hora: number; imagen_principal: string | null;
};

type SlotLibre = { hora: string; precio: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayISO() { return new Date().toISOString().slice(0, 10); }

function formatFecha(iso: string) {
  const d = new Date(iso + "T12:00:00");
  const dias = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];
  const meses = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
  return `${dias[d.getDay()]} ${d.getDate()} DE ${meses[d.getMonth()]}`;
}

function formatHora(h: string) { return h.slice(0, 5); }

const DEPORTE_EMOJI: Record<string, string> = {
  futbol: "⚽", padel: "🎾", tenis: "🏸", voley: "🏐", basquet: "🏀", hockey: "🏑",
};

// ─── Canvas drawing ────────────────────────────────────────────────────────────

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function drawFlyer(
  canvas: HTMLCanvasElement,
  opts: {
    complejo: string; deporte: string; courtName: string;
    slots: SlotLibre[]; fecha: string;
    bgImage: string | null; overlayColor: string; accentColor: string;
    appUrl: string;
  }
) {
  const W = 1080, H = 1920;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Load fonts ──
  try {
    const f1 = new FontFace("Barlow Condensed", "url(https://fonts.gstatic.com/s/barlowcondensed/v12/HTxwL3I-JCGChYJ8VI-L6OO_au7B4-Lr.woff2)");
    const f2 = new FontFace("Barlow Condensed", "url(https://fonts.gstatic.com/s/barlowcondensed/v12/HTxxL3I-JCGChYJ8VI-L6OO_au7B43LT3w.woff2)", { weight: "700" });
    const f3 = new FontFace("Barlow Condensed", "url(https://fonts.gstatic.com/s/barlowcondensed/v12/HTxxL3I-JCGChYJ8VI-L6OO_au7B2-PT3w.woff2)", { weight: "900" });
    await Promise.allSettled([f1.load(), f2.load(), f3.load()].map(p => p.then(f => document.fonts.add(f))));
  } catch { /* fallback to system font */ }

  // ── Background ──
  ctx.fillStyle = "#051005";
  ctx.fillRect(0, 0, W, H);

  if (opts.bgImage) {
    const img = await loadImage(opts.bgImage);
    if (img) {
      // cover fit
      const scale = Math.max(W / img.width, H / img.height);
      const sw = img.width * scale, sh = img.height * scale;
      ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh);
    }
  }

  // ── Overlay gradient ──
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  const hex = opts.overlayColor;
  grad.addColorStop(0,   hex + "E8");
  grad.addColorStop(0.4, hex + "BB");
  grad.addColorStop(0.7, hex + "CC");
  grad.addColorStop(1,   hex + "F2");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // ── Top branding bar ──
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, 0, W, 120);
  ctx.fillStyle = opts.accentColor;
  ctx.font = "700 42px 'Barlow Condensed', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("EL PIQUE APP", W / 2, 76);

  // ── Sport badge ──
  const emoji = DEPORTE_EMOJI[opts.deporte] ?? "🏅";
  const sport = opts.deporte.toUpperCase();
  ctx.fillStyle = opts.accentColor + "25";
  roundRect(ctx, W / 2 - 120, 148, 240, 58, 29);
  ctx.fill();
  ctx.strokeStyle = opts.accentColor + "60";
  ctx.lineWidth = 2;
  roundRect(ctx, W / 2 - 120, 148, 240, 58, 29);
  ctx.stroke();
  ctx.fillStyle = opts.accentColor;
  ctx.font = "700 30px 'Barlow Condensed', sans-serif";
  ctx.fillText(`${emoji}  ${sport}`, W / 2, 187);

  // ── Complex name ──
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 96px 'Barlow Condensed', sans-serif";
  ctx.textAlign = "center";
  wrapText(ctx, opts.complejo.toUpperCase(), W / 2, 310, W - 100, 100);

  // ── Turnos libres heading ──
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "700 58px 'Barlow Condensed', sans-serif";
  ctx.fillText("Turnos libres", W / 2, 480);

  // ── Date ──
  ctx.fillStyle = opts.accentColor;
  ctx.font = "700 46px 'Barlow Condensed', sans-serif";
  ctx.fillText(opts.fecha, W / 2, 548);

  // ── Divider ──
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(80, 580); ctx.lineTo(W - 80, 580); ctx.stroke();

  // ── Slots grid ──
  const slots = opts.slots.slice(0, 10);
  const cols = 2;
  const padX = 70, padY = 610;
  const colW = (W - padX * 2 - 20) / cols;
  const rowH = 150;

  if (slots.length === 0) {
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "600 38px 'Barlow Condensed', sans-serif";
    ctx.fillText("Sin turnos libres hoy", W / 2, 750);
  } else {
    slots.forEach((slot, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = padX + col * (colW + 20);
      const y = padY + row * (rowH + 16);

      // Card bg
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      roundRect(ctx, x, y, colW, rowH - 10, 20);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1.5;
      roundRect(ctx, x, y, colW, rowH - 10, 20);
      ctx.stroke();

      // Hora
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 72px 'Barlow Condensed', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(formatHora(slot.hora), x + colW / 2, y + 66);

      // Precio
      ctx.fillStyle = opts.accentColor;
      ctx.font = "700 32px 'Barlow Condensed', sans-serif";
      ctx.fillText(`$${slot.precio.toLocaleString("es-AR")}`, x + colW / 2, y + 108);
    });
  }

  // ── Bottom branding ──
  const bottomY = H - 160;
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(0, bottomY, W, 160);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "600 34px 'Barlow Condensed', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Reservá desde", W / 2, bottomY + 52);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 58px 'Barlow Condensed', sans-serif";
  ctx.fillText("ElPiqueApp", W / 2, bottomY + 116);

  ctx.fillStyle = opts.accentColor + "90";
  ctx.font = "500 28px 'Barlow Condensed', sans-serif";
  ctx.fillText(opts.appUrl, W / 2, bottomY + 148);
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

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const words = text.split(" ");
  let line = "";
  let curY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, curY);
      line = word; curY += lineH;
    } else { line = test; }
  }
  if (line) ctx.fillText(line, x, curY);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const OVERLAY_PRESETS = [
  { label: "Verde oscuro", value: "#051005" },
  { label: "Azul marino",  value: "#030B1A" },
  { label: "Carbón",       value: "#111111" },
  { label: "Bordo",        value: "#1A0305" },
  { label: "Violeta",      value: "#0D0518" },
];

const ACCENT_PRESETS = [
  { label: "Lima",    value: "#C8FF00" },
  { label: "Blanco",  value: "#FFFFFF" },
  { label: "Cian",    value: "#00E5FF" },
  { label: "Naranja", value: "#FF6B35" },
  { label: "Rosa",    value: "#FF4081" },
];

export default function FlyerPage() {
  const { activeComplexId } = useActiveComplex();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [slots, setSlots] = useState<SlotLibre[]>([]);
  const [complexName, setComplexName] = useState("");
  const [complexImg, setComplexImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [overlayColor, setOverlayColor] = useState(OVERLAY_PRESETS[0].value);
  const [accentColor, setAccentColor] = useState(ACCENT_PRESETS[0].value);
  const [useCourtBg, setUseCourtBg] = useState(true);

  const today = getTodayISO();
  const fechaLabel = formatFecha(today);

  // ── Fetch data ──
  useEffect(() => {
    if (!activeComplexId) return;
    const load = async () => {
      setLoading(true);
      const [cxRes, courtsRes] = await Promise.all([
        supabase.from("complexes").select("nombre, imagen_principal").eq("id", activeComplexId).single(),
        supabase.from("courts").select("id, nombre, deporte, precio_por_hora, imagen_principal")
          .eq("complex_id", activeComplexId).eq("activa", true).order("nombre"),
      ]);
      setComplexName((cxRes.data as any)?.nombre ?? "");
      setComplexImg((cxRes.data as any)?.imagen_principal ?? null);
      const cs = (courtsRes.data ?? []) as Court[];
      setCourts(cs);
      if (cs.length > 0 && !selectedCourt) setSelectedCourt(cs[0]);
      setLoading(false);
    };
    load();
  }, [activeComplexId]);

  // ── Fetch slots for selected court ──
  useEffect(() => {
    if (!selectedCourt || !activeComplexId) return;
    const load = async () => {
      // Fetch reservations for today to know occupied slots
      const { data: reservas } = await supabase
        .from("reservations")
        .select("hora_inicio")
        .eq("court_id", selectedCourt.id)
        .eq("fecha", today)
        .in("estado", ["pendiente", "confirmada"]);

      const ocupadas = new Set((reservas ?? []).map((r: any) => r.hora_inicio));

      // Generate schedule 07:00–23:00 on the hour
      const nowH = new Date().getHours();
      const libres: SlotLibre[] = [];
      for (let h = 7; h <= 22; h++) {
        const hora = `${String(h).padStart(2, "0")}:00`;
        if (ocupadas.has(hora)) continue;
        // Skip past hours for today
        if (h <= nowH) continue;
        libres.push({ hora, precio: selectedCourt.precio_por_hora });
      }
      setSlots(libres);
    };
    load();
  }, [selectedCourt, today, activeComplexId]);

  // ── Redraw canvas ──
  const redraw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !complexName) return;
    setGenerating(true);
    const bgImg = useCourtBg
      ? (selectedCourt?.imagen_principal ?? complexImg)
      : complexImg;
    await drawFlyer(canvas, {
      complejo: complexName,
      deporte: selectedCourt?.deporte ?? "futbol",
      courtName: selectedCourt?.nombre ?? "",
      slots,
      fecha: fechaLabel,
      bgImage: bgImg,
      overlayColor,
      accentColor,
      appUrl: "elpiqueapp.com",
    });
    setGenerating(false);
  }, [complexName, selectedCourt, slots, fechaLabel, overlayColor, accentColor, useCourtBg, complexImg]);

  useEffect(() => { redraw(); }, [redraw]);

  // ── Actions ──
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `flyer-${complexName.toLowerCase().replace(/\s+/g, "-")}-${today}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "flyer-elpique.png", { type: "image/png" });
      const nav = navigator as any;
      if (nav.share && nav.canShare?.({ files: [file] })) {
        try { await nav.share({ files: [file], title: `Turnos libres — ${complexName}` }); return; } catch { /* cancelled */ }
      }
      // Fallback: download
      handleDownload();
    }, "image/png");
  };

  const inp = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#E1D4C2", outline: "none" } as React.CSSProperties;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <p className="text-xs text-rodeo-cream/50 font-bold tracking-widest uppercase">Marketing</p>
        <h1 style={{ fontFamily: "'Barlow Condensed',system-ui,sans-serif", fontWeight: 900, fontSize: "44px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }}
          className="text-white flex items-center gap-3">
          <ImageIcon size={32} className="text-rodeo-lime" /> Flyer Instagram
        </h1>
        <p className="text-sm text-rodeo-cream/50 mt-1">Generá una historia 9:16 con los turnos libres del día para compartir en Instagram.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-rodeo-lime/30 border-t-rodeo-lime rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Controls ── */}
          <div className="space-y-5">

            {/* Court selector */}
            {courts.length > 1 && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Cancha</label>
                <div className="relative">
                  <select value={selectedCourt?.id ?? ""} onChange={e => setSelectedCourt(courts.find(c => c.id === e.target.value) ?? null)}
                    style={inp} className="w-full px-3 py-2.5 text-sm appearance-none pr-9">
                    {courts.map(c => <option key={c.id} value={c.id} style={{ background: "#1A120B" }}>{c.nombre} · {c.deporte}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-rodeo-cream/40 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Slots summary */}
            <div style={{ background: "rgba(200,255,0,0.04)", border: "1px solid rgba(200,255,0,0.12)", borderRadius: "14px" }} className="px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-rodeo-lime/60 mb-1">Turnos libres hoy</p>
              {slots.length === 0 ? (
                <p className="text-sm text-rodeo-cream/40">Sin turnos disponibles para mostrar</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {slots.map(s => (
                    <span key={s.hora} className="text-xs font-black px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(200,255,0,0.12)", border: "1px solid rgba(200,255,0,0.25)", color: "#C8FF00" }}>
                      {formatHora(s.hora)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Overlay color */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Color de fondo</label>
              <div className="flex gap-2 flex-wrap">
                {OVERLAY_PRESETS.map(p => (
                  <button key={p.value} onClick={() => setOverlayColor(p.value)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                    style={overlayColor === p.value
                      ? { background: p.value, border: "2px solid rgba(200,255,0,0.6)", color: "#C8FF00", boxShadow: "0 0 12px rgba(200,255,0,0.3)" }
                      : { background: p.value, border: "1px solid rgba(255,255,255,0.15)", color: "rgba(225,212,194,0.5)" }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent color */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-rodeo-cream/50 uppercase tracking-widest">Color de acento</label>
              <div className="flex gap-2 flex-wrap">
                {ACCENT_PRESETS.map(p => (
                  <button key={p.value} onClick={() => setAccentColor(p.value)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                    style={accentColor === p.value
                      ? { background: `${p.value}20`, border: `2px solid ${p.value}`, color: p.value, boxShadow: `0 0 12px ${p.value}30` }
                      : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(225,212,194,0.5)" }}>
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: p.value }} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Background toggle */}
            <div className="flex items-center justify-between px-4 py-3 rounded-[12px]"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div>
                <p className="text-sm font-bold text-white">Usar foto de la cancha</p>
                <p className="text-[11px] text-rodeo-cream/40">Como fondo del flyer</p>
              </div>
              <button onClick={() => setUseCourtBg(v => !v)}
                className="relative w-11 h-6 rounded-full transition-colors"
                style={{ background: useCourtBg ? "rgba(200,255,0,0.8)" : "rgba(255,255,255,0.1)" }}>
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                  style={{ left: useCourtBg ? "calc(100% - 22px)" : "2px" }} />
              </button>
            </div>

            {/* Regenerate */}
            <button onClick={redraw} disabled={generating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(225,212,194,0.6)" }}>
              <RefreshCw size={15} className={generating ? "animate-spin" : ""} />
              {generating ? "Generando..." : "Regenerar flyer"}
            </button>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleDownload}
                className="flex items-center justify-center gap-2 py-3.5 rounded-[14px] text-sm font-black transition-all"
                style={{ background: "rgba(200,255,0,0.9)", color: "#1A120B" }}>
                <Download size={16} /> Descargar PNG
              </button>
              <button onClick={handleShare}
                className="flex items-center justify-center gap-2 py-3.5 rounded-[14px] text-sm font-black transition-all"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}>
                <Share2 size={16} /> Compartir
              </button>
            </div>

            <p className="text-[11px] text-rodeo-cream/30 text-center">
              En móvil "Compartir" abre directamente Instagram Stories.
            </p>
          </div>

          {/* ── Canvas preview ── */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-rodeo-cream/30">Vista previa</p>
            <div style={{ position: "relative", width: "100%", maxWidth: "280px" }}>
              {generating && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[16px]"
                  style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
                  <div className="w-7 h-7 border-2 border-rodeo-lime/30 border-t-rodeo-lime rounded-full animate-spin" />
                </div>
              )}
              <canvas ref={canvasRef}
                style={{ width: "100%", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", display: "block" }} />
            </div>
            <p className="text-[10px] text-rodeo-cream/20">Formato 1080×1920 · Listo para Instagram Stories</p>
          </div>

        </div>
      )}
    </div>
  );
}
