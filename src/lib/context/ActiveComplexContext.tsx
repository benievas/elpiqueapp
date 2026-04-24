"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/hooks/useAuth";

interface ComplexOption {
  id: string;
  nombre: string;
  slug: string;
}

interface ActiveComplexContextType {
  complexes: ComplexOption[];
  activeComplexId: string | null;
  activeComplexName: string | null;
  activeComplexSlug: string | null;
  setActiveComplexId: (id: string) => void;
  loading: boolean;
  refresh: () => void;
}

const ActiveComplexContext = createContext<ActiveComplexContextType>({
  complexes: [],
  activeComplexId: null,
  activeComplexName: null,
  activeComplexSlug: null,
  setActiveComplexId: () => {},
  loading: true,
  refresh: () => {},
});

export function ActiveComplexProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [complexes, setComplexes] = useState<ComplexOption[]>([]);
  const [activeComplexId, setActiveComplexIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const lsKey = user?.id ? `active_complex_${user.id}` : null;

  const fetchComplexes = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("complexes")
      .select("id, nombre, slug")
      .eq("owner_id", user.id)
      .order("created_at") as { data: ComplexOption[] | null };

    const list = data || [];
    setComplexes(list);

    if (list.length > 0) {
      // Restore persisted selection, fallback to first
      const saved = lsKey ? localStorage.getItem(lsKey) : null;
      const savedValid = saved && list.find(c => c.id === saved);
      setActiveComplexIdState(savedValid ? saved : list[0].id);
    }
    setLoading(false);
  }, [user?.id, lsKey]);

  useEffect(() => { fetchComplexes(); }, [fetchComplexes]);

  const setActiveComplexId = (id: string) => {
    setActiveComplexIdState(id);
    if (lsKey) localStorage.setItem(lsKey, id);
    // If the selected complex isn't in our list yet, refresh
    if (!complexes.find(c => c.id === id)) {
      fetchComplexes();
    }
  };

  const active = complexes.find(c => c.id === activeComplexId) ?? null;

  return (
    <ActiveComplexContext.Provider value={{
      complexes,
      activeComplexId,
      activeComplexName: active?.nombre ?? null,
      activeComplexSlug: active?.slug ?? null,
      setActiveComplexId,
      loading,
      refresh: fetchComplexes,
    }}>
      {children}
    </ActiveComplexContext.Provider>
  );
}

export function useActiveComplex() {
  return useContext(ActiveComplexContext);
}
