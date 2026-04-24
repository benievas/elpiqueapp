"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  Star,
  TrendingUp,
  Building2,
  MessageSquare,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";
import { useActiveComplex } from "@/lib/context/ActiveComplexContext";
import type { Deporte, EstadoReserva } from "@/types/database";

// ─── Local types for fetched data ────────────────────────────────────────────

interface ComplexSummary {
  id: string;
  nombre: string;
  rating_promedio: number | null;
  total_reviews: number;
}

interface ReservationRow {
  id: string;
  fecha: string;
  hora_inicio: string;
  precio_total: number;
  estado: EstadoReserva;
  court_id: string;
}

type Period = "7d" | "30d" | "3m";

interface CourtRow {
  id: string;
  nombre: string;
  deporte: Deporte;
  precio_por_hora: number;
  activa: boolean;
}

interface ReviewRow {
  id: string;
  estrellas: number;
  texto: string | null;
  created_at: string;
  court: { nombre: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatARS(n: number): string {
  return n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

function timeAgo(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHrs < 24) return `hace ${diffHrs} ${diffHrs === 1 ? "hora" : "horas"}`;
  return `hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
}

const CONFIRMED_STATES: EstadoReserva[] = ["confirmada", "completada"];

const DEPORTE_LABELS: Record<Deporte, string> = {
  futbol: "Fútbol",
  padel: "Pádel",
  tenis: "Tenis",
  voley: "Vóley",
  basquet: "Básquet",
  hockey: "Hockey",
  squash: "Squash",
};

// ─── Section fade-in variant ──────────────────────────────────────────────────

const sectionVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const { user, loading: authLoading } = useAuth();
  const { activeComplexId } = useActiveComplex();

  const [complejos, setComplejos] = useState<ComplexSummary[]>([]);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [courts, setCourts] = useState<CourtRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user || !activeComplexId) return;

    const fetchAll = async () => {
      setDataLoading(true);

      const daysBack = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const since = new Date();
      since.setDate(since.getDate() - daysBack);
      const fromDate = since.toISOString().split("T")[0];

      const [complejoRes, resRes, courtRes, reviewRes] = await Promise.all([
        supabase.from("complexes").select("id, nombre, rating_promedio, total_reviews").eq("id", activeComplexId).maybeSingle(),
        supabase.from("reservations").select("id, fecha, hora_inicio, precio_total, estado, court_id").eq("complex_id", activeComplexId).gte("fecha", fromDate).order("fecha", { ascending: true }),
        supabase.from("courts").select("id, nombre, deporte, precio_por_hora, activa").eq("complex_id", activeComplexId),
        supabase.from("reviews").select("id, estrellas, texto, created_at, court:courts(nombre)").eq("complex_id", activeComplexId).order("created_at", { ascending: false }).limit(5),
      ]);

      setComplejos(complejoRes.data ? [complejoRes.data as ComplexSummary] : []);
      setReservations((resRes.data ?? []) as ReservationRow[]);
      setCourts((courtRes.data ?? []) as CourtRow[]);
      setReviews(((reviewRes.data as any[]) ?? []).map((r: any) => ({
        id: r.id as string,
        estrellas: r.estrellas as number,
        texto: r.texto as string | null,
        created_at: r.created_at as string,
        court: Array.isArray(r.court) ? (r.court[0] as { nombre: string } | null) ?? null : (r.court as { nombre: string } | null),
      })));
      setDataLoading(false);
    };

    fetchAll();
  }, [user, activeComplexId, period]);

  // ── Derived metrics ────────────────────────────────────────────────────────

  const totalReservas = reservations.length;

  const confirmadas = useMemo(
    () => reservations.filter((r) => CONFIRMED_STATES.includes(r.estado)).length,
    [reservations]
  );

  const ingresos = useMemo(
    () =>
      reservations
        .filter((r) => CONFIRMED_STATES.includes(r.estado))
        .reduce((sum, r) => sum + (r.precio_total ?? 0), 0),
    [reservations]
  );

  const ratingPromedio = useMemo(() => {
    const withRating = complejos.filter((c) => c.rating_promedio !== null);
    if (withRating.length === 0) return null;
    const avg =
      withRating.reduce((sum, c) => sum + (c.rating_promedio ?? 0), 0) /
      withRating.length;
    return avg.toFixed(1);
  }, [complejos]);

  // ── Extra metrics ──────────────────────────────────────────────────────────

  const cancelacionRate = useMemo(() => {
    if (reservations.length === 0) return null;
    const canceladas = reservations.filter(r => r.estado === "cancelada").length;
    return Math.round((canceladas / reservations.length) * 100);
  }, [reservations]);

  const horaPico = useMemo(() => {
    const counts: Record<string, number> = {};
    reservations.filter(r => CONFIRMED_STATES.includes(r.estado) && r.hora_inicio).forEach(r => {
      const h = r.hora_inicio.slice(0, 5);
      counts[h] = (counts[h] ?? 0) + 1;
    });
    const entries = Object.entries(counts);
    if (!entries.length) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }, [reservations]);

  const diaMasActivo = useMemo(() => {
    const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    reservations.filter(r => CONFIRMED_STATES.includes(r.estado)).forEach(r => {
      const d = new Date(r.fecha + "T12:00:00").getDay();
      counts[d]++;
    });
    const max = Math.max(...counts);
    if (max === 0) return null;
    return DIAS[counts.indexOf(max)];
  }, [reservations]);

  // ── Bar chart: reservations per day ───────────────────────────────────────

  const chartData = useMemo(() => {
    const daysBack = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const days: { date: string; label: string; confirmed: number; pending: number }[] = [];
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
      days.push({ date: iso, label, confirmed: 0, pending: 0 });
    }

    reservations.forEach((r) => {
      const slot = days.find((d) => d.date === r.fecha);
      if (!slot) return;
      if (CONFIRMED_STATES.includes(r.estado)) slot.confirmed += 1;
      else slot.pending += 1;
    });

    return days;
  }, [reservations, period]);

  const maxBarCount = useMemo(
    () => Math.max(1, ...chartData.map((d) => d.confirmed + d.pending)),
    [chartData]
  );

  // ── Top courts by reservations ─────────────────────────────────────────────

  const courtReservationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    reservations.forEach((r) => {
      counts[r.court_id] = (counts[r.court_id] ?? 0) + 1;
    });
    return counts;
  }, [reservations]);

  const topCourts = useMemo(() => {
    return [...courts]
      .map((c) => ({ ...c, count: courtReservationCounts[c.id] ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [courts, courtReservationCounts]);

  const maxCourtCount = useMemo(
    () => Math.max(1, ...topCourts.map((c) => c.count)),
    [topCourts]
  );

  // ── Ingresos por cancha ────────────────────────────────────────────────────

  const courtIngresos = useMemo(() => {
    const map: Record<string, number> = {};
    reservations
      .filter((r) => CONFIRMED_STATES.includes(r.estado))
      .forEach((r) => {
        map[r.court_id] = (map[r.court_id] ?? 0) + (r.precio_total ?? 0);
      });
    return map;
  }, [reservations]);

  const topIngresosCourts = useMemo(() => {
    return [...courts]
      .map((c) => ({ ...c, ingresos: courtIngresos[c.id] ?? 0 }))
      .sort((a, b) => b.ingresos - a.ingresos)
      .filter((c) => c.ingresos > 0)
      .slice(0, 5);
  }, [courts, courtIngresos]);

  const maxIngresos = useMemo(
    () => Math.max(1, ...topIngresosCourts.map((c) => c.ingresos)),
    [topIngresosCourts]
  );

  // ── Current date string ────────────────────────────────────────────────────

  const currentDate = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ── Render states ──────────────────────────────────────────────────────────

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-rodeo-lime/30 border-t-rodeo-lime rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 text-center">
        <AlertCircle size={40} className="text-rodeo-cream/30" />
        <p className="text-rodeo-cream/60">Debés iniciar sesión para ver las estadísticas.</p>
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-liquid text-sm font-bold text-rodeo-dark"
          style={{ background: "#C8FF00" }}
        >
          Ir al login
        </Link>
      </div>
    );
  }

  if (complejos.length === 0) {
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
        }}
        className="p-12 flex flex-col items-center gap-5 text-center max-w-md mx-auto mt-8"
      >
        <div
          style={{
            background: "rgba(200,255,0,0.1)",
            border: "1px solid rgba(200,255,0,0.2)",
            borderRadius: "16px",
          }}
          className="w-16 h-16 flex items-center justify-center"
        >
          <Building2 size={28} className="text-rodeo-lime" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">
            Sin complejo registrado
          </h2>
          <p className="text-sm text-rodeo-cream/50">
            Creá tu complejo deportivo para comenzar a ver estadísticas y métricas de tu negocio.
          </p>
        </div>
        <Link
          href="/owner/complejo"
          style={{ background: "#C8FF00", borderRadius: "12px" }}
          className="px-6 py-3 font-black text-sm text-rodeo-dark hover:opacity-90 transition-opacity"
        >
          Crear complejo
        </Link>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-10">

      {/* ── Header ── */}
      <motion.div
        variants={sectionVariant}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-1"
      >
        <p className="text-xs text-rodeo-cream/50 font-bold tracking-widest uppercase">
          Panel de Control
        </p>
        <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "44px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }} className="text-white">
          Estadísticas
        </h1>
        <div className="flex flex-wrap items-center gap-3 mt-1">
          {/* Period selector */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }} className="flex p-1 gap-0.5">
            {([["7d", "7 días"], ["30d", "30 días"], ["3m", "3 meses"]] as [Period, string][]).map(([p, lbl]) => (
              <button key={p} onClick={() => setPeriod(p)}
                className="flex items-center gap-1 px-3 py-1 rounded-[8px] text-xs font-bold transition-all"
                style={period === p
                  ? { background: "rgba(200,255,0,0.9)", color: "#1A120B" }
                  : { color: "rgba(225,212,194,0.5)" }}>
                {p === "30d" && <CalendarDays size={10} />} {lbl}
              </button>
            ))}
          </div>
          <span className="text-xs text-rodeo-cream/40 capitalize">{currentDate}</span>
        </div>
      </motion.div>

      {/* ── KPI Strip ── */}
      <motion.div
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40 mb-4">
          Resumen del período
        </p>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Reservas totales */}
          <KpiCard
            icon={<CalendarDays size={18} className="text-rodeo-lime" />}
            value={String(totalReservas)}
            label="Reservas totales"
            positive={totalReservas > 0}
          />
          {/* Confirmadas */}
          <KpiCard
            icon={<CheckCircle2 size={18} className="text-green-400" />}
            value={String(confirmadas)}
            label="Confirmadas"
            positive={confirmadas > 0}
            valueColor="text-green-400"
          />
          {/* Ingresos */}
          <KpiCard
            icon={<DollarSign size={18} className="text-rodeo-lime" />}
            value={formatARS(ingresos)}
            label="Ingresos (ARS)"
            positive={ingresos > 0}
            smallValue
          />
          {/* Rating */}
          <KpiCard
            icon={<Star size={18} className="text-amber-400" />}
            value={ratingPromedio ?? "—"}
            label="Rating promedio"
            positive={ratingPromedio !== null}
            valueColor="text-amber-400"
          />
          {/* Hora pico */}
          <KpiCard
            icon={<Clock size={18} className="text-sky-400" />}
            value={horaPico ?? "—"}
            label="Hora pico"
            positive={!!horaPico}
            valueColor="text-sky-400"
          />
          {/* Día más activo */}
          <KpiCard
            icon={<CalendarDays size={18} className="text-purple-400" />}
            value={diaMasActivo ?? "—"}
            label="Día más activo"
            positive={!!diaMasActivo}
            valueColor="text-purple-400"
          />
          {/* Tasa cancelación */}
          <KpiCard
            icon={<XCircle size={18} className="text-red-400" />}
            value={cancelacionRate !== null ? `${cancelacionRate}%` : "—"}
            label="Tasa cancelación"
            positive={cancelacionRate !== null && cancelacionRate < 15}
            valueColor={cancelacionRate !== null && cancelacionRate > 30 ? "text-red-400" : "text-white"}
          />
        </div>
      </motion.div>

      {/* ── Bar Chart: Reservas por día ── */}
      <motion.div
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40 mb-4">
          Reservas por día — período seleccionado
        </p>
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
          }}
          className="p-5"
        >
          {/* Legend */}
          <div className="flex items-center gap-5 mb-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ background: "#C8FF00" }}
              />
              <span className="text-xs text-rodeo-cream/60">Confirmadas</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ background: "rgba(255,179,0,0.6)" }}
              />
              <span className="text-xs text-rodeo-cream/60">Pendientes</span>
            </div>
          </div>

          {/* Bars container */}
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 min-w-[600px]" style={{ height: 100 }}>
              {chartData.map((day, idx) => {
                const total = day.confirmed + day.pending;
                const confirmedH = total === 0 ? 0 : Math.round((day.confirmed / maxBarCount) * 88);
                const pendingH = total === 0 ? 0 : Math.round((day.pending / maxBarCount) * 88);
                const showLabel = idx === 0 || idx % 5 === 0 || idx === 29;

                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center justify-end gap-0 group relative"
                    style={{ minWidth: 14 }}
                  >
                    {/* Tooltip */}
                    {total > 0 && (
                      <div
                        className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap"
                        style={{
                          background: "rgba(20,20,20,0.92)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: "8px",
                          padding: "5px 9px",
                        }}
                      >
                        <p className="text-[10px] font-bold text-white">{day.label}</p>
                        <p className="text-[10px] text-rodeo-cream/60">{total} reserva{total !== 1 ? "s" : ""}</p>
                      </div>
                    )}

                    {/* Stacked bars */}
                    <div className="w-full flex flex-col-reverse items-center gap-0" style={{ height: 88 }}>
                      {/* Confirmed bar */}
                      <div
                        style={{
                          width: "80%",
                          height: confirmedH,
                          background: "#C8FF00",
                          borderRadius: pendingH > 0 ? "0" : "3px 3px 0 0",
                          transition: "height 0.4s ease",
                        }}
                      />
                      {/* Pending bar */}
                      {pendingH > 0 && (
                        <div
                          style={{
                            width: "80%",
                            height: pendingH,
                            background: "rgba(255,179,0,0.6)",
                            borderRadius: "3px 3px 0 0",
                            transition: "height 0.4s ease",
                          }}
                        />
                      )}
                    </div>

                    {/* X-axis label */}
                    {showLabel && (
                      <span
                        className="text-[9px] text-rodeo-cream/30 mt-1 whitespace-nowrap"
                        style={{ lineHeight: 1.2 }}
                      >
                        {day.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {totalReservas === 0 && (
            <p className="text-xs text-rodeo-cream/30 text-center mt-4">
              Sin reservas en el período — los datos aparecerán acá en cuanto lleguen reservas.
            </p>
          )}
        </div>
      </motion.div>

      {/* ── Two-column: Top canchas + Ingresos por cancha ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top canchas */}
        <motion.div
          variants={sectionVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40 mb-4">
            Top canchas por reservas
          </p>
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
            }}
            className="p-5 space-y-3"
          >
            {topCourts.every((c) => c.count === 0) ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <BarChart3 size={28} className="text-rodeo-cream/20" />
                <p className="text-xs text-rodeo-cream/40">Sin reservas en el período</p>
              </div>
            ) : (
              topCourts.map((court, idx) => (
                <div key={court.id} className="flex items-center gap-3">
                  {/* Rank */}
                  <span
                    className="text-xs font-black w-5 text-center shrink-0"
                    style={{
                      color: idx === 0 ? "#C8FF00" : "rgba(225,212,194,0.4)",
                    }}
                  >
                    #{idx + 1}
                  </span>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white truncate">
                        {court.nombre}
                      </span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{
                          background: "rgba(200,255,0,0.1)",
                          border: "1px solid rgba(200,255,0,0.2)",
                          color: "#C8FF00",
                        }}
                      >
                        {DEPORTE_LABELS[court.deporte] ?? court.deporte}
                      </span>
                    </div>
                    {/* Bar */}
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        style={{
                          width: `${(court.count / maxCourtCount) * 100}%`,
                          background: "#C8FF00",
                          height: "100%",
                          borderRadius: "999px",
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>
                  </div>
                  {/* Count */}
                  <span className="text-sm font-black text-rodeo-lime shrink-0">
                    {court.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Ingresos por cancha */}
        <motion.div
          variants={sectionVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40 mb-4">
            Ingresos por cancha (confirmadas)
          </p>
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
            }}
            className="p-5 space-y-3"
          >
            {topIngresosCourts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <DollarSign size={28} className="text-rodeo-cream/20" />
                <p className="text-xs text-rodeo-cream/40">Sin ingresos confirmados en el período</p>
              </div>
            ) : (
              topIngresosCourts.map((court) => (
                <div key={court.id} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-white truncate mr-3">
                      {court.nombre}
                    </span>
                    <span className="text-xs font-black text-rodeo-lime shrink-0">
                      {formatARS(court.ingresos)}
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <div
                      style={{
                        width: `${(court.ingresos / maxIngresos) * 100}%`,
                        background: "rgba(200,255,0,0.7)",
                        height: "100%",
                        borderRadius: "999px",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Reseñas recientes ── */}
      <motion.div
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-xs font-bold tracking-widest uppercase text-rodeo-cream/40 mb-4">
          Reseñas recientes
        </p>
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
          }}
          className="divide-y divide-white/5"
        >
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <MessageSquare size={32} className="text-rodeo-cream/15" />
              <p className="text-sm font-bold text-rodeo-cream/40">Sin reseñas aún</p>
              <p className="text-xs text-rodeo-cream/30 max-w-xs">
                Compartí tu complejo para recibir las primeras reseñas de tus clientes.
              </p>
              <Link
                href="/owner/mi-link"
                style={{
                  background: "rgba(200,255,0,0.1)",
                  border: "1px solid rgba(200,255,0,0.25)",
                  borderRadius: "10px",
                }}
                className="mt-1 px-4 py-2 text-xs font-bold text-rodeo-lime hover:bg-rodeo-lime/20 transition-colors"
              >
                Ver Mi Link / QR
              </Link>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="p-4 flex gap-4">
                {/* Stars */}
                <div className="flex gap-0.5 mt-0.5 shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      className={
                        i < review.estrellas
                          ? "text-amber-400 fill-amber-400"
                          : "text-white/15"
                      }
                    />
                  ))}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  {review.texto ? (
                    <p className="text-sm text-rodeo-cream/80 line-clamp-2 leading-relaxed">
                      {review.texto}
                    </p>
                  ) : (
                    <p className="text-xs text-rodeo-cream/30 italic">Sin comentario</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    {review.court?.nombre && (
                      <span className="text-xs text-rodeo-cream/40 truncate">
                        {review.court.nombre}
                      </span>
                    )}
                    {review.court?.nombre && (
                      <span className="text-rodeo-cream/20 text-xs">·</span>
                    )}
                    <span className="text-xs text-rodeo-cream/30 shrink-0">
                      {timeAgo(review.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

    </div>
  );
}

// ─── KPI Card component ────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  positive: boolean;
  valueColor?: string;
  smallValue?: boolean;
}

function KpiCard({ icon, value, label, positive, valueColor, smallValue }: KpiCardProps) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
      }}
      className="p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: "10px",
          }}
          className="p-2"
        >
          {icon}
        </div>
        {positive && (
          <span
            style={{
              background: "rgba(200,255,0,0.1)",
              border: "1px solid rgba(200,255,0,0.2)",
              borderRadius: "999px",
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-rodeo-lime"
          >
            <TrendingUp size={9} />
            activo
          </span>
        )}
      </div>
      <div>
        <p
          className={`font-black leading-none ${valueColor ?? "text-white"} ${
            smallValue ? "text-lg" : "text-2xl"
          }`}
        >
          {value}
        </p>
        <p className="text-xs text-rodeo-cream/40 mt-1.5">{label}</p>
      </div>
    </div>
  );
}
