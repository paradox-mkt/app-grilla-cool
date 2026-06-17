const PREFIX = "paradox_";

export const storage = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.warn("Storage write failed", e);
    }
  },
  remove(key: string) {
    if (typeof window === "undefined") return;
    localStorage.removeItem(PREFIX + key);
  },
  usageMB(): number {
    if (typeof window === "undefined") return 0;
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) {
        total += (localStorage.getItem(k) || "").length;
      }
    }
    return total / (1024 * 1024);
  },
};

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
