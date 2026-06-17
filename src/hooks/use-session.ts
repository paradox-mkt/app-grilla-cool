import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/integrations/supabase/database.types";

export interface SessionState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async (uid: string | undefined) => {
      if (!uid) {
        if (mounted) setProfile(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();
      if (mounted) setProfile((data as Profile | null) ?? null);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Defer Supabase calls out of the listener to avoid deadlocks.
      setTimeout(() => loadProfile(s?.user.id), 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      loadProfile(data.session?.user.id).finally(() => mounted && setLoading(false));
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, profile, loading };
}
