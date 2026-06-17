import type { Brand, Idea, Publication, User } from "./types";
import { uid } from "./storage";

export function seedUsers(): User[] {
  return [
    {
      id: "u_admin",
      name: "Admin Paradox",
      email: "admin@paradox.pe",
      password: "paradox2024",
      role: "admin",
    },
    {
      id: "u_team",
      name: "Equipo Paradox",
      email: "team@paradox.pe",
      password: "team2024",
      role: "member",
    },
  ];
}

export function seedBrands(): Brand[] {
  const now = new Date().toISOString();
  return [
    { id: "b_nike", name: "Nike Peru", color: "#FF6B35", description: "Just do it.", createdAt: now },
    { id: "b_paradox", name: "Paradox Agencia", color: "#01696f", description: "Casa de marca.", createdAt: now },
  ];
}

function isoDay(offset: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function isoDate(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function seedPublications(): Publication[] {
  const now = new Date().toISOString();
  return [
    {
      id: uid(),
      brandId: "b_nike",
      format: "post",
      objective: "organic",
      imageText: "Corre tu propia carrera",
      copy: "Nada te detiene cuando el siguiente paso depende solo de ti 🏃‍♂️🔥 #JustDoIt",
      references: [],
      finalDesigns: [],
      platforms: ["instagram", "facebook"],
      deliveryDate: isoDate(1),
      publishDate: isoDay(3, 18),
      importance: "low", status: "por_publicar",
      notes: "Coordinar con fotógrafo",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uid(),
      brandId: "b_nike",
      format: "carousel",
      objective: "paid",
      paidType: "dark_post",
      campaign: "trafico_web",
      imageText: "Nueva colección Air Max",
      copy: "Desliza para ver los nuevos colores 👟✨",
      references: [],
      finalDesigns: [],
      platforms: ["instagram"],
      deliveryDate: isoDate(4),
      publishDate: isoDay(6, 12),
      importance: "urgent", status: "programado",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uid(),
      brandId: "b_paradox",
      format: "video",
      objective: "organic",
      imageText: "Detrás de cada marca, una historia",
      copy: "Construimos marcas que la gente quiere usar 💚",
      references: [],
      finalDesigns: [],
      platforms: ["instagram", "tiktok", "linkedin"],
      deliveryDate: isoDate(2),
      publishDate: isoDay(5, 19),
      importance: "relaxed", status: "por_publicar",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function seedIdeas(): Idea[] {
  const now = new Date().toISOString();
  return [
    {
      id: uid(),
      brandId: "b_nike",
      title: "Reto 5K seguidores",
      description: "Invitar a la comunidad a correr 5km y subir su captura de Strava.",
      references: [],
      convertedToPublication: false,
      createdAt: now,
    },
    {
      id: uid(),
      brandId: "b_paradox",
      title: "Serie: Anatomía de una marca",
      description: "Carrusel semanal analizando logos icónicos.",
      references: [],
      convertedToPublication: false,
      createdAt: now,
    },
  ];
}
