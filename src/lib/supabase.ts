import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>;
type AdminClient = ReturnType<typeof createClient<Database>>;

// ─── Lazy singletons ────────────────────────────────────────────────────────
// No se crean en module-level para evitar errores durante el build de Next.js.
// El cliente real se instancia la primera vez que se accede a una propiedad.

let _browser: BrowserClient | null = null;
let _admin: AdminClient | null = null;

export function getSupabaseClient(): BrowserClient {
  if (!_browser) {
    _browser = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _browser;
}

function makeProxy<T extends object>(factory: () => T): T {
  return new Proxy({} as T, {
    get(_, prop: string | symbol) {
      const client = factory();
      const value = (client as any)[prop as string];
      return typeof value === 'function' ? value.bind(client) : value;
    },
  });
}

// Cliente browser (singleton por tab) — usar en componentes cliente y páginas
export const supabase = makeProxy<BrowserClient>(getSupabaseClient);

// Alias para writes — mismo cliente, existe por compatibilidad
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseMut = supabase as any;

// Cliente admin con service role — solo usar en API routes (server-side)
export const supabaseAdmin = makeProxy<AdminClient>(() => {
  if (!_admin) {
    _admin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return _admin;
});
