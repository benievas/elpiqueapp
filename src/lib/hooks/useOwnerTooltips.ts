'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

const TOOLTIP_DAYS = 5; // auto-show for first N days

export interface TooltipDef {
  id: string;
  text: string;
  link?: string;
  linkLabel?: string;
}

export function useOwnerTooltips() {
  const { user } = useAuth();
  const [autoShow, setAutoShow] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;

    const firstLoginKey = `owner_first_login_${user.id}`;
    const dismissedKey  = `owner_tooltips_dismissed_${user.id}`;

    // Record first login date
    if (!localStorage.getItem(firstLoginKey)) {
      localStorage.setItem(firstLoginKey, new Date().toISOString());
    }

    const firstLogin = new Date(localStorage.getItem(firstLoginKey)!);
    const daysSince  = (Date.now() - firstLogin.getTime()) / 86_400_000;
    setAutoShow(daysSince <= TOOLTIP_DAYS);

    // Load dismissed set
    try {
      const saved = JSON.parse(localStorage.getItem(dismissedKey) || '[]') as string[];
      setDismissed(new Set(saved));
    } catch {
      setDismissed(new Set());
    }

    setReady(true);
  }, [user]);

  const dismiss = useCallback((id: string) => {
    if (!user) return;
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(`owner_tooltips_dismissed_${user.id}`, JSON.stringify([...next]));
      return next;
    });
  }, [user]);

  const isDismissed = useCallback((id: string) => dismissed.has(id), [dismissed]);

  return { autoShow, dismiss, isDismissed, ready };
}
