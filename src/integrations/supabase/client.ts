import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — auth and DB calls will fail.",
  );
}

export const supabase = createClient(
  url ?? "http://localhost:54321",
  anonKey ?? "public-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      storageKey: "paradox_sb_auth",
    },
  },
);

export const isSupabaseConfigured = Boolean(url && anonKey);
