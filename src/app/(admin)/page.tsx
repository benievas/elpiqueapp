"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  Building2,
  Users,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Loader,
} from "lucide-react";

interface DashboardStats {
  totalComplejos: number;
  totalPropietarios: number;
  totalReservas: number;
  ingresoTotal: number;
  complejosActivos: number;
  reservasHoy: number;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  trend,
  delay,
}: {
  icon: any;
  label: string;
  value: string | number;
  trend?: { value: number; label: string; up: boolean };
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="liquid-panel p-6 space-y-4"
  >
    <div className="flex items-center justify-between">
      <div className="w-12 h-12 rounded-liquid bg-rodeo-lime/20 border border-rodeo-lime/40 flex items-center justify-center">
        <Icon size={24} className="text-rodeo-lime" />
      </div>
      {trend && (
        <div
          className={`flex items-center gap-1 text-sm font-bold ${
            trend.up ? "text-green-400" : "text-red-400"
          }`}
        >
          <ArrowUpRight size={16} style={{ transform: trend.up ? "" : "rotate(180deg)" }} />
          {trend.value}%
        </div>
      )}
    </div>
    <div>
      <p className="text-xs text-rodeo-cream/50 mb-1">{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
      {trend && <p className="text-xs text-rodeo-cream/40 mt-2">{trend.label}</p>}
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalComplejos: 0,
    totalPropietarios: 0,
    totalReservas: 0,
    ingresoTotal: 0,
    complejosActivos: 0,
    reservasHoy: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [complejosRes, propietariosRes, reservasRes] = await Promise.all([
        supabase.from("complexes").select("id", { count: "exact" }),
        supabase
          .from("profiles")
          .select("id", { count: "exact" })
          .eq("rol", "propietario"),
        supabase.from("reservations").select("id", { count: "exact" }),
      ]);

      setStats({
        totalComplejos: complejosRes.count || 0,
        totalPropietarios: propietariosRes.count || 0,
        totalReservas: reservasRes.count || 0,
        ingresoTotal: 0, // Calcular desde reservations
        complejosActivos: complejosRes.count || 0,
        reservasHoy: 0, // Calcular desde hoy
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-rodeo-lime" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-black text-white uppercase tracking-tight">
          Dashboard
        </h1>
        <p className="text-rodeo-cream/70">
          Resumen de la plataforma ElPiqueApp
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={Building2}
          label="Complejos Registrados"
          value={stats.totalComplejos}
          trend={{ value: 12, label: "este mes", up: true }}
          delay={0}
        />
        <StatCard
          icon={Users}
          label="Propietarios Activos"
          value={stats.totalPropietarios}
          trend={{ value: 8, label: "este mes", up: true }}
          delay={0.1}
        />
        <StatCard
          icon={Calendar}
          label="Reservas Totales"
          value={stats.totalReservas}
          trend={{ value: 24, label: "este mes", up: true }}
          delay={0.2}
        />
        <StatCard
          icon={TrendingUp}
          label="Complejos Activos"
          value={`${stats.complejosActivos}/${stats.totalComplejos}`}
          trend={{ value: 98, label: "tasa de actividad", up: true }}
          delay={0.3}
        />
        <StatCard
          icon={Calendar}
          label="Reservas Hoy"
          value={stats.reservasHoy}
          trend={{ value: 5, label: "vs promedio", up: false }}
          delay={0.4}
        />
        <StatCard
          icon={TrendingUp}
          label="Ingresos Estimados"
          value={`$${stats.ingresoTotal.toLocaleString()}`}
          trend={{ value: 15, label: "vs mes anterior", up: true }}
          delay={0.5}
        />
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="liquid-panel p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Acciones Rápidas</h3>
          <div className="space-y-2">
            <button className="w-full p-3 text-left liquid-button hover:bg-white/15 transition-colors">
              Crear nueva suscripción
            </button>
            <button className="w-full p-3 text-left liquid-button hover:bg-white/15 transition-colors">
              Aprobar nuevo complejo
            </button>
            <button className="w-full p-3 text-left liquid-button hover:bg-white/15 transition-colors">
              Ver reportes
            </button>
          </div>
        </div>

        <div className="liquid-panel p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Sistema</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-rodeo-cream/70">Estado</span>
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-rodeo-cream/70">BD Conexión</span>
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-rodeo-cream/70">API</span>
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
