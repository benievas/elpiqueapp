"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronDown } from "lucide-react";

const CITIES = ["Catamarca", "Buenos Aires", "Mendoza"];

interface CitySelectorProps {
  onSelectCity?: (city: string) => void;
  className?: string;
}

export default function CitySelector({
  onSelectCity,
  className = "",
}: CitySelectorProps) {
  const [selectedCity, setSelectedCity] = useState("Catamarca");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Obtener ciudad de localStorage o usar por defecto
    const saved = typeof window !== "undefined" ? localStorage.getItem("selectedCity") : null;
    if (saved && CITIES.includes(saved)) {
      setSelectedCity(saved);
    }
  }, []);

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedCity", city);
    }
    onSelectCity?.(city);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="liquid-panel px-4 py-2 flex items-center gap-2 min-w-fit hover:bg-white/10 transition-colors"
      >
        <MapPin size={16} className="text-rodeo-lime" />
        <span className="text-sm font-bold text-white">{selectedCity}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 min-w-full bg-rodeo-brown border border-white/10 rounded-liquid shadow-lg z-50 overflow-hidden"
          >
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => handleSelectCity(city)}
                className={`w-full px-4 py-3 text-left text-sm font-bold transition-colors flex items-center gap-2 ${
                  selectedCity === city
                    ? "bg-rodeo-lime/20 text-rodeo-lime border-l-2 border-l-rodeo-lime"
                    : "text-rodeo-cream hover:bg-white/5"
                }`}
              >
                <MapPin size={14} />
                {city}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
