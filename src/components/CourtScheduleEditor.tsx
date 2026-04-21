"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, supabaseMut } from "@/lib/supabase";
import { Check, Loader2, Clock } from "lucide-react";

const DIAS = [
  { key: 1, label: "Lun", full: "Lunes" },
  { key: 2, label: "Mar", full: "Martes" },
  { key: 3, label: "Mié", full: "Miércoles" },
  { key: 4, label: "Jue", full: "Jueves" },
  { key: 5, label: "Vie", full: "Viernes" },
  { key: 6, label: "Sáb", full: "Sábado" },
  { key: 0, label: "Dom", full: "Domingo" },
];

const HOURS = Array.from({ length: 24 }, (_, i) =>
  `${String(i).padStart(2, "0")}:00`
);

type Schedule = {
  dia_semana: number;
  activo: boolean;
  hora_inicio: string;
  hora_fin: string;
};

function defaultSchedules(): Schedule[] {
  return DIAS.map(d => ({
    dia_semana: d.key,
    activo: d.key !== 0, // Dom desactivado por defecto
    hora_inicio: "08:00",
    hora_fin: "22:00",
  }));
}

interface Props {
  courtId: string;
}

export default function CourtScheduleEditor({ courtId }: Props) {
  const [schedules, setSchedules] = useState<Schedule[]>(defaultSchedules());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("court_schedules")
        .select("*")
        .eq("court_id", courtId);

      if (data && data.length > 0) {
        // Merge con defaults para días que no existan en BD
        const merged = defaultSchedules().map(def => {
          const found = (data as Schedule[]).find(d => d.dia_semana === def.dia_semana);
          return found ? { ...def, ...found } : def;
        });
        setSchedules(merged);
      }
      setLoading(false);
    };
    load();
  }, [courtId]);

  const toggle = (dia: number) => {
    setSchedules(s => s.map(d => d.dia_semana === dia ? { ...d, activo: !d.activo } : d));
  };

  const setHora = (dia: number, field: "hora_inicio" | "hora_fin", value: string) => {
    setSchedules(s => s.map(d => d.dia_semana === dia ? { ...d, [field]: value } : d));
  };

  const applyAll = (base: Schedule) => {
    setSchedules(s => s.map(d => d.activo ? { ...d, hora_inicio: base.hora_inicio, hora_fin: base.hora_fin } : d));
  };

  const handleSave = async () => {
    setSaving(true);
    // Upsert todos los días
    const rows = schedules.map(s => ({
      court_id: courtId,
      dia_semana: s.dia_semana,
      activo: s.activo,
      hora_inicio: s.hora_inicio,
      hora_fin: s.hora_fin,
    }));
    await supabaseMut
      .from("court_schedules")
      .upsert(rows, { onConflict: "court_id,dia_semana" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return (
    <div className="flex items-center gap-2 py-3 text-rodeo-cream/40 text-xs">
      <Loader2 size={14} className="animate-spin" /> Cargando horario...
    </div>
  );

  const firstActive = schedules.find(s => s.activo);

  return (
    <div className="space-y-3">
      {/* Grilla semanal */}
      <div className="space-y-1.5">
        {DIAS.map(dia => {
          const s = schedules.find(sc => sc.dia_semana === dia.key)!;
          const isWeekend = dia.key === 0 || dia.key === 6;
          return (
            <motion.div
              key={dia.key}
              layout
              style={{
                borderRadius: "12px",
                border: `1px solid ${s.activo ? "rgba(200,255,0,0.2)" : "rgba(255,255,255,0.06)"}`,
                background: s.activo ? "rgba(200,255,0,0.04)" : "rgba(255,255,255,0.02)",
                transition: "background 0.2s, border-color 0.2s",
              }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 px-3 py-2.5">
                {/* Toggle día */}
                <button
                  onClick={() => toggle(dia.key)}
                  className="flex items-center gap-2 min-w-[72px]"
                >
                  <div
                    style={{
                      width: 36, height: 20, borderRadius: 10,
                      background: s.activo ? "#C8FF00" : "rgba(255,255,255,0.12)",
                      position: "relative", transition: "background 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    <motion.div
                      animate={{ x: s.activo ? 18 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      style={{
                        position: "absolute", top: 2, width: 16, height: 16,
                        borderRadius: "50%",
                        background: s.activo ? "#1A120B" : "rgba(255,255,255,0.5)",
                      }}
                    />
                  </div>
                  <span className={`text-xs font-black ${s.activo ? "text-white" : "text-rodeo-cream/30"} ${isWeekend ? "text-rodeo-lime/80" : ""}`}>
                    {dia.label}
                  </span>
                </button>

                {/* Horario — solo visible si activo */}
                <AnimatePresence>
                  {s.activo && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex items-center gap-2 overflow-hidden"
                    >
                      <Clock size={11} className="text-rodeo-cream/30 shrink-0" />
                      <select
                        value={s.hora_inicio}
                        onChange={e => setHora(dia.key, "hora_inicio", e.target.value)}
                        className="bg-transparent text-xs font-bold text-rodeo-cream/80 border-0 outline-none cursor-pointer"
                        style={{ appearance: "none" }}
                      >
                        {HOURS.map(h => <option key={h} value={h} style={{ background: "#1A120B" }}>{h}</option>)}
                      </select>
                      <span className="text-rodeo-cream/30 text-xs">→</span>
                      <select
                        value={s.hora_fin}
                        onChange={e => setHora(dia.key, "hora_fin", e.target.value)}
                        className="bg-transparent text-xs font-bold text-rodeo-cream/80 border-0 outline-none cursor-pointer"
                        style={{ appearance: "none" }}
                      >
                        {HOURS.filter(h => h > s.hora_inicio).map(h => <option key={h} value={h} style={{ background: "#1A120B" }}>{h}</option>)}
                      </select>

                      {/* "Aplicar a todos" solo en el primero activo */}
                      {firstActive?.dia_semana === dia.key && schedules.filter(x => x.activo).length > 1 && (
                        <button
                          onClick={() => applyAll(s)}
                          className="text-[9px] font-bold text-rodeo-lime/60 hover:text-rodeo-lime ml-1 whitespace-nowrap transition-colors"
                        >
                          Aplicar a todos
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!s.activo && (
                  <span className="text-[10px] text-rodeo-cream/20 ml-1">Cerrado</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Guardar */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          background: saved ? "rgba(74,222,128,0.2)" : "rgba(200,255,0,0.9)",
          color: saved ? "#4ADE80" : "#1A120B",
          borderRadius: "10px",
          border: saved ? "1px solid rgba(74,222,128,0.4)" : "none",
        }}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-black transition-all disabled:opacity-60"
      >
        {saving
          ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
          : saved
          ? <><Check size={14} /> ¡Horario guardado!</>
          : "Guardar horario"}
      </button>
    </div>
  );
}
