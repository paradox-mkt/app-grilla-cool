import { create } from "zustand";
import { storage } from "@/lib/storage";

type Theme = "light" | "dark";

interface UIState {
  theme: Theme;
  hydrate: () => void;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const applyTheme = (t: Theme) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", t === "dark");
};

export const useUI = create<UIState>((set, get) => ({
  theme: "light",
  hydrate: () => {
    const stored = storage.get<Theme | null>("theme", null);
    let theme: Theme = "light";
    if (stored) {
      theme = stored;
    } else if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme = "dark";
    }
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    storage.set("theme", next);
    applyTheme(next);
    set({ theme: next });
  },
  setTheme: (t) => {
    storage.set("theme", t);
    applyTheme(t);
    set({ theme: t });
  },
}));
