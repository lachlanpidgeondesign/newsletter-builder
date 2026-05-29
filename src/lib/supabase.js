import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const SUPABASE_DB_SCHEMA = import.meta.env.VITE_SUPABASE_DB_SCHEMA || "public";
export const EDITIONS_TABLE = import.meta.env.VITE_SUPABASE_EDITIONS_TABLE || "editions";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables are missing.");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  db: { schema: SUPABASE_DB_SCHEMA },
});
