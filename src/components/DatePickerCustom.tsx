"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerCustomProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  availableDates?: string[];
}

function getDaysInMonth(date: Date): (number | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return days;
}

export default function DatePickerCustom({
  selectedDate,
  onSelectDate,
  availableDates = [],
}: DatePickerCustomProps) {
  const [viewMonth, setViewMonth] = useState(new Date());

  const daysInMonth = useMemo(() => getDaysInMonth(viewMonth), [viewMonth]);

  const prevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1));
  };

  const monthLabel = viewMonth.toLocaleString("es-AR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold tracking-widest uppercase text-rodeo-cream/60">
        Seleccionar Fecha
      </h3>

      <div className="liquid-panel p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-sm font-bold capitalize text-white">
            {monthLabel}
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 gap-1">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
            <div
              key={d}
              className="text-xs font-bold text-center text-rodeo-cream/40 py-2"
            >
              {d}
            </div>
          ))}

          {/* Days */}
          {daysInMonth.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} />;
            }

            const date = new Date(
              viewMonth.getFullYear(),
              viewMonth.getMonth(),
              day
            );
            const dateStr = date.toISOString().split("T")[0];
            const isSelected = dateStr === selectedDate;
            const isAvailable = availableDates.length === 0 || availableDates.includes(dateStr);
            const isToday =
              new Date().toISOString().split("T")[0] === dateStr;

            return (
              <motion.button
                key={`day-${day}`}
                onClick={() => isAvailable && onSelectDate(dateStr)}
                whileHover={isAvailable ? { scale: 1.1 } : {}}
                className={`
                  aspect-square rounded-lg text-sm font-bold
                  transition-all relative
                  ${
                    isSelected
                      ? "bg-rodeo-lime text-rodeo-dark shadow-lg shadow-rodeo-lime/40"
                      : isAvailable
                      ? "bg-white/5 border border-white/10 text-rodeo-cream hover:bg-white/10"
                      : "opacity-30 cursor-not-allowed"
                  }
                  ${isToday ? "ring-2 ring-rodeo-cream/50" : ""}
                `}
                disabled={!isAvailable}
              >
                {day}
              </motion.button>
            );
          })}
        </div>

        {/* Selected Date Display */}
        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-rodeo-cream/50 mb-2">Fecha seleccionada:</p>
          <p className="text-sm font-bold text-rodeo-lime">
            {new Date(selectedDate).toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
