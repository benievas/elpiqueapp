"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { supabase, supabaseMut } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";
import { Fragment } from "react";
import { ChevronLeft, Trophy, Users, Calendar, Loader, Share2, MapPin, Radio, UserPlus, X, Plus, Check, QrCode } from "lucide-react";
import QRShareModal from "@/components/QRShareModal";

interface Torneo {
  id: string;
  nombre: string;
  slug: string;
  deporte: string;
  tipo: string;
  descripcion: string | null;
  imagen_url: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  cupos_totales: number;
  cupos_ocupados: number;
  precio_inscripcion: number;
  estado: string;
  complex_id: string;
}

interface Team {
  id: string;
  nombre: string;
  miembros: string[];
  puntos: number;
  posicion: number | null;
}

interface Set { a: number; b: number }

interface Match {
  id: string;
  ronda: number;
  team_a_id: string | null;
  team_b_id: string | null;
  puntaje_a: number | null;
  puntaje_b: number | null;
  sets: Set[] | null;
  estado: string;
  fecha: string | null;
}

interface ComplexInfo {
  nombre: string;
  slug: string;
  ciudad: string | null;
}

const ESTADO_META: Record<string, { color: string; bg: string; label: string }> = {
  registracion: { color: "#4ADE80", bg: "rgba(74,222,128,0.15)",  label: "Inscripción abierta" },
  en_curso:     { color: "#60A5FA", bg: "rgba(96,165,250,0.15)",  label: "En curso" },
  finalizado:   { color: "#94A3B8", bg: "rgba(148,163,184,0.15)", label: "Finalizado" },
};

export default function TorneoPublicoPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { user } = useAuth();

  const [torneo, setTorneo] = useState<Torneo | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [complejo, setComplejo] = useState<ComplexInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveFlash, setLiveFlash] = useState<string | null>(null);

  const [showQR, setShowQR] = useState(false);
  const [showInscripcion, setShowInscripcion] = useState(false);
  const [equipoNombre, setEquipoNombre] = useState("");
  const [miembros, setMiembros] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [inscripcionOk, setInscripcionOk] = useState(false);
  const [inscripcionError, setInscripcionError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) load();
  }, [slug]);

  useEffect(() => {
    if (!torneo) return;

    const channel = supabase
      .channel(`torneo-public-${torneo.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournament_matches", filter: `tournament_id=eq.${torneo.id}` },
        (payload) => {
          setMatches(prev => {
            if (payload.eventType === "INSERT") {
              return [...prev, payload.new as Match].sort((a,b) => a.ronda - b.ronda);
            }
            if (payload.eventType === "UPDATE") {
              const m = payload.new as Match;
              setLiveFlash(m.id);
              setTimeout(() => setLiveFlash(null), 1800);
              return prev.map(x => x.id === m.id ? m : x);
            }
            if (payload.eventType === "DELETE") {
              return prev.filter(x => x.id !== (payload.old as { id: string }).id);
            }
            return prev;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tournaments", filter: `id=eq.${torneo.id}` },
        (payload) => setTorneo(prev => prev ? { ...prev, ...(payload.new as Torneo) } : prev)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournament_teams", filter: `tournament_id=eq.${torneo.id}` },
        () => reloadTeams()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [torneo?.id]);

  async function load() {
    setLoading(true);
    const { data: t } = await supabase.from("tournaments").select("*").eq("slug", slug).single() as { data: Torneo | null };
    if (!t) { setLoading(false); return; }
    setTorneo(t);

    const [teamsRes, matchesRes, complejoRes] = await Promise.all([
      supabase.from("tournament_teams").select("id, nombre, miembros, puntos, posicion").eq("tournament_id", t.id),
      supabase.from("tournament_matches").select("id, ronda, team_a_id, team_b_id, puntaje_a, puntaje_b, sets, estado, fecha").eq("tournament_id", t.id).order("ronda"),
      supabase.from("complexes").select("nombre, slug, ciudad").eq("id", t.complex_id).single(),
    ]);
    setTeams((teamsRes.data || []) as Team[]);
    setMatches((matchesRes.data || []) as Match[]);
    setComplejo(complejoRes.data as ComplexInfo | null);
    setLoading(false);
  }

  async function reloadTeams() {
    if (!torneo) return;
    const { data } = await supabase.from("tournament_teams").select("id, nombre, miembros, puntos, posicion").eq("tournament_id", torneo.id);
    setTeams((data || []) as Team[]);
  }

  function getTeamName(id: string | null) {
    return teams.find(t => t.id === id)?.nombre ?? "TBD";
  }

  function abrirInscripcion() {
    if (!user) {
      router.push(`/login?returnTo=/torneos/${slug}`);
      return;
    }
    setInscripcionError(null);
    setShowInscripcion(true);
  }

  async function inscribirEquipo() {
    if (!torneo || !user) return;
    const nombre = equipoNombre.trim();
    if (!nombre) { setInscripcionError("Poné un nombre de equipo"); return; }
    if (teams.length >= torneo.cupos_totales) { setInscripcionError("No hay cupos disponibles"); return; }

    setSubmitting(true);
    setInscripcionError(null);

    const miembrosLimpio = miembros.map(m => m.trim()).filter(Boolean);

    const { error } = await supabaseMut.from("tournament_teams").insert({
      tournament_id: torneo.id,
      nombre,
      miembros: miembrosLimpio,
      miembros_ids: [user.id],
      puntos: 0,
    });

    if (error) {
      setInscripcionError(error.message || "No se pudo inscribir");
      setSubmitting(false);
      return;
    }

    await supabaseMut.from("tournaments")
      .update({ cupos_ocupados: teams.length + 1 })
      .eq("id", torneo.id);

    fetch("/api/notify/new-tournament-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tournament_id: torneo.id,
        equipo_nombre: nombre,
        capitan_nombre: (user.user_metadata?.nombre_completo as string) || user.email?.split("@")[0] || "Jugador",
        capitan_email: user.email || "",
        miembros: miembrosLimpio,
      }),
    }).catch(() => { /* silencioso */ });

    setInscripcionOk(true);
    setSubmitting(false);
    setTimeout(() => {
      setShowInscripcion(false);
      setInscripcionOk(false);
      setEquipoNombre("");
      setMiembros([""]);
    }, 1600);
  }

  async function compartir() {
    if (!torneo) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: torneo.nombre,
      text: `Mirá el torneo "${torneo.nombre}" en MatchPro`,
      url,
    };
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }).share) {
      try { await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share(shareData); return; } catch { /* ignored */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      alert("Enlace copiado al portapapeles");
    } catch {
      alert(url);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-rodeo-dark">
        <Loader className="animate-spin text-rodeo-lime" size={32} />
      </div>
    );
  }
  if (!torneo) {
    return (
      <div className="min-h-screen bg-rodeo-dark flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-rodeo-cream/70">Torneo no encontrado</p>
          <Link href="/torneos" className="text-rodeo-lime underline text-sm">Volver a torneos</Link>
        </div>
      </div>
    );
  }

  const rondas = Array.from(new Set(matches.map(m => m.ronda))).sort((a,b) => a-b);
  const est = ESTADO_META[torneo.estado] ?? ESTADO_META.registracion;
  const standings = [...teams].sort((a,b) => (b.puntos || 0) - (a.puntos || 0));

  return (
    <div className="min-h-screen bg-gradient-to-b from-rodeo-dark via-rodeo-brown to-rodeo-dark pb-24 md:pb-12">
      {/* Hero */}
      <div className="relative">
        {torneo.imagen_url && (
          <div className="absolute inset-0 h-72 overflow-hidden">
            <img src={torneo.imagen_url} alt={torneo.nombre} className="w-full h-full object-cover opacity-30"/>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rodeo-dark/60 to-rodeo-dark"/>
          </div>
        )}
        <div className="relative max-w-5xl mx-auto px-6 pt-8 pb-10">
          <div className="flex items-center justify-between">
            <Link href="/torneos"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px" }}
              className="w-10 h-10 flex items-center justify-center hover:bg-white/15 transition-all">
              <ChevronLeft size={20} className="text-white" />
            </Link>
            <div className="flex items-center gap-2">
              {torneo.estado === "registracion" && teams.length < torneo.cupos_totales && (
                <button onClick={abrirInscripcion}
                  style={{ background: "rgba(200,255,0,0.9)", borderRadius: "12px" }}
                  className="flex items-center gap-2 px-4 py-2 hover:brightness-110 transition-all text-rodeo-dark text-xs font-black">
                  <UserPlus size={14} /> Inscribirme
                </button>
              )}
              <button onClick={() => setShowQR(true)}
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px" }}
                className="w-10 h-10 flex items-center justify-center hover:bg-white/15 transition-all text-rodeo-cream/80 hover:text-rodeo-lime"
                title="Código QR">
                <QrCode size={16} />
              </button>
              <button onClick={compartir}
                style={{ background: "rgba(200,255,0,0.12)", border: "1px solid rgba(200,255,0,0.25)", borderRadius: "12px" }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-rodeo-lime/20 transition-all text-rodeo-lime text-xs font-bold">
                <Share2 size={14} /> Compartir
              </button>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black px-2.5 py-1 rounded-full" style={{ background: est.bg, color: est.color }}>
                {torneo.estado === "en_curso" && <Radio size={10} className="inline animate-pulse mr-1"/>}
                {est.label}
              </span>
              <span className="text-xs font-bold text-rodeo-cream/60">{torneo.deporte.toUpperCase()}</span>
              <span className="text-xs text-rodeo-cream/40">·</span>
              <span className="text-xs text-rodeo-cream/40 uppercase">{torneo.tipo}</span>
            </div>
            <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95, fontSize: "clamp(40px, 7vw, 72px)" }} className="text-white">
              <span className="section-slash">/</span>{torneo.nombre}
            </h1>
            {complejo && (
              <Link href={`/complejo/${complejo.slug}`} className="inline-flex items-center gap-2 text-sm text-rodeo-cream/70 hover:text-rodeo-lime transition-colors">
                <MapPin size={14}/> {complejo.nombre}{complejo.ciudad ? ` · ${complejo.ciudad}` : ""}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 space-y-8">
        {/* Info principal */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InfoCard label="Inicio" value={new Date(torneo.fecha_inicio).toLocaleDateString("es-AR", { day:"numeric", month:"short", year:"numeric" })} icon={<Calendar size={14}/>}/>
          <InfoCard label="Equipos" value={`${teams.length}/${torneo.cupos_totales}`} icon={<Users size={14}/>}/>
          <InfoCard label="Partidos" value={String(matches.length)} icon={<Trophy size={14}/>}/>
          <InfoCard label="Inscripción" value={torneo.precio_inscripcion > 0 ? `$${torneo.precio_inscripcion.toLocaleString("es-AR")}` : "Gratis"}/>
        </div>

        {torneo.descripcion && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px" }}
            className="p-6">
            <p className="text-rodeo-cream/80 text-sm leading-relaxed whitespace-pre-wrap">{torneo.descripcion}</p>
          </motion.div>
        )}

        {/* BRACKET / PARTIDOS */}
        {matches.length > 0 && (
          <div className="space-y-5">
            <h2 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "28px", textTransform: "uppercase", letterSpacing: "-0.02em" }} className="text-white">
              <span className="section-slash">/</span>Resultados
            </h2>

            {/* Desktop: bracket con líneas de conexión */}
            <div className="hidden md:block overflow-x-auto pb-4">
              <BracketDesktop rondas={rondas} matches={matches} liveFlash={liveFlash} getTeamName={getTeamName} />
            </div>

            {/* Mobile: vertical stacked */}
            <div className="flex flex-col md:hidden gap-5">
              {rondas.map((ronda, idx) => {
                const rondaMatches = matches.filter(m => m.ronda === ronda);
                const label = getRondaLabel(ronda, rondas);
                const isFinal = idx === rondas.length - 1;
                const isSemi = idx === rondas.length - 2 && rondas.length >= 3;
                return (
                  <div key={ronda} className="md:min-w-[280px] md:flex-shrink-0 space-y-3">
                    {/* Round header */}
                    <div className="flex items-center gap-2">
                      <div className={`h-px flex-1 ${isFinal ? "bg-rodeo-lime/40" : isSemi ? "bg-blue-400/30" : "bg-white/10"}`}/>
                      <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap ${
                        isFinal ? "bg-rodeo-lime/15 text-rodeo-lime" :
                        isSemi ? "bg-blue-400/10 text-blue-400" :
                        "bg-white/5 text-rodeo-cream/50"
                      }`}>
                        {label}
                      </span>
                      <div className={`h-px flex-1 ${isFinal ? "bg-rodeo-lime/40" : isSemi ? "bg-blue-400/30" : "bg-white/10"}`}/>
                    </div>

                    {/* Match cards */}
                    <div className="space-y-3">
                      {rondaMatches.map(m => {
                        const finalizado = m.estado === "finalizado";
                        const enJuego = m.estado === "en_juego";
                        const flash = liveFlash === m.id;
                        const ganadorA = finalizado && m.puntaje_a != null && m.puntaje_b != null && m.puntaje_a > m.puntaje_b;
                        const ganadorB = finalizado && m.puntaje_a != null && m.puntaje_b != null && m.puntaje_b > m.puntaje_a;
                        const scoreA = m.puntaje_a ?? null;
                        const scoreB = m.puntaje_b ?? null;

                        return (
                          <motion.div key={m.id}
                            animate={flash ? {
                              scale: [1, 1.02, 1],
                              boxShadow: ["0 0 0 rgba(200,255,0,0)", "0 0 24px rgba(200,255,0,0.4)", "0 0 0 rgba(200,255,0,0)"]
                            } : {}}
                            transition={{ duration: 1.3 }}
                            style={{
                              background: enJuego ? "rgba(96,165,250,0.05)" : "rgba(255,255,255,0.04)",
                              border: `1px solid ${enJuego ? "rgba(96,165,250,0.35)" : isFinal ? "rgba(200,255,0,0.15)" : "rgba(255,255,255,0.08)"}`,
                              borderRadius: "16px",
                              overflow: "hidden",
                            }}>

                            {/* Live badge */}
                            {enJuego && (
                              <div className="px-4 pt-2.5 pb-1 flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute h-full w-full rounded-full bg-blue-400 opacity-75"/>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"/>
                                </span>
                                <span className="text-[10px] font-black text-blue-400 tracking-widest">EN VIVO</span>
                              </div>
                            )}

                            {/* Team A row */}
                            <div className={`px-4 py-3 flex items-center justify-between gap-3 ${ganadorA ? "bg-[rgba(200,255,0,0.08)]" : ""}`}>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {ganadorA && <Trophy size={11} className="text-rodeo-lime flex-shrink-0"/>}
                                <p className={`text-sm font-bold truncate ${ganadorA ? "text-rodeo-lime" : "text-white"}`}>
                                  {getTeamName(m.team_a_id)}
                                </p>
                              </div>
                              <span className={`text-2xl font-black tabular-nums w-9 text-right leading-none ${ganadorA ? "text-rodeo-lime" : "text-rodeo-cream/60"}`}>
                                {scoreA !== null ? scoreA : <span className="text-base text-rodeo-cream/25">—</span>}
                              </span>
                            </div>

                            {/* VS separator */}
                            <div className="mx-4 flex items-center gap-2">
                              <div className="flex-1 border-t border-white/8"/>
                              <span className="text-[9px] font-black text-rodeo-cream/20 tracking-widest">VS</span>
                              <div className="flex-1 border-t border-white/8"/>
                            </div>

                            {/* Team B row */}
                            <div className={`px-4 py-3 flex items-center justify-between gap-3 ${ganadorB ? "bg-[rgba(200,255,0,0.08)]" : ""}`}>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {ganadorB && <Trophy size={11} className="text-rodeo-lime flex-shrink-0"/>}
                                <p className={`text-sm font-bold truncate ${ganadorB ? "text-rodeo-lime" : "text-white"}`}>
                                  {getTeamName(m.team_b_id)}
                                </p>
                              </div>
                              <span className={`text-2xl font-black tabular-nums w-9 text-right leading-none ${ganadorB ? "text-rodeo-lime" : "text-rodeo-cream/60"}`}>
                                {scoreB !== null ? scoreB : <span className="text-base text-rodeo-cream/25">—</span>}
                              </span>
                            </div>

                            {/* Sets */}
                            {m.sets && m.sets.length > 0 && (
                              <div className="px-4 pb-2.5 pt-1 border-t border-white/5">
                                <p className="text-[10px] font-bold tabular-nums text-rodeo-cream/35">
                                  Sets: {m.sets.map(s => `${s.a}-${s.b}`).join(" · ")}
                                </p>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EQUIPOS / STANDINGS */}
        {teams.length > 0 && (
          <div className="space-y-4">
            <h2 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "28px", textTransform: "uppercase", letterSpacing: "-0.02em" }} className="text-white">
              <span className="section-slash">/</span>Equipos
            </h2>
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px" }} className="p-4">
              <div className="space-y-1">
                {standings.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-[11px] font-black text-rodeo-cream/40 w-6">{i+1}</span>
                    <p className="text-sm text-white flex-1 truncate">{t.nombre}</p>
                    {t.puntos > 0 && <span className="text-xs font-black text-rodeo-lime">{t.puntos} pts</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {matches.length === 0 && teams.length === 0 && (
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px" }} className="p-12 text-center">
            <Trophy size={32} className="mx-auto text-rodeo-cream/30 mb-3"/>
            <p className="text-rodeo-cream/60 text-sm">Aún no hay equipos inscritos</p>
            {torneo.estado === "registracion" && teams.length < torneo.cupos_totales && (
              <button onClick={abrirInscripcion}
                style={{ background: "rgba(200,255,0,0.9)", borderRadius: "12px" }}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-rodeo-dark text-sm font-black hover:brightness-110 transition-all">
                <UserPlus size={14}/> Ser el primero en inscribirse
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODAL INSCRIPCIÓN */}
      <AnimatePresence>
        {showInscripcion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !submitting && !inscripcionOk && setShowInscripcion(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: "#1A120B", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px" }}
              className="w-full max-w-md p-6 my-8">
              {inscripcionOk ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-rodeo-lime/20 flex items-center justify-center">
                    <Check size={28} className="text-rodeo-lime"/>
                  </div>
                  <h3 className="text-xl font-black text-white">¡Equipo inscrito!</h3>
                  <p className="text-sm text-rodeo-cream/60">El dueño del complejo fue notificado.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-[11px] font-black text-rodeo-lime uppercase tracking-widest mb-1">Inscripción</p>
                      <h3 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "26px", letterSpacing: "-0.01em", textTransform: "uppercase", lineHeight: 1 }} className="text-white">
                        {torneo?.nombre}
                      </h3>
                    </div>
                    <button onClick={() => setShowInscripcion(false)} className="p-2 hover:bg-white/5 rounded-lg text-rodeo-cream/50">
                      <X size={18}/>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-black text-rodeo-cream/60 uppercase tracking-wide mb-1.5">Nombre del equipo</label>
                      <input
                        value={equipoNombre}
                        onChange={(e) => setEquipoNombre(e.target.value)}
                        placeholder="Ej: Los Pumas"
                        maxLength={40}
                        style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"10px", color:"#E1D4C2" }}
                        className="w-full px-3 py-2.5 text-sm placeholder:text-rodeo-cream/25 outline-none focus:border-rodeo-lime/40"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-rodeo-cream/60 uppercase tracking-wide mb-1.5">Miembros (opcional)</label>
                      <div className="space-y-2">
                        {miembros.map((m, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              value={m}
                              onChange={(e) => {
                                const next = [...miembros];
                                next[i] = e.target.value;
                                setMiembros(next);
                              }}
                              placeholder={`Jugador ${i + 1}`}
                              maxLength={60}
                              style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"10px", color:"#E1D4C2" }}
                              className="flex-1 px-3 py-2 text-sm placeholder:text-rodeo-cream/25 outline-none focus:border-rodeo-lime/40"
                            />
                            {miembros.length > 1 && (
                              <button
                                onClick={() => setMiembros(miembros.filter((_, idx) => idx !== i))}
                                className="p-2 rounded-lg text-rodeo-cream/40 hover:text-red-400 hover:bg-white/5">
                                <X size={14}/>
                              </button>
                            )}
                          </div>
                        ))}
                        {miembros.length < 10 && (
                          <button
                            onClick={() => setMiembros([...miembros, ""])}
                            className="flex items-center gap-1 text-[11px] font-bold text-rodeo-lime hover:underline">
                            <Plus size={12}/> Agregar jugador
                          </button>
                        )}
                      </div>
                    </div>

                    {inscripcionError && (
                      <p className="text-xs text-red-400">{inscripcionError}</p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setShowInscripcion(false)}
                        disabled={submitting}
                        style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"10px" }}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-rodeo-cream/70 disabled:opacity-50">
                        Cancelar
                      </button>
                      <button
                        onClick={inscribirEquipo}
                        disabled={submitting || !equipoNombre.trim()}
                        style={{ background: "rgba(200,255,0,0.9)", borderRadius:"10px" }}
                        className="flex-1 px-4 py-2.5 text-sm font-black text-rodeo-dark disabled:opacity-50 flex items-center justify-center gap-2">
                        {submitting ? <Loader size={14} className="animate-spin"/> : <Check size={14}/>}
                        {submitting ? "Inscribiendo..." : "Confirmar inscripción"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <QRShareModal
        open={showQR}
        onClose={() => setShowQR(false)}
        url={typeof window !== "undefined" ? window.location.href : ""}
        title={torneo.nombre}
        subtitle={complejo?.nombre || undefined}
      />
    </div>
  );
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"12px" }} className="p-4">
      <div className="flex items-center gap-1.5 text-rodeo-cream/40 mb-1.5">
        {icon}
        <p className="text-[10px] uppercase tracking-wide font-bold">{label}</p>
      </div>
      <p className="text-base font-black text-white">{value}</p>
    </div>
  );
}

const SLOT_H = 90; // px per base slot

function BracketDesktop({ rondas, matches, liveFlash, getTeamName }: {
  rondas: number[];
  matches: Match[];
  liveFlash: string | null;
  getTeamName: (id: string | null) => string;
}) {
  const lastIdx = rondas.length - 1;
  const finalMatches = matches.filter(m => m.ronda === rondas[lastIdx]);
  const finalMatch = finalMatches[0];
  const winnerTeam = finalMatch?.estado === "finalizado" && finalMatch.puntaje_a != null && finalMatch.puntaje_b != null
    ? (finalMatch.puntaje_a >= finalMatch.puntaje_b ? getTeamName(finalMatch.team_a_id) : getTeamName(finalMatch.team_b_id))
    : null;

  return (
    <div className="flex items-start gap-0" style={{ minWidth: rondas.length * 312 + (winnerTeam ? 180 : 0) }}>
      {rondas.map((ronda, roundIdx) => {
        const slotH = SLOT_H * Math.pow(2, roundIdx);
        const isLast = roundIdx === lastIdx;
        const roundMatches = matches.filter(m => m.ronda === ronda);
        const label = getRondaLabel(ronda, rondas);
        const isFinal = isLast;
        const isSemi = roundIdx === lastIdx - 1 && rondas.length >= 3;

        // Group into pairs for connector lines
        const pairs: Match[][] = [];
        for (let i = 0; i < roundMatches.length; i += 2) pairs.push(roundMatches.slice(i, i + 2));

        return (
          <Fragment key={ronda}>
            {/* Round column */}
            <div style={{ width: 288, flexShrink: 0 }}>
              {/* Header */}
              <div className="h-10 flex items-center justify-center mb-1">
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                  isFinal ? "bg-rodeo-lime/15 text-rodeo-lime" :
                  isSemi ? "bg-blue-400/10 text-blue-400" :
                  "bg-white/5 text-rodeo-cream/40"
                }`}>{label}</span>
              </div>
              {/* Match slots */}
              {roundMatches.map(m => {
                const finalizado = m.estado === "finalizado";
                const enJuego = m.estado === "en_juego";
                const flash = liveFlash === m.id;
                const gA = finalizado && m.puntaje_a != null && m.puntaje_b != null && m.puntaje_a > m.puntaje_b;
                const gB = finalizado && m.puntaje_a != null && m.puntaje_b != null && m.puntaje_b > m.puntaje_a;
                return (
                  <div key={m.id} style={{ height: slotH }} className="flex items-center px-2 py-1.5">
                    <motion.div className="w-full overflow-hidden"
                      animate={flash ? { scale: [1, 1.02, 1], boxShadow: ["0 0 0 rgba(200,255,0,0)", "0 0 20px rgba(200,255,0,0.45)", "0 0 0 rgba(200,255,0,0)"] } : {}}
                      transition={{ duration: 1.3 }}
                      style={{ background: enJuego ? "rgba(96,165,250,0.05)" : "rgba(255,255,255,0.04)", border: `1px solid ${isFinal ? "rgba(200,255,0,0.2)" : enJuego ? "rgba(96,165,250,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 12 }}>
                      {enJuego && (
                        <div className="px-3 pt-2 pb-0 flex items-center gap-1.5">
                          <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute h-full w-full rounded-full bg-blue-400 opacity-75"/><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-400"/></span>
                          <span className="text-[9px] font-black text-blue-400 tracking-widest">EN VIVO</span>
                        </div>
                      )}
                      {/* Team A */}
                      <div className={`px-3 py-2 flex items-center justify-between gap-2 ${gA ? "bg-[rgba(200,255,0,0.08)]" : ""}`}>
                        <p className={`text-xs font-bold truncate flex-1 ${gA ? "text-rodeo-lime" : "text-white/90"}`}>
                          {gA && <Trophy size={9} className="inline mr-1 text-rodeo-lime" />}{getTeamName(m.team_a_id)}
                        </p>
                        <span className={`text-base font-black tabular-nums min-w-[20px] text-right ${gA ? "text-rodeo-lime" : "text-rodeo-cream/50"}`}>
                          {m.puntaje_a ?? "—"}
                        </span>
                      </div>
                      <div className="mx-3 border-t border-white/6" />
                      {/* Team B */}
                      <div className={`px-3 py-2 flex items-center justify-between gap-2 ${gB ? "bg-[rgba(200,255,0,0.08)]" : ""}`}>
                        <p className={`text-xs font-bold truncate flex-1 ${gB ? "text-rodeo-lime" : "text-white/90"}`}>
                          {gB && <Trophy size={9} className="inline mr-1 text-rodeo-lime" />}{getTeamName(m.team_b_id)}
                        </p>
                        <span className={`text-base font-black tabular-nums min-w-[20px] text-right ${gB ? "text-rodeo-lime" : "text-rodeo-cream/50"}`}>
                          {m.puntaje_b ?? "—"}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>

            {/* Connector column */}
            {!isLast && (
              <div style={{ width: 24, flexShrink: 0 }}>
                <div style={{ height: 44 }} />
                {pairs.map((_, pairIdx) => {
                  const pairH = slotH * 2;
                  return (
                    <div key={pairIdx} style={{ height: pairH, position: "relative" }}>
                      {/* Top arm */}
                      <div style={{ position: "absolute", top: slotH / 2, left: 0, width: "60%", height: slotH / 2, borderTop: "1px solid rgba(255,255,255,0.13)", borderRight: "1px solid rgba(255,255,255,0.13)" }} />
                      {/* Bottom arm */}
                      <div style={{ position: "absolute", bottom: slotH / 2, left: 0, width: "60%", height: slotH / 2, borderBottom: "1px solid rgba(255,255,255,0.13)", borderRight: "1px solid rgba(255,255,255,0.13)" }} />
                      {/* Middle horizontal */}
                      <div style={{ position: "absolute", top: slotH - 0.5, left: "60%", right: 0, borderTop: "1px solid rgba(255,255,255,0.13)" }} />
                    </div>
                  );
                })}
                {/* Lone match (odd count) */}
                {roundMatches.length % 2 === 1 && (
                  <div style={{ height: slotH, position: "relative" }}>
                    <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderTop: "1px solid rgba(255,255,255,0.13)" }} />
                  </div>
                )}
              </div>
            )}
          </Fragment>
        );
      })}

      {/* Winner trophy */}
      {winnerTeam && (
        <div style={{ width: 160, flexShrink: 0 }} className="flex flex-col">
          <div style={{ height: 44 }} />
          <div style={{ height: SLOT_H * Math.pow(2, rondas.length - 1) }} className="flex items-center justify-center px-2">
            <div className="flex flex-col items-center gap-2 p-4 text-center w-full"
              style={{ background: "rgba(200,255,0,0.08)", border: "1px solid rgba(200,255,0,0.35)", borderRadius: 14 }}>
              <Trophy size={28} className="text-rodeo-lime" />
              <p className="text-[9px] font-black text-rodeo-cream/40 uppercase tracking-widest">Campeón</p>
              <p className="text-sm font-black text-rodeo-lime leading-tight text-center">{winnerTeam}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getRondaLabel(ronda: number, rondas: number[]): string {
  const idx = rondas.indexOf(ronda);
  const fromEnd = rondas.length - 1 - idx;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1 && rondas.length >= 3) return "Semifinal";
  if (fromEnd === 2 && rondas.length >= 4) return "Cuartos de Final";
  return `Ronda ${ronda}`;
}
