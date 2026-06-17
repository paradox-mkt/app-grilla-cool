import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { brandFromDB, brandToDB, ideaFromDB, ideaToDB, pubFromDB, pubToDB } from "@/lib/db-mappers";
import type { Brand, Idea, Publication } from "@/lib/types";
import type { Brand as DBBrand, ContentItem, Idea as DBIdea } from "@/integrations/supabase/database.types";

interface DataState {
  brands: Brand[];
  publications: Publication[];
  ideas: Idea[];
  hydrated: boolean;
  hydrate: () => Promise<void>;

  addBrand: (data: Omit<Brand, "id" | "createdAt">) => Promise<Brand>;
  updateBrand: (id: string, patch: Partial<Brand>) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;

  addPublication: (data: Omit<Publication, "id" | "createdAt" | "updatedAt">) => Promise<Publication>;
  updatePublication: (id: string, patch: Partial<Publication>) => Promise<void>;
  deletePublication: (id: string) => Promise<void>;
  duplicatePublication: (id: string) => Promise<Publication | null>;

  addIdea: (data: Omit<Idea, "id" | "createdAt" | "convertedToPublication">) => Promise<Idea>;
  updateIdea: (id: string, patch: Partial<Idea>) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
}

const currentUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
};

let hydrating: Promise<void> | null = null;
let authSubscribed = false;

export const useData = create<DataState>((set, get) => ({
  brands: [],
  publications: [],
  ideas: [],
  hydrated: false,

  hydrate: async () => {
    if (hydrating) return hydrating;
    if (!authSubscribed) {
      authSubscribed = true;
      supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          hydrating = null;
          set({ hydrated: false });
          // Re-hydrate after auth change.
          setTimeout(() => get().hydrate(), 0);
        }
      });
    }
    hydrating = (async () => {
      const uid = await currentUserId();
      if (!uid) {
        set({ brands: [], publications: [], ideas: [], hydrated: true });
        return;
      }
      const [{ data: brands }, { data: pubs }, { data: ideas }] = await Promise.all([
        supabase.from("brands").select("*").order("created_at", { ascending: true }),
        supabase.from("content_items").select("*"),
        supabase.from("ideas").select("*"),
      ]);
      set({
        brands: ((brands as DBBrand[]) ?? []).map(brandFromDB),
        publications: ((pubs as ContentItem[]) ?? []).map(pubFromDB),
        ideas: ((ideas as DBIdea[]) ?? []).map(ideaFromDB),
        hydrated: true,
      });
    })();
    return hydrating;
  },

  addBrand: async (data) => {
    const { data: row, error } = await supabase
      .from("brands")
      .insert(brandToDB(data) as never)
      .select()
      .single();
    if (error || !row) throw error ?? new Error("insert failed");
    const b = brandFromDB(row as DBBrand);
    set({ brands: [...get().brands, b] });
    return b;
  },

  updateBrand: async (id, patch) => {
    set({ brands: get().brands.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
    await supabase.from("brands").update(brandToDB(patch)).eq("id", id);
  },

  deleteBrand: async (id) => {
    set({
      brands: get().brands.filter((b) => b.id !== id),
      publications: get().publications.filter((p) => p.brandId !== id),
      ideas: get().ideas.filter((i) => i.brandId !== id),
    });
    await supabase.from("brands").delete().eq("id", id);
  },

  addPublication: async (data) => {
    const uid = await currentUserId();
    if (!uid) throw new Error("No autenticado");
    const { data: row, error } = await supabase
      .from("content_items")
      .insert(pubToDB(data, uid) as never)
      .select()
      .single();
    if (error || !row) throw error ?? new Error("insert failed");
    const p = pubFromDB(row as ContentItem);
    set({ publications: [...get().publications, p] });
    return p;
  },

  updatePublication: async (id, patch) => {
    set({
      publications: get().publications.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
      ),
    });
    await supabase.from("content_items").update(pubToDB(patch)).eq("id", id);
  },

  deletePublication: async (id) => {
    set({ publications: get().publications.filter((p) => p.id !== id) });
    await supabase.from("content_items").delete().eq("id", id);
  },

  duplicatePublication: async (id) => {
    const src = get().publications.find((p) => p.id === id);
    if (!src) return null;
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = src;
    return get().addPublication(rest);
  },

  addIdea: async (data) => {
    const uid = await currentUserId();
    if (!uid) throw new Error("No autenticado");
    const payload = { ...ideaToDB(data, uid), converted_to_publication: false };
    const { data: row, error } = await supabase
      .from("ideas")
      .insert(payload as never)
      .select()
      .single();
    if (error || !row) throw error ?? new Error("insert failed");
    const i = ideaFromDB(row as DBIdea);
    set({ ideas: [...get().ideas, i] });
    return i;
  },

  updateIdea: async (id, patch) => {
    set({ ideas: get().ideas.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
    await supabase.from("ideas").update(ideaToDB(patch)).eq("id", id);
  },

  deleteIdea: async (id) => {
    set({ ideas: get().ideas.filter((i) => i.id !== id) });
    await supabase.from("ideas").delete().eq("id", id);
  },
}));
