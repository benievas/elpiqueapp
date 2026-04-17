import { createBrowserClient } from '@supabase/ssr';
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type SupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

function getEnv(key: string): string {
  // Servidor: process.env siempre disponible en runtime
  if (typeof window === 'undefined') return process.env[key] ?? '';
  // Browser: valor incrustado en build (process.env) o inyectado en runtime (window.__ENV)
  return (
    (process.env as Record<string, string | undefined>)[key] ||
    (window as { __ENV?: Record<string, string> }).__ENV?.[key] ||
    ''
  );
}

// Lazy init — NO llama a createBrowserClient al cargar el módulo.
// Se inicializa la primera vez que se usa supabase.auth / supabase.from / etc.
// Esto garantiza que window.__ENV ya está disponible cuando se crea el cliente.
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createBrowserClient<Database>(
      getEnv('NEXT_PUBLIC_SUPABASE_URL'),
      getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    );
  }
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    const client = getClient();
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function' ? (val as (...a: unknown[]) => unknown).bind(client) : val;
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseMut = supabase as any;

// Admin client — solo server side (API routes / server actions).
// Guard typeof window evita que createClient se ejecute en el browser
// donde SUPABASE_SERVICE_ROLE_KEY es undefined y lanzaría "supabaseKey is required".
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseAdmin: ReturnType<typeof createClient<Database>> = typeof window === 'undefined'
  ? createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  : (null as any);
