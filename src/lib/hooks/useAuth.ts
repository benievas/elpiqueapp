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
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    // Safety timeout: if INITIAL_SESSION never fires, unblock after 6s
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 6000);

    // Fallback: si INITIAL_SESSION no llega en 800ms (puede pasar cuando el middleware
    // hizo getUser() y renovó cookies), llamamos getSession() directamente.
    const fallback = setTimeout(async () => {
      if (!mounted) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        const p = await fetchProfile(session.user.id);
        if (mounted) { setProfile(p); setLoading(false); }
      } else {
        setLoading(false);
      }
    }, 800);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);

        // Only fetch profile on events that change identity (not just token refresh)
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          try {
            const p = await fetchProfile(session.user.id);
            if (!mounted) return;
            setProfile(p);
          } catch (err) {
            if (mounted) setError(err instanceof Error ? err : new Error('Profile fetch failed'));
          }
        }

        if (event === 'INITIAL_SESSION') {
          clearTimeout(timeout);
          clearTimeout(fallback);
          setLoading(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        if (event === 'INITIAL_SESSION') {
          clearTimeout(timeout);
          clearTimeout(fallback);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  // Allows pages to refresh profile after mutations (e.g. settings save)
  const refreshProfile = async () => {
    if (!user?.id) return;
    const p = await fetchProfile(user.id);
    setProfile(p);
  };

  return {
    user,
    profile,
    loading,
    error,
    signOut,
    refreshProfile,
    isOwner: profile?.rol === 'propietario',
    isAdmin: profile?.rol === 'admin' || profile?.rol === 'superadmin',
    isSuperAdmin: profile?.rol === 'superadmin',
    isAuthenticated: !!user,
  };
}
