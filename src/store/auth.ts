import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@/lib/types";
import type { Profile } from "@/integrations/supabase/database.types";

interface AuthState {
  users: User[];
  currentUserId: string | null;
  ready: boolean;
  hydrate: () => void;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  createUser: (data: { name: string; email: string; password: string; role: "admin" | "member" }) => Promise<User | null>;
  deleteUser: (id: string) => Promise<void>;
  updateUser: (id: string, patch: Partial<User>) => Promise<void>;
  _setSession: (uid: string | null) => Promise<void>;
}


const fromProfile = (p: Profile): User => ({
  id: p.id,
  name: p.full_name || (p.email ? p.email.split("@")[0] : "Usuario"),
  email: p.email || "",
  password: "",
  role: p.role === "admin" ? "admin" : "member",
});

let hydrated = false;

export const useAuth = create<AuthState>((set, get) => ({
  users: [],
  currentUserId: null,
  ready: false,

  hydrate: () => {
    if (hydrated) return;
    hydrated = true;
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null;
      get()._setSession(uid);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user.id ?? null;
      // Defer to avoid potential deadlocks per Supabase guidance.
      setTimeout(() => get()._setSession(uid), 0);
    });
  },

  _setSession: async (uid) => {
    if (!uid) {
      set({ currentUserId: null, users: [], ready: true });
      return;
    }
    // Load current profile; if admin, also load all profiles for settings page.
    const { data: mine } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();
    const meUser = mine ? fromProfile(mine as Profile) : null;
    let allUsers: User[] = meUser ? [meUser] : [];
    if (meUser?.role === "admin") {
      const { data: all } = await supabase.from("profiles").select("*");
      if (all) allUsers = (all as Profile[]).map(fromProfile);
    }
    set({ currentUserId: uid, users: allUsers, ready: true });
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return null;
    await get()._setSession(data.user.id);
    return get().users.find((u) => u.id === data.user!.id) ?? null;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ currentUserId: null, users: [] });
  },

  createUser: async ({ name, email, password, role }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin + "/brands" : undefined,
        data: { full_name: name },
      },
    });
    if (error || !data.user) return null;
    // Best-effort role update if admin requested (only works if requester is admin via RLS).
    if (role === "admin") {
      await supabase.from("profiles").update({ role: "admin" }).eq("id", data.user.id);
    }
    // Refresh users list.
    const meId = get().currentUserId;
    if (meId) await get()._setSession(meId);
    return {
      id: data.user.id,
      name,
      email,
      password: "",
      role,
    };
  },

  deleteUser: async (id) => {
    // Best-effort: only admins can delete profile rows via RLS; auth user remains.
    await supabase.from("profiles").delete().eq("id", id);
    const meId = get().currentUserId;
    if (meId) await get()._setSession(meId);
  },

  updateUser: async (id, patch) => {
    const upd: Record<string, unknown> = {};
    if (patch.name !== undefined) upd.full_name = patch.name;
    if (patch.role !== undefined) upd.role = patch.role === "admin" ? "admin" : "editor";
    if (Object.keys(upd).length) await supabase.from("profiles").update(upd).eq("id", id);
    const meId = get().currentUserId;
    if (meId) await get()._setSession(meId);
  },
}));

export const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
