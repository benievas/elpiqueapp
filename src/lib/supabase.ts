import { createBrowserClient } from '@supabase/ssr';
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// createBrowserClient de @supabase/ssr almacena el PKCE verifier en COOKIES
// (no en localStorage), así el server callback puede leerlo y hacer el exchange.
// También maneja automáticamente la sincronización de sesión entre cliente/servidor.
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

// Misma instancia — evita múltiples GoTrueClient
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseMut = supabase as any;

// Solo para server actions / route handlers (service role, bypasea RLS)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
