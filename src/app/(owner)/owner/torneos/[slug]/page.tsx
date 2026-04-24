"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase, supabaseMut } from "@/lib/supabase";
import { ChevronLeft, Trophy, Users, Calendar, Loader, Plus, X, Check, Trash2, Play, Flag, ExternalLink, RefreshCw, Pencil, Save } from "lucide-react";

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

const DEPORTES_SETS = new Set(["tenis", "padel", "voley"]);

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
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ nombre: "", descripcion: "", fecha_inicio: "", fecha_fin: "", cupos_totales: 0, precio_inscripcion: 0, imagen_url: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => { if (slug) load(); }, [slug]);

  async function load() {
    setLoading(true);
    const { data: t } = await supabase.from("tournaments").select("*").eq("slug", slug).single() as { data: Torneo | null };
    if (!t) { setLoading(false); return; }
    setTorneo(t);
    const [teamsRes, matchesRes] = await Promise.all([
      supabase.from("tournament_teams").select("id, nombre, miembros, puntos, posicion").eq("tournament_id", t.id).order("created_at"),
      supabase.from("tournament_matches").select("id, ronda, team_a_id, team_b_id, puntaje_a, puntaje_b, sets, estado, fecha").eq("tournament_id", t.id).order("ronda").order("created_at"),
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
    const matchesUltima = matches.filter(m => m.ronda === ultimaRonda);
    const sinFinalizar = matchesUltima.filter(m => m.estado !== "finalizado");
    if (sinFinalizar.length > 0) {
      alert(`Hay ${sinFinalizar.length} partido${sinFinalizar.length > 1 ? "s" : ""} sin finalizar en la ronda ${ultimaRonda}. Finalizalos primero.`);
      return;
    }
    const ganadoresUltima = matchesUltima
      .map(m => {
        if (m.puntaje_a != null && m.puntaje_b != null) {
          if (m.puntaje_a === m.puntaje_b) return m.team_a_id; // empate → avanza equipo A
          return m.puntaje_a > m.puntaje_b ? m.team_a_id : m.team_b_id;
        }
        return null;
      })
      .filter(Boolean) as string[];

    if (ganadoresUltima.length < 2) { alert("Solo queda un ganador. El torneo puede darse por finalizado."); return; }

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

  function abrirEdit() {
    if (!torneo) return;
    setEditForm({
      nombre: torneo.nombre,
      descripcion: torneo.descripcion || "",
      fecha_inicio: torneo.fecha_inicio.slice(0, 10),
      fecha_fin: torneo.fecha_fin?.slice(0, 10) || "",
      cupos_totales: torneo.cupos_totales,
      precio_inscripcion: torneo.precio_inscripcion,
      imagen_url: torneo.imagen_url || "",
    });
    setShowEdit(true);
  }

  async function guardarEdicion() {
    if (!torneo) return;
    setSavingEdit(true);
    const { error } = await supabaseMut.from("tournaments").update({
      nombre: editForm.nombre.trim(),
      descripcion: editForm.descripcion.trim() || null,
      fecha_inicio: editForm.fecha_inicio,
      fecha_fin: editForm.fecha_fin || null,
      cupos_totales: editForm.cupos_totales,
      precio_inscripcion: editForm.precio_inscripcion,
      imagen_url: editForm.imagen_url.trim() || null,
    }).eq("id", torneo.id);
    if (error) {
      alert(`Error al guardar: ${error.message}`);
    } else {
      setShowEdit(false);
      await load();
    }
    setSavingEdit(false);
  }

  async function guardarMatch(m: Match, puntaje_a: number, puntaje_b: number, finalizar: boolean, sets?: Set[] | null) {
    setSavingMatch(m.id);
    const estado = finalizar ? "finalizado" : "en_juego";
    const { error } = await supabaseMut.from("tournament_matches").update({
      puntaje_a, puntaje_b, sets: sets ?? null, estado,
    }).eq("id", m.id);
    if (error) {
      alert(`Error al guardar: ${error.message}`);
    } else {
      setMatches(prev => prev.map(x => x.id === m.id ? { ...x, puntaje_a, puntaje_b, sets: sets ?? null, estado } : x));
    }
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
        <button onClick={abrirEdit}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rodeo-cream/60 hover:text-rodeo-lime"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}>
          <Pencil size={13} /> Editar
        </button>
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
                      editable={torneo.estado === "en_curso"}
                      useSets={DEPORTES_SETS.has(torneo.deporte)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL EDITAR TORNEO */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !savingEdit && setShowEdit(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#1A120B", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px" }}
              className="w-full max-w-lg p-6 my-8 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-base font-black text-white uppercase tracking-tight">Editar torneo</p>
                <button onClick={() => setShowEdit(false)} className="p-1.5 hover:bg-white/5 rounded-lg text-rodeo-cream/50"><X size={16}/></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-rodeo-cream/50 uppercase tracking-wide mb-1.5">Nombre</label>
                  <input value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                    style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"10px", color:"#E1D4C2" }}
                    className="w-full px-3 py-2.5 text-sm placeholder:text-rodeo-cream/25 outline-none focus:border-rodeo-lime/40" />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-rodeo-cream/50 uppercase tracking-wide mb-1.5">Descripción</label>
                  <textarea value={editForm.descripcion} onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))}
                    rows={3}
                    style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"10px", color:"#E1D4C2" }}
                    className="w-full px-3 py-2.5 text-sm placeholder:text-rodeo-cream/25 outline-none focus:border-rodeo-lime/40 resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-rodeo-cream/50 uppercase tracking-wide mb-1.5">Fecha inicio</label>
                    <input type="date" value={editForm.fecha_inicio} onChange={e => setEditForm(f => ({ ...f, fecha_inicio: e.target.value }))}
                      style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"10px", color:"#E1D4C2" }}
                      className="w-full px-3 py-2.5 text-sm outline-none focus:border-rodeo-lime/40" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-rodeo-cream/50 uppercase tracking-wide mb-1.5">Fecha fin</label>
                    <input type="date" value={editForm.fecha_fin} onChange={e => setEditForm(f => ({ ...f, fecha_fin: e.target.value }))}
                      style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"10px", color:"#E1D4C2" }}
                      className="w-full px-3 py-2.5 text-sm outline-none focus:border-rodeo-lime/40" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-rodeo-cream/50 uppercase tracking-wide mb-1.5">Cupos totales</label>
                    <input type="number" min={1} value={editForm.cupos_totales}
                      onChange={e => setEditForm(f => ({ ...f, cupos_totales: parseInt(e.target.value) || 0 }))}
                      style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"10px", color:"#E1D4C2" }}
                      className="w-full px-3 py-2.5 text-sm outline-none focus:border-rodeo-lime/40" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-rodeo-cream/50 uppercase tracking-wide mb-1.5">Precio inscripción</label>
                    <input type="number" min={0}
                      value={editForm.precio_inscripcion === 0 ? "" : editForm.precio_inscripcion}
                      onChange={e => setEditForm(f => ({ ...f, precio_inscripcion: e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value) || 0) }))}
                      placeholder="0 = Gratis"
                      style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"10px", color:"#E1D4C2" }}
                      className="w-full px-3 py-2.5 text-sm placeholder:text-rodeo-cream/30 outline-none focus:border-rodeo-lime/40" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-rodeo-cream/50 uppercase tracking-wide mb-1.5">URL de imagen (opcional)</label>
                  <input value={editForm.imagen_url} onChange={e => setEditForm(f => ({ ...f, imagen_url: e.target.value }))}
                    placeholder="https://..."
                    style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"10px", color:"#E1D4C2" }}
                    className="w-full px-3 py-2.5 text-sm placeholder:text-rodeo-cream/25 outline-none focus:border-rodeo-lime/40" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowEdit(false)} disabled={savingEdit}
                  style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"10px" }}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-rodeo-cream/70 disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={guardarEdicion} disabled={savingEdit || !editForm.nombre.trim()}
                  style={{ background:"rgba(200,255,0,0.9)", borderRadius:"10px" }}
                  className="flex-1 px-4 py-2.5 text-sm font-black text-rodeo-dark disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingEdit ? <Loader size={14} className="animate-spin"/> : <Save size={14}/>}
                  {savingEdit ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MatchRow({ m, teamA, teamB, saving, onSave, editable, useSets }: {
  m: Match; teamA: string; teamB: string; saving: boolean;
  onSave: (m: Match, a: number, b: number, finalizar: boolean, sets?: Set[] | null) => void;
  editable: boolean;
  useSets: boolean;
}) {
  const [a, setA] = useState<string>(m.puntaje_a?.toString() ?? "");
  const [b, setB] = useState<string>(m.puntaje_b?.toString() ?? "");
  const [sets, setSets] = useState<{ a: string; b: string }[]>(
    (m.sets && m.sets.length > 0) ? m.sets.map(s => ({ a: String(s.a), b: String(s.b) })) : [{ a: "", b: "" }]
  );
  const finalizado = m.estado === "finalizado";
  const ganadorA = finalizado && m.puntaje_a != null && m.puntaje_b != null && m.puntaje_a > m.puntaje_b;
  const ganadorB = finalizado && m.puntaje_a != null && m.puntaje_b != null && m.puntaje_b > m.puntaje_a;

  function computarYGuardar(finalizar: boolean) {
    if (useSets) {
      const parsed = sets.map(s => ({ a: parseInt(s.a) || 0, b: parseInt(s.b) || 0 })).filter(s => s.a !== 0 || s.b !== 0);
      const ganadosA = parsed.reduce((acc, s) => acc + (s.a > s.b ? 1 : 0), 0);
      const ganadosB = parsed.reduce((acc, s) => acc + (s.b > s.a ? 1 : 0), 0);
      onSave(m, ganadosA, ganadosB, finalizar, parsed.length ? parsed : null);
    } else {
      onSave(m, parseInt(a) || 0, parseInt(b) || 0, finalizar, null);
    }
  }

  const setsResumen = useSets && m.sets && m.sets.length > 0
    ? m.sets.map(s => `${s.a}-${s.b}`).join(" · ")
    : null;

  return (
    <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"10px" }} className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <p className={`text-sm truncate ${ganadorA ? "text-rodeo-lime font-bold" : "text-white"}`}>{teamA}</p>
          {editable && !finalizado && !useSets ? (
            <div className="flex items-center gap-1">
              <input type="number" value={a} onChange={e => setA(e.target.value)} placeholder="0"
                className="w-10 text-center text-sm bg-white/5 border border-white/10 rounded px-1 py-1 outline-none text-white"/>
              <span className="text-rodeo-cream/40">-</span>
              <input type="number" value={b} onChange={e => setB(e.target.value)} placeholder="0"
                className="w-10 text-center text-sm bg-white/5 border border-white/10 rounded px-1 py-1 outline-none text-white"/>
            </div>
          ) : (
            <div className="text-center min-w-[80px]">
              <p className="text-sm font-black" style={{ color: finalizado ? "#C8FF00" : "#94A3B8" }}>
                {m.puntaje_a != null ? `${m.puntaje_a} - ${m.puntaje_b}` : "—"}
              </p>
              {setsResumen && <p className="text-[10px] text-rodeo-cream/50 tabular-nums">{setsResumen}</p>}
            </div>
          )}
          <p className={`text-sm truncate text-right ${ganadorB ? "text-rodeo-lime font-bold" : "text-white"}`}>{teamB}</p>
        </div>
        {editable && !finalizado && !useSets && (
          <div className="flex gap-1">
            <button onClick={() => computarYGuardar(false)} disabled={saving}
              className="p-1.5 rounded bg-blue-400/10 hover:bg-blue-400/20 text-blue-400" title="Guardar parcial">
              {saving ? <Loader size={11} className="animate-spin"/> : <Play size={11}/>}
            </button>
            <button onClick={() => computarYGuardar(true)} disabled={saving}
              className="p-1.5 rounded bg-green-400/10 hover:bg-green-400/20 text-green-400 disabled:opacity-40" title="Finalizar">
              <Check size={11}/>
            </button>
          </div>
        )}
      </div>

      {/* Editor de sets */}
      {editable && !finalizado && useSets && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
          <p className="text-[10px] font-black text-rodeo-cream/50 uppercase tracking-widest">Sets / parciales</p>
          {sets.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] text-rodeo-cream/40 w-10">Set {i+1}</span>
              <input type="number" value={s.a} onChange={e => { const next = [...sets]; next[i] = { ...next[i], a: e.target.value }; setSets(next); }}
                placeholder="0" className="w-12 text-center text-sm bg-white/5 border border-white/10 rounded px-1 py-1 outline-none text-white"/>
              <span className="text-rodeo-cream/40">-</span>
              <input type="number" value={s.b} onChange={e => { const next = [...sets]; next[i] = { ...next[i], b: e.target.value }; setSets(next); }}
                placeholder="0" className="w-12 text-center text-sm bg-white/5 border border-white/10 rounded px-1 py-1 outline-none text-white"/>
              {sets.length > 1 && (
                <button onClick={() => setSets(sets.filter((_, idx) => idx !== i))}
                  className="p-1 rounded text-rodeo-cream/40 hover:text-red-400">
                  <X size={12}/>
                </button>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            {sets.length < 5 && (
              <button onClick={() => setSets([...sets, { a: "", b: "" }])}
                className="text-[11px] font-bold text-rodeo-lime hover:underline flex items-center gap-1">
                <Plus size={11}/> Set
              </button>
            )}
            <div className="flex-1"/>
            <button onClick={() => computarYGuardar(false)} disabled={saving}
              className="px-2.5 py-1 rounded bg-blue-400/15 hover:bg-blue-400/25 text-blue-400 text-[11px] font-bold flex items-center gap-1">
              {saving ? <Loader size={10} className="animate-spin"/> : <Play size={10}/>}
              Parcial
            </button>
            <button onClick={() => computarYGuardar(true)} disabled={saving}
              className="px-2.5 py-1 rounded bg-green-400/15 hover:bg-green-400/25 text-green-400 text-[11px] font-bold flex items-center gap-1">
              <Check size={10}/> Finalizar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
