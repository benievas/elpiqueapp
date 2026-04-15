"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, BarChart3, Calendar, Users, MapPin, Settings } from "lucide-react";
import Link from "next/link";

// Mock módulos del dashboard dueño
const MODULOS = [
  {
    id: 1,
    titulo: "MI COMPLEJO",
    icon: <MapPin size={48} className="text-rodeo-lime" />,
    descripcion: "Información y configuración del complejo",
    stats: "3 canchas",
    color: "from-blue-500/20 to-blue-600/20",
  },
  {
    id: 2,
    titulo: "MIS CANCHAS",
    icon: <Calendar size={48} className="text-rodeo-lime" />,
    descripcion: "Gestión de canchas y disponibilidad",
    stats: "Todas activas",
    color: "from-green-500/20 to-green-600/20",
  },
  {
    id: 3,
    titulo: "RESERVAS",
    icon: <Users size={48} className="text-rodeo-lime" />,
    descripcion: "Solicitudes y confirmaciones",
    stats: "5 pendientes",
    color: "from-purple-500/20 to-purple-600/20",
  },
  {
    id: 4,
    titulo: "ESTADÍSTICAS",
    icon: <BarChart3 size={48} className="text-rodeo-lime" />,
    descripcion: "Ocupación y ganancias",
    stats: "85% ocupado",
    color: "from-orange-500/20 to-orange-600/20",
  },
  {
    id: 5,
    titulo: "CONFIGURACIÓN",
    icon: <Settings size={48} className="text-rodeo-lime" />,
    descripcion: "Métodos de pago y horarios",
    stats: "3 métodos",
    color: "from-red-500/20 to-red-600/20",
  },
];

export default function DueñoDashboard() {
  const [currentModule, setCurrentModule] = useState(0);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const modulo = MODULOS[currentModule];

  const nextModule = () => setCurrentModule((prev) => (prev + 1) % MODULOS.length);
  const prevModule = () => setCurrentModule((prev) => (prev - 1 + MODULOS.length) % MODULOS.length);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-rodeo-dark">
      {/* Fondo dinámico */}
      <div className="absolute inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-br from-rodeo-dark via-rodeo-brown to-rodeo-dark" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-rodeo-lime/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rodeo-terracotta/5 rounded-full blur-3xl" />
      </div>

      {/* HEADER */}
      <header className="absolute top-0 left-0 right-0 z-30 p-6 flex items-center justify-between">
        <Link
          href="/"
          className="w-10 h-10 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all backdrop-blur-md"
        >
          <ChevronLeft className="text-rodeo-cream" size={20} />
        </Link>
        <h1 className="text-xl font-black text-rodeo-cream tracking-wide">Panel Dueño</h1>
        <div className="w-10" />
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <div className="relative z-10 w-full h-full flex items-center px-4 sm:px-8">
        {/* Panel Izquierdo */}
        <motion.div
          key={currentModule}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full sm:w-2/5 flex flex-col justify-center"
        >
          <p className="text-xs tracking-widest text-rodeo-cream/50 uppercase mb-4">Módulo del panel</p>

          <h2 className="text-5xl sm:text-6xl font-black text-rodeo-cream mb-6 leading-none">
            {modulo.titulo}
          </h2>

          <p className="text-rodeo-cream/80 text-base max-w-md mb-8">
            {modulo.descripcion}
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
              className="px-8 py-3 rounded-liquid border border-white/30 bg-white/10 hover:bg-white/20 text-rodeo-cream font-bold transition-all backdrop-blur-md"
            >
              Ingresar módulo →
            </button>
          </div>
        </motion.div>

        {/* Panel Derecho - Carrusel de Módulos */}
        <div className="hidden sm:flex w-3/5 items-center justify-end relative">
          <div className="relative w-full h-full flex items-center justify-end pr-12">
            <AnimatePresence mode="wait">
              {MODULOS.map((m, idx) => {
                let position = idx - currentModule;
                if (position < -1) position += MODULOS.length;
                if (position > 2) position -= MODULOS.length;

                if (position < 0 || position > 2) return null;

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: 100, scale: 0.8 }}
                    animate={{
                      opacity: position === 0 ? 1 : 0.4,
                      x: position * 120,
                      scale: position === 0 ? 1 : 0.85,
                      zIndex: 10 - position,
                    }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.6 }}
                    className="absolute cursor-pointer"
                    onClick={() => setCurrentModule(idx)}
                  >
                    <div className="w-56 h-72 rounded-3xl overflow-hidden border border-white/20 shadow-2xl hover:border-white/40 transition-all">
                      {/* Fondo con gradiente */}
                      <div
                        className={`w-full h-1/2 bg-gradient-to-br ${m.color} flex items-center justify-center`}
                      >
                        {m.icon}
                      </div>

                      {/* Info */}
                      <div className="h-1/2 bg-gradient-to-t from-rodeo-dark via-rodeo-dark/80 to-transparent p-6 flex flex-col justify-end">
                        <p className="text-rodeo-cream/60 text-xs font-bold uppercase mb-2">
                          {m.titulo}
                        </p>
                        <p className="text-rodeo-lime font-black text-sm">{m.stats}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Controles */}
          <div className="absolute bottom-8 left-0 right-0 px-8 flex items-center justify-between">
            <div className="flex gap-4">
              <button
                onClick={prevModule}
                className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 hover:border-rodeo-lime/50 transition-all backdrop-blur-md"
              >
                <ChevronLeft className="text-rodeo-cream" size={20} />
              </button>
              <button
                onClick={nextModule}
                className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 hover:border-rodeo-lime/50 transition-all backdrop-blur-md"
              >
                <ChevronRight className="text-rodeo-cream" size={20} />
              </button>
            </div>

            {/* Paginación */}
            <span className="text-8xl font-black text-white/20">
              {String(currentModule + 1).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* Workspace Modal */}
      <AnimatePresence>
        {workspaceOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setWorkspaceOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="liquid-panel p-8 max-w-2xl w-full max-h-96 overflow-y-auto"
            >
              <h3 className="text-2xl font-black text-rodeo-cream mb-6">{modulo.titulo}</h3>

              {/* Contenido dinámico por módulo */}
              <div className="space-y-4">
                <div className="p-4 rounded-liquid border border-white/10 bg-white/5">
                  <p className="text-rodeo-cream/80 text-sm">
                    Contenido de {modulo.titulo.toLowerCase()} — en desarrollo
                  </p>
                </div>
              </div>

              <button
                onClick={() => setWorkspaceOpen(false)}
                className="mt-6 w-full py-3 rounded-liquid bg-rodeo-lime text-rodeo-dark font-bold hover:bg-rodeo-lime/80 transition-all"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
