import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ─── Browser client ────────────────────────────────────────────────────────────
// Singleton por tab. createBrowserClient maneja cookies + localStorage de forma
// nativa con @supabase/ssr — no se necesita Proxy ni lazy-init personalizado.
let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!_client) {
    _client = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}

export const supabase = getSupabaseClient();

// supabaseMut es el mismo cliente — existe por compatibilidad con código que hace writes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseMut = supabase as any;

// ─── Admin client (solo server-side) ──────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseAdmin: ReturnType<typeof createClient<Database>> = typeof window === 'undefined'
  ? createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  : (null as any);
