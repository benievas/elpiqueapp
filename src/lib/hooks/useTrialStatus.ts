'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export type TrialState =
  | 'loading'
  | 'sin_plan'      // nunca activó trial
  | 'trial_activo'  // dentro de los 30 días
  | 'gracia'        // 30-32 días: acceso pero con aviso urgente
  | 'expirado'      // +32 días: acceso bloqueado
  | 'activa';       // suscripción paga activa

export interface TrialStatus {
  state: TrialState;
  diasRestantes: number;   // días de trial que quedan
  diasGracia: number;      // días de prórroga que quedan (máx 2)
  endsAt: Date | null;
  isBlocked: boolean;      // true cuando hay que bloquear el panel
}

const TRIAL_DAYS = 30;
const GRACE_DAYS = 2;

export function useTrialStatus(): TrialStatus {
  const { user, isOwner, isAdmin, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<TrialStatus>({
    state: 'loading',
    diasRestantes: 0,
    diasGracia: 0,
    endsAt: null,
    isBlocked: false,
  });

  useEffect(() => {
    // Esperar a que useAuth termine de cargar antes de tomar decisiones
    if (authLoading) return;

    if (!user) {
      setStatus({ state: 'sin_plan', diasRestantes: 0, diasGracia: 0, endsAt: null, isBlocked: false });
      return;
    }

    // Admins nunca están bloqueados
    if (isAdmin) {
      setStatus({ state: 'activa', diasRestantes: 999, diasGracia: 0, endsAt: null, isBlocked: false });
      return;
    }
    // No es owner → no aplica trial
    if (!isOwner) {
      setStatus({ state: 'sin_plan', diasRestantes: 0, diasGracia: 0, endsAt: null, isBlocked: false });
      return;
    }

    const fetchStatus = async () => {
      const { data } = await supabase
        .from('subscriptions' as never)
        .select('status, is_trial, trial_starts_at, ends_at')
        .eq('user_id', user.id)
        .eq('plan', 'owner')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as { data: {
          status: string;
          is_trial: boolean;
          trial_starts_at: string | null;
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
      if (data.is_trial && data.trial_starts_at) {
        const startedAt = new Date(data.trial_starts_at);
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

      // Estado expired explícito
      setStatus({ state: 'expirado', diasRestantes: 0, diasGracia: 0, endsAt: null, isBlocked: true });
    };

    fetchStatus();
  }, [user, isOwner, isAdmin, authLoading]);

  return status;
}
