'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export type TrialState =
  | 'loading'
  | 'sin_plan'      // nunca activó trial para este complejo
  | 'trial_activo'  // dentro de los 30 días
  | 'gracia'        // 30-32 días: acceso pero con aviso urgente
  | 'expirado'      // +32 días: acceso bloqueado
  | 'activa';       // suscripción paga activa

export interface TrialStatus {
  state: TrialState;
  diasRestantes: number;
  diasGracia: number;
  endsAt: Date | null;
  isBlocked: boolean;
}

const TRIAL_DAYS = 30;
const GRACE_DAYS = 2;

/**
 * Retorna el estado de suscripción del complejo activo.
 * complexId = null → espera aún (owner sin complejo: primer setup)
 * complexId = string → consulta por complex_id (modelo per-complejo)
 * complexId = undefined → fallback por user_id (compat. retroactiva)
 */
export function useTrialStatus(complexId?: string | null): TrialStatus {
  const { user, isOwner, isAdmin, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<TrialStatus>({
    state: 'loading',
    diasRestantes: 0,
    diasGracia: 0,
    endsAt: null,
    isBlocked: false,
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setStatus({ state: 'sin_plan', diasRestantes: 0, diasGracia: 0, endsAt: null, isBlocked: false });
      return;
    }

    // Admins nunca bloqueados
    if (isAdmin) {
      setStatus({ state: 'activa', diasRestantes: 999, diasGracia: 0, endsAt: null, isBlocked: false });
      return;
    }

    if (!isOwner) {
      setStatus({ state: 'sin_plan', diasRestantes: 0, diasGracia: 0, endsAt: null, isBlocked: false });
      return;
    }

    // null = aún cargando el complejo activo
    if (complexId === null) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/auth/me?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Error en API');
        const { subscription: data } = await res.json();

      if (!data) {
        setStatus({ state: 'sin_plan', diasRestantes: 0, diasGracia: 0, endsAt: null, isBlocked: false });
        return;
      }

      // Suscripción paga activa
      if (data.status === 'active' && !data.is_trial) {
        const endsAt = data.ends_at ? new Date(data.ends_at) : null;
        setStatus({ state: 'activa', diasRestantes: 999, diasGracia: 0, endsAt, isBlocked: false });
        return;
      }

      // Trial
      if (data.is_trial && data.starts_at) {
        const startedAt = new Date(data.starts_at);
        const now = new Date();
        const daysElapsed = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24));

        if (daysElapsed <= TRIAL_DAYS) {
          const diasRestantes = TRIAL_DAYS - daysElapsed;
          const endsAt = new Date(startedAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
          setStatus({ state: 'trial_activo', diasRestantes, diasGracia: 0, endsAt, isBlocked: false });
        } else if (daysElapsed <= TRIAL_DAYS + GRACE_DAYS) {
          const diasGracia = (TRIAL_DAYS + GRACE_DAYS) - daysElapsed;
          setStatus({ state: 'gracia', diasRestantes: 0, diasGracia, endsAt: null, isBlocked: false });
        } else {
          setStatus({ state: 'expirado', diasRestantes: 0, diasGracia: 0, endsAt: null, isBlocked: true });
        }
        return;
      }

      setStatus({ state: 'expirado', diasRestantes: 0, diasGracia: 0, endsAt: null, isBlocked: true });
      } catch (err) {
        console.error('Error fetching trial status:', err);
        // No cambiar estado en error de red — evita redirigir al owner por un fallo transitorio
        // El estado previo se mantiene hasta que la próxima llamada tenga éxito
      }
    };

    fetchStatus();
  }, [user, isOwner, isAdmin, authLoading, complexId]);

  return status;
}
