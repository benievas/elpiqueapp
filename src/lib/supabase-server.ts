import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Cliente servidor — usa service role key, bypasea RLS
// SOLO usar en Server Actions o Route Handlers, NUNCA exponer al cliente
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
