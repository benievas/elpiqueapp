import { createBrowserClient } from '@supabase/ssr';
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Lee la var de build-time (process.env) o de runtime (window.__ENV inyectado en layout.tsx)
function getPublicEnv(key: string): string {
  const fromProcess = (process.env as Record<string, string | undefined>)[key];
  if (fromProcess) return fromProcess;
  if (typeof window !== 'undefined') {
    const w = window as unknown as { __ENV?: Record<string, string> };
    if (w.__ENV?.[key]) return w.__ENV[key];
  }
  return '';
}

const supabaseUrl = getPublicEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getPublicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// createBrowserClient de @supabase/ssr almacena el PKCE verifier en COOKIES
// (no en localStorage), así el server callback puede leerlo y hacer el exchange.
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

// Misma instancia — evita múltiples GoTrueClient
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseMut = supabase as any;

// Solo para server actions / route handlers (service role, bypasea RLS)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
