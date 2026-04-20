"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase, supabaseMut } from "@/lib/supabase";
import { ChevronLeft, Trophy, Users, Calendar, Loader, Plus, X, Check, Trash2, Play, Flag, ExternalLink, RefreshCw } from "lucide-react";

interface Torneo {
  id: string;
  nombre: string;
  slug: string;
  deporte: string;
  tipo: string;
  descripcion: string | null;
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

interface Match {
  id: string;
  ronda: number;
  team_a_id: string | null;
  team_b_id: string | null;
  puntaje_a: number | null;
  puntaje_b: number | null;
  estado: string;
  fecha: string | null;
}

const ESTADO_TORNEO: Record<string, { color: string; bg: string; label: string }> = {
  registracion: { color: "#4ADE80", bg: "rgba(74,222,128,0.12)",  label: "Inscripción abierta" },
  en_curso:     { color: "#60A5FA", bg: "rgba(96,165,250,0.12)",  label: "En curso" },
  finalizado:   { color: "#94A3B8", bg: "rgba(148,163,184,0.12)", label: "Finalizado" },
};

export default function OwnerTorneoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { user } = useAuth();
  const [torneo, setTorneo] = useState<Torneo | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState("");
  const [addingTeam, setAddingTeam] = useState(false);
  const [savingMatch, setSavingMatch] = useState<string | null>(null);
  const [changingEstado, setChangingEstado] = useState(false);

  useEffect(() => { if (slug) load(); }, [slug]);

  async function load() {
    setLoading(true);
    const { data: t } = await supabase.from("tournaments").select("*").eq("slug", slug).single() as { data: Torneo | null };
    if (!t) { setLoading(false); return; }
    setTorneo(t);
    const [teamsRes, matchesRes] = await Promise.all([
      supabase.from("tournament_teams").select("id, nombre, miembros, puntos, posicion").eq("tournament_id", t.id).order("created_at"),
      supabase.from("tournament_matches").select("id, ronda, team_a_id, team_b_id, puntaje_a, puntaje_b, estado, fecha").eq("tournament_id", t.id).order("ronda").order("created_at"),
    ]);
    setTeams((teamsRes.data || []) as Team[]);
    setMatches((matchesRes.data || []) as Match[]);
    setLoading(false);
  }

  async function addTeam() {
    if (!newTeamName.trim() || !torneo) return;
    setAddingTeam(true);
    const { error } = await supabaseMut.from("tournament_teams").insert({
      tournament_id: torneo.id,
      nombre: newTeamName.trim(),
      miembros: [],
      miembros_ids: [],
      puntos: 0,
    });
    if (!error) {
      await supabaseMut.from("tournaments").update({ cupos_ocupados: teams.length + 1 }).eq("id", torneo.id);
      setNewTeamName("");
      await load();
    }
    setAddingTeam(false);
  }

  async function deleteTeam(id: string) {
    if (!confirm("¿Eliminar este equipo?") || !torneo) return;
    await supabaseMut.from("tournament_teams").delete().eq("id", id);
    await supabaseMut.from("tournaments").update({ cupos_ocupados: Math.max(0, teams.length - 1) }).eq("id", torneo.id);
    await load();
  }

  function getTeamName(id: string | null) {
    return teams.find(t => t.id === id)?.nombre ?? "TBD";
  }

  async function cambiarEstado(nuevoEstado: string) {
    if (!torneo) return;
    setChangingEstado(true);
    if (nuevoEstado === "en_curso" && matches.length === 0 && teams.length >= 2) {
      await generarPrimeraRonda();
    }
    await supabaseMut.from("tournaments").update({ estado: nuevoEstado }).eq("id", torneo.id);
    await load();
    setChangingEstado(false);
  }

  async function generarPrimeraRonda() {
    if (!torneo) return;
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const rows = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      rows.push({
        tournament_id: torneo.id,
        ronda: 1,
        team_a_id: shuffled[i]?.id ?? null,
        team_b_id: shuffled[i+1]?.id ?? null,
        estado: "pendiente",
      });
    }
    if (rows.length) await supabaseMut.from("tournament_matches").insert(rows);
  }

  async function agregarRonda() {
    if (!torneo) return;
    const ultimaRonda = Math.max(0, ...matches.map(m => m.ronda));
    const ganadoresUltima = matches
      .filter(m => m.ronda === ultimaRonda && m.estado === "finalizado")
      .map(m => {
        if (m.puntaje_a != null && m.puntaje_b != null) {
          return m.puntaje_a > m.puntaje_b ? m.team_a_id : m.team_b_id;
        }
        return null;
      })
      .filter(Boolean) as string[];

    if (ganadoresUltima.length < 2) { alert("No hay suficientes ganadores en la última ronda."); return; }

    const rows = [];
    for (let i = 0; i < ganadoresUltima.length; i += 2) {
      rows.push({
        tournament_id: torneo.id,
        ronda: ultimaRonda + 1,
        team_a_id: ganadoresUltima[i] ?? null,
        team_b_id: ganadoresUltima[i+1] ?? null,
        estado: "pendiente",
      });
    }
    await supabaseMut.from("tournament_matches").insert(rows);
    await load();
  }

  async function guardarMatch(m: Match, puntaje_a: number, puntaje_b: number, finalizar: boolean) {
    setSavingMatch(m.id);
    await supabaseMut.from("tournament_matches").update({
      puntaje_a, puntaje_b,
      estado: finalizar ? "finalizado" : "en_juego",
    }).eq("id", m.id);
    setMatches(prev => prev.map(x => x.id === m.id ? { ...x, puntaje_a, puntaje_b, estado: finalizar ? "finalizado" : "en_juego" } : x));
    setSavingMatch(null);
  }

  if (loading) return <div className="flex justify-center py-12"><Loader className="animate-spin text-rodeo-lime" size={32}/></div>;
  if (!torneo) return <div className="text-center py-12 text-rodeo-cream/50">Torneo no encontrado</div>;

  const rondas = Array.from(new Set(matches.map(m => m.ronda))).sort((a,b) => a-b);
  const est = ESTADO_TORNEO[torneo.estado] ?? ESTADO_TORNEO.registracion;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/owner/torneos" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
          <ChevronLeft size={20} className="text-rodeo-cream/50" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: est.bg, color: est.color }}>{est.label}</span>
            <span className="text-xs text-rodeo-cream/40">{torneo.deporte.toUpperCase()}</span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif", fontWeight: 900, fontSize: "32px", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 0.95 }} className="text-white mt-1">{torneo.nombre}</h1>
        </div>
        <a href={`/torneos/${torneo.slug}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rodeo-cream/60 hover:text-rodeo-lime"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}>
          <ExternalLink size={13} /> Vista pública
        </a>
      </div>

      {/* Acciones estado */}
      <div className="flex gap-2 flex-wrap">
        {torneo.estado === "registracion" && teams.length >= 2 && (
          <button onClick={() => cambiarEstado("en_curso")} disabled={changingEstado}
            style={{ background: "rgba(96,165,250,0.9)", borderRadius: "10px" }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black text-rodeo-dark disabled:opacity-50">
            {changingEstado ? <Loader size={12} className="animate-spin"/> : <Play size={12}/>}
            Iniciar torneo (genera llaves)
          </button>
        )}
        {torneo.estado === "en_curso" && (
          <button onClick={() => cambiarEstado("finalizado")} disabled={changingEstado}
            style={{ background: "rgba(255,255,255,0.08)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.12)" }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-rodeo-cream/70 disabled:opacity-50">
            {changingEstado ? <Loader size={12} className="animate-spin"/> : <Flag size={12}/>}
            Finalizar torneo
          </button>
        )}
      </div>

      {/* Stats resumen */}
      <div className="grid grid-cols-3 gap-3">
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"12px" }} className="p-4">
          <p className="text-[10px] text-rodeo-cream/40 uppercase tracking-wide">Equipos</p>
          <p className="text-xl font-black text-white">{teams.length}<span className="text-sm text-rodeo-cream/40">/{torneo.cupos_totales}</span></p>
        </div>
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"12px" }} className="p-4">
          <p className="text-[10px] text-rodeo-cream/40 uppercase tracking-wide">Partidos</p>
          <p className="text-xl font-black text-white">{matches.length}</p>
        </div>
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"12px" }} className="p-4">
          <p className="text-[10px] text-rodeo-cream/40 uppercase tracking-wide">Inicio</p>
          <p className="text-sm font-bold text-white">{new Date(torneo.fecha_inicio).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}</p>
        </div>
      </div>

      {/* EQUIPOS */}
      <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px" }} className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-white uppercase tracking-wide">Equipos</p>
          <button onClick={load} className="text-rodeo-cream/40 hover:text-rodeo-lime"><RefreshCw size={12}/></button>
        </div>

        {torneo.estado === "registracion" && (
          <div className="flex gap-2">
            <input value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
              placeholder="Nombre del equipo" onKeyDown={e => e.key === "Enter" && addTeam()}
              style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"10px", color:"#E1D4C2" }}
              className="flex-1 px-3 py-2 text-sm placeholder:text-rodeo-cream/25 outline-none" />
            <button onClick={addTeam} disabled={addingTeam || !newTeamName.trim()}
              style={{ background:"rgba(200,255,0,0.9)", borderRadius:"10px" }}
              className="px-4 py-2 text-sm font-black text-rodeo-dark disabled:opacity-40 flex items-center gap-1">
              {addingTeam ? <Loader size={12} className="animate-spin"/> : <Plus size={12}/>}
            </button>
          </div>
        )}

        {teams.length === 0 ? (
          <p className="text-rodeo-cream/30 text-xs text-center py-4">Sin equipos inscritos</p>
        ) : (
          <div className="space-y-1">
            {teams.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/3">
                <span className="text-[10px] font-black text-rodeo-cream/30 w-5">{i+1}</span>
                <p className="text-sm text-white flex-1 truncate">{t.nombre}</p>
                {torneo.estado === "registracion" && (
                  <button onClick={() => deleteTeam(t.id)} className="p-1.5 text-rodeo-cream/30 hover:text-red-400">
                    <Trash2 size={12}/>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PARTIDOS (bracket simple por ronda) */}
      {matches.length > 0 && (
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px" }} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-white uppercase tracking-wide">Partidos</p>
            {torneo.estado === "en_curso" && (
              <button onClick={agregarRonda} className="text-[11px] font-bold text-rodeo-lime hover:underline flex items-center gap-1">
                <Plus size={12}/> Siguiente ronda
              </button>
            )}
          </div>

          <div className="space-y-6">
            {rondas.map(ronda => (
              <div key={ronda} className="space-y-2">
                <p className="text-[11px] font-black text-rodeo-lime uppercase tracking-widest">Ronda {ronda}</p>
                <div className="space-y-2">
                  {matches.filter(m => m.ronda === ronda).map(m => (
                    <MatchRow key={m.id} m={m} teamA={getTeamName(m.team_a_id)} teamB={getTeamName(m.team_b_id)}
                      saving={savingMatch === m.id} onSave={guardarMatch}
                      editable={torneo.estado === "en_curso"} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MatchRow({ m, teamA, teamB, saving, onSave, editable }: {
  m: Match; teamA: string; teamB: string; saving: boolean;
  onSave: (m: Match, a: number, b: number, finalizar: boolean) => void;
  editable: boolean;
}) {
  const [a, setA] = useState<string>(m.puntaje_a?.toString() ?? "");
  const [b, setB] = useState<string>(m.puntaje_b?.toString() ?? "");
  const finalizado = m.estado === "finalizado";
  const ganadorA = finalizado && m.puntaje_a != null && m.puntaje_b != null && m.puntaje_a > m.puntaje_b;
  const ganadorB = finalizado && m.puntaje_a != null && m.puntaje_b != null && m.puntaje_b > m.puntaje_a;

  return (
    <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"10px" }} className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <p className={`text-sm truncate ${ganadorA ? "text-rodeo-lime font-bold" : "text-white"}`}>{teamA}</p>
          {editable && !finalizado ? (
            <div className="flex items-center gap-1">
              <input type="number" value={a} onChange={e => setA(e.target.value)} placeholder="0"
                className="w-10 text-center text-sm bg-white/5 border border-white/10 rounded px-1 py-1 outline-none text-white"/>
              <span className="text-rodeo-cream/40">-</span>
              <input type="number" value={b} onChange={e => setB(e.target.value)} placeholder="0"
                className="w-10 text-center text-sm bg-white/5 border border-white/10 rounded px-1 py-1 outline-none text-white"/>
            </div>
          ) : (
            <p className="text-sm font-black text-center min-w-[60px]" style={{ color: finalizado ? "#C8FF00" : "#94A3B8" }}>
              {m.puntaje_a != null ? `${m.puntaje_a} - ${m.puntaje_b}` : "—"}
            </p>
          )}
          <p className={`text-sm truncate text-right ${ganadorB ? "text-rodeo-lime font-bold" : "text-white"}`}>{teamB}</p>
        </div>
        {editable && !finalizado && (
          <div className="flex gap-1">
            <button onClick={() => onSave(m, parseInt(a) || 0, parseInt(b) || 0, false)} disabled={saving}
              className="p-1.5 rounded bg-blue-400/10 hover:bg-blue-400/20 text-blue-400" title="Guardar parcial">
              {saving ? <Loader size={11} className="animate-spin"/> : <Play size={11}/>}
            </button>
            <button onClick={() => onSave(m, parseInt(a) || 0, parseInt(b) || 0, true)} disabled={saving || !a || !b}
              className="p-1.5 rounded bg-green-400/10 hover:bg-green-400/20 text-green-400 disabled:opacity-40" title="Finalizar">
              <Check size={11}/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
