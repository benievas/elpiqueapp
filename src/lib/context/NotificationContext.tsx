"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export type AppNotification = {
  id: string;
  type: "partido_join" | "partido_full";
  title: string;
  body: string;
  at: number;
};

type NotifCtx = {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  dismiss: (id: string) => void;
};

const Ctx = createContext<NotifCtx>({
  notifications: [], unreadCount: 0, markAllRead: () => {}, dismiss: () => {},
});

export function useNotifications() { return useContext(Ctx); }

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [lastRead, setLastRead] = useState<number>(Date.now());
  // IDs de partidos donde el user es creador
  const misPartidosRef = useRef<Set<string>>(new Set());

  const add = useCallback((n: Omit<AppNotification, "id" | "at">) => {
    const notif: AppNotification = { ...n, id: crypto.randomUUID(), at: Date.now() };
    setNotifications(prev => [notif, ...prev].slice(0, 20));
  }, []);

  // Cargar partidos del usuario como creador
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("partidos")
      .select("id")
      .eq("creador_id", user.id)
      .in("estado", ["abierto", "completo"])
      .then(({ data }) => {
        misPartidosRef.current = new Set((data ?? []).map((p: any) => p.id));
      });
  }, [user?.id]);

  // Suscripción Realtime a partido_jugadores
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`partido-notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "partido_jugadores" },
        async (payload) => {
          const row = payload.new as any;
          // Solo si el partido es mío y no soy yo quien se unió
          if (!misPartidosRef.current.has(row.partido_id)) return;
          if (row.user_id === user.id) return;

          // Agregar el partido a la lista si no estaba (si lo creó después de montar)
          misPartidosRef.current.add(row.partido_id);

          // Buscar info del partido para el mensaje
          const { data: partido } = await supabase
            .from("partidos")
            .select("deporte, slots_ocupados, slots_totales")
            .eq("id", row.partido_id)
            .single() as { data: { deporte: string; slots_ocupados: number; slots_totales: number } | null };

          const nombre = row.nombre_display ?? "Alguien";
          const isFull = partido && partido.slots_ocupados >= partido.slots_totales;
          const deporteEmoji: Record<string, string> = {
            futbol: "⚽", padel: "🎾", tenis: "🏸", voley: "🏐", basquet: "🏀", hockey: "🏑",
          };
          const emoji = deporteEmoji[partido?.deporte ?? ""] ?? "🏅";

          if (isFull) {
            add({ type: "partido_full", title: `${emoji} ¡Partido completo!`, body: `${nombre} se sumó y ya están todos. ¡A jugar!` });
          } else {
            add({ type: "partido_join", title: `${emoji} Nuevo jugador`, body: `${nombre} se unió a tu partido` });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, add]);

  // Actualizar misPartidosRef cuando cambia el estado de un partido
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`partido-state-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "partidos", filter: `creador_id=eq.${user.id}` },
        (payload) => { misPartidosRef.current.add((payload.new as any).id); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const unreadCount = notifications.filter(n => n.at > lastRead).length;
  const markAllRead = useCallback(() => setLastRead(Date.now()), []);
  const dismiss = useCallback((id: string) => setNotifications(prev => prev.filter(n => n.id !== id)), []);

  return (
    <Ctx.Provider value={{ notifications, unreadCount, markAllRead, dismiss }}>
      {children}
    </Ctx.Provider>
  );
}
