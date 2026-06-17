export type PlatformId = "facebook" | "instagram" | "tiktok" | "linkedin";
export type FormatId = "post" | "carousel" | "video" | "story";
export type Importance = "urgent" | "low" | "relaxed";

export interface Brand {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: string;
}

export interface Reference {
  id: string;
  type: "url" | "image" | "video";
  url?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogDomain?: string;
  ogFetched?: boolean;
  ogIsFavicon?: boolean;
  fileName?: string;
  fileType?: string;
  fileDataUrl?: string;
}

export interface FileAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileDataUrl: string;
}

export interface Publication {
  id: string;
  brandId: string;
  format: FormatId;
  objective: "organic" | "paid";
  paidType?: "dark_post" | "published_ad";
  campaign?: "formularios" | "trafico_web" | "whatsapp" | "interaccion";
  imageText: string;
  copy: string;
  references: Reference[];
  finalDesigns: FileAttachment[];
  platforms: PlatformId[];
  deliveryDate: string;
  publishDate: string;
  importance: Importance;
  status: "por_publicar" | "programado" | "publicado";
  isOverdue?: boolean;
  scheduledAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Idea {
  id: string;
  brandId: string;
  title: string;
  description: string;
  references: Reference[];
  convertedToPublication: boolean;
  convertedPublicationId?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "member";
}
