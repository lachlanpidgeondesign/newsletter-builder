import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const SUPABASE_DB_SCHEMA = import.meta.env.VITE_SUPABASE_DB_SCHEMA || "public";
export const EDITIONS_TABLE = import.meta.env.VITE_SUPABASE_EDITIONS_TABLE || "editions";

export const SUPABASE_CONFIG_OK = Boolean(supabaseUrl && supabaseAnonKey);

if (!SUPABASE_CONFIG_OK) {
  console.warn(
    "Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

// Use safe placeholders when env is missing so createClient does not throw and crash the app.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  { db: { schema: SUPABASE_DB_SCHEMA } }
);
