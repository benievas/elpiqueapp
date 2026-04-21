'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  rol: 'jugador' | 'propietario' | 'admin' | 'superadmin';
  nombre_completo: string | null;
  email: string;
  avatar_url: string | null;
  telefono: string | null;
  ciudad: string;
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data ?? null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Carga inicial: getSession() es síncrono-local (lee cookies/localStorage sin red).
    //    Resuelve el loading de forma inmediata sin esperar eventos.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        const p = await fetchProfile(session.user.id);
        if (mounted) setProfile(p);
      }
      setLoading(false);
    });

    // 2. Listener para cambios posteriores (login, logout, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        // Re-fetch profile solo cuando cambia la identidad, no en cada token refresh
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          const p = await fetchProfile(session.user.id);
          if (mounted) setProfile(p);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!user?.id) return;
    const p = await fetchProfile(user.id);
    setProfile(p);
  };

  return {
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
    isOwner: profile?.rol === 'propietario',
    isAdmin: profile?.rol === 'admin' || profile?.rol === 'superadmin',
    isSuperAdmin: profile?.rol === 'superadmin',
    isAuthenticated: !!user,
  };
}
