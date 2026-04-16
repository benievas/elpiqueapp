"use client";

import { useState, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerCustomProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  availableDates?: string[];
}

const DIAS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function getDaysInMonth(date: Date): (number | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

// Próximos 14 días como tira
function getNextDays(count = 14): Date[] {
  const days: Date[] = [];
  const hoy = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    days.push(d);
  }
  return days;
}

function toISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function DatePickerCustom({
  selectedDate,
  onSelectDate,
  availableDates = [],
}: DatePickerCustomProps) {
  const [viewMonth, setViewMonth] = useState(new Date());
  const stripRef = useRef<HTMLDivElement>(null);
  const nextDays = useMemo(() => getNextDays(21), []);
  const daysInMonth = useMemo(() => getDaysInMonth(viewMonth), [viewMonth]);

  const monthLabel = viewMonth.toLocaleString("es-AR", { month: "long", year: "numeric" });

  const isAvailable = (dateStr: string) =>
    availableDates.length === 0 || availableDates.includes(dateStr);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold tracking-widest uppercase text-rodeo-cream/60">
        Seleccionar Fecha
      </h3>

      {/* ── TIRA HORIZONTAL (desktop md+) ── */}
      <div className="hidden md:block">
        <div
          ref={stripRef}
          className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
          style={{ scrollBehavior: "smooth" }}
        >
          {nextDays.map((day) => {
            const iso = toISO(day);
            const isSelected = iso === selectedDate;
            const available = isAvailable(iso);
            const isToday = toISO(new Date()) === iso;

            return (
              <button
                key={iso}
                onClick={() => available && onSelectDate(iso)}
                disabled={!available}
                style={
                  isSelected
                    ? {
                        background: "linear-gradient(135deg, #C8FF00, #A8D800)",
                        borderRadius: "14px",
                        boxShadow: "0 4px 14px rgba(200,255,0,0.4)",
                        border: "1px solid #C8FF00",
                        minWidth: 52,
                      }
                    : {
                        background: "rgba(255,255,255,0.05)",
                        border: `1px solid ${isToday ? "rgba(200,255,0,0.3)" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: "14px",
                        minWidth: 52,
                        opacity: available ? 1 : 0.3,
                      }
                }
                className={`flex flex-col items-center py-2.5 px-1 flex-shrink-0 transition-all ${
                  isSelected ? "text-rodeo-dark" : "text-rodeo-cream hover:bg-white/10"
                }`}
              >
                <span className="text-[10px] font-bold mb-1">
                  {DIAS_ES[day.getDay()]}
                </span>
                <span className="text-lg font-black leading-none">
                  {day.getDate()}
                </span>
                <span className="text-[9px] mt-1 opacity-70">
                  {MESES_ES[day.getMonth()]}
                </span>
                {isToday && !isSelected && (
                  <div
                    style={{
                      width: 5, height: 5,
                      borderRadius: "50%",
                      background: "#C8FF00",
                      marginTop: 3,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
        {/* Selected display */}
        <p className="text-xs text-rodeo-cream/40 mt-2">
          📅{" "}
          {new Date(selectedDate + "T00:00:00").toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* ── CALENDARIO FULL (solo mobile) ── */}
      <div
        className="md:hidden liquid-panel p-4 space-y-4"
      >
        {/* Header mes */}
        <div className="flex items-center justify-between">
          <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1))} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <ChevronLeft size={16} />
          </button>
          <h3 className="text-xs font-bold capitalize text-white">{monthLabel}</h3>
          <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1))} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Grid días */}
        <div className="grid grid-cols-7 gap-1">
          {["D", "L", "M", "X", "J", "V", "S"].map((d) => (
            <div key={d} className="text-[10px] font-bold text-center text-rodeo-cream/40 py-1">{d}</div>
          ))}
          {daysInMonth.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} />;
            const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
            const iso = toISO(date);
            const isSelected = iso === selectedDate;
            const available = isAvailable(iso);
            const isToday = toISO(new Date()) === iso;
            return (
              <button
                key={`d-${day}`}
                onClick={() => available && onSelectDate(iso)}
                disabled={!available}
                className={`aspect-square rounded-lg text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-rodeo-lime text-rodeo-dark shadow-lg shadow-rodeo-lime/40"
                    : available
                    ? "bg-white/5 border border-white/10 text-rodeo-cream hover:bg-white/10"
                    : "opacity-30 cursor-not-allowed"
                } ${isToday ? "ring-1 ring-rodeo-lime/50" : ""}`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
