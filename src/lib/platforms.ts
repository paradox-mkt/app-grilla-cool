import type { PlatformId, FormatId, Importance } from "./types";

export const PLATFORMS: { id: PlatformId; label: string; color: string; logo: string }[] = [
  { id: "facebook", label: "Facebook", color: "#1877F2", logo: "https://cdn.simpleicons.org/facebook/1877F2" },
  { id: "instagram", label: "Instagram", color: "#E4405F", logo: "https://cdn.simpleicons.org/instagram/E4405F" },
  { id: "tiktok", label: "TikTok", color: "#111111", logo: "https://cdn.simpleicons.org/tiktok/111111" },
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2", logo: "https://cdn.simpleicons.org/linkedin/0A66C2" },
];

export const FORMATS: { id: FormatId; label: string; icon: string }[] = [
  { id: "post", label: "Post Estático", icon: "📷" },
  { id: "carousel", label: "Carrusel", icon: "🎠" },
  { id: "video", label: "Video", icon: "🎬" },
  { id: "story", label: "Story", icon: "📖" },
];

export const IMPORTANCE: { id: Importance; label: string; color: string; emoji: string }[] = [
  { id: "urgent", label: "Muy Urgente", color: "#ef4444", emoji: "🔴" },
  { id: "low", label: "Poco Urgente", color: "#f59e0b", emoji: "🟡" },
  { id: "relaxed", label: "Hay Tiempo", color: "#22c55e", emoji: "🟢" },
];

export const CAMPAIGNS = [
  { id: "formularios", label: "Formularios Internos" },
  { id: "trafico_web", label: "Tráfico a Web" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "interaccion", label: "Interacción con la publicación" },
] as const;

export const platformById = (id: PlatformId) => PLATFORMS.find((p) => p.id === id)!;
export const formatById = (id: FormatId) => FORMATS.find((f) => f.id === id)!;
export const importanceById = (id: Importance) => IMPORTANCE.find((i) => i.id === id)!;
