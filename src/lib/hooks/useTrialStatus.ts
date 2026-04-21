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
      // Las suscripciones son por usuario (owner), no por complejo.
      // Así se evita el loop infinito de trial cuando el owner crea un complejo
      // y la suscripción había sido guardada con complex_id = null.
      let query: any = supabase
        .from('subscriptions' as never)
        .select('status, is_trial, starts_at, ends_at')
        .eq('plan', 'owner')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const { data } = await query.maybeSingle() as { data: {
        status: string;
        is_trial: boolean;
        starts_at: string | null;
        ends_at: string | null;
      } | null };

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
    };

    fetchStatus();
  }, [user, isOwner, isAdmin, authLoading, complexId]);

  return status;
}
