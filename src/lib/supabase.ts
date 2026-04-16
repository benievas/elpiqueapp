import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// flowType: 'pkce' → Google OAuth devuelve ?code= en query params (no #hash)
// Así el server callback puede intercambiar el código por sesión correctamente
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { flowType: 'pkce' },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseMut = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { flowType: 'pkce' },
}) as any;
