"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Zap } from "lucide-react";
import { useNotifications, type AppNotification } from "@/lib/context/NotificationContext";

function ToastItem({ n, onDismiss }: { n: AppNotification; onDismiss: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [onDismiss]);

  const Icon = n.type === "partido_full" ? Zap : Users;
  const accent = n.type === "partido_full" ? "#C8FF00" : "#60A5FA";

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      style={{
        background: "linear-gradient(145deg, rgba(20,30,20,0.98), rgba(13,20,13,0.99))",
        border: `1px solid ${accent}35`,
        borderRadius: "16px",
        boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${accent}10`,
        padding: "12px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        width: "100%",
        maxWidth: "340px",
        pointerEvents: "all",
      }}
    >
      <div style={{ background: `${accent}18`, borderRadius: "10px", padding: "7px", flexShrink: 0 }}>
        <Icon size={16} style={{ color: accent }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "12px", fontWeight: 800, color: "#fff", marginBottom: "2px" }}>{n.title}</p>
        <p style={{ fontSize: "11px", color: "rgba(225,212,194,0.65)", lineHeight: 1.4 }}>{n.body}</p>
      </div>
      <button onClick={onDismiss} style={{ color: "rgba(225,212,194,0.3)", flexShrink: 0, marginTop: "1px" }}
        className="hover:text-white transition-colors">
        <X size={13} />
      </button>
    </motion.div>
  );
}

export default function GlobalToast() {
  const { notifications, dismiss } = useNotifications();
  // Solo muestra las últimas 3
  const visible = notifications.slice(0, 3);

  return (
    <div
      style={{
        position: "fixed", top: "16px", right: "16px",
        zIndex: 9999, display: "flex", flexDirection: "column",
        gap: "8px", pointerEvents: "none", width: "340px",
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      <AnimatePresence mode="sync">
        {visible.map(n => (
          <ToastItem key={n.id} n={n} onDismiss={() => dismiss(n.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
