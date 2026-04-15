'use client';

import { useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  rol: 'jugador' | 'propietario' | 'admin' | 'superadmin';
  nombre_completo: string | null;
  email: string;
  avatar_url: string | null;
  telefono: string | null;
  ciudad: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const getAuth = async () => {
      try {
        // Obtener sesión
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user) {
          setUser(session.user);

          // Obtener perfil del usuario
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            // PGRST116 = no rows returned (primera vez)
            throw profileError;
          }

          if (profileData) {
            setProfile(profileData);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    getAuth();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);

        // Re-fetch profile cuando cambia la sesión
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error signing out'));
      throw err;
    }
  };

  const isOwner = profile?.rol === 'propietario';
  const isAdmin = ['admin', 'superadmin'].includes(profile?.rol || '');
  const isSuperAdmin = profile?.rol === 'superadmin';

  return {
    user,
    profile,
    loading,
    error,
    signOut,
    isOwner,
    isAdmin,
    isSuperAdmin,
    isAuthenticated: !!user,
  };
}
