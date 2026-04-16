import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// Cliente público — usa la anon key, respeta RLS
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Cliente sin genéricos Database — para mutaciones (insert/update/delete)
// El SDK requiere `Relationships` en la interfaz Database para tipado correcto;
// sin eso, infiere `never` para payloads. Este cliente esquiva ese problema.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseMut = createClient(supabaseUrl, supabaseAnonKey) as any;
