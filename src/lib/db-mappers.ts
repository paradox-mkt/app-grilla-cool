import type { Brand, Idea, Publication, Reference, FileAttachment } from "@/lib/types";
import type { Brand as DBBrand, ContentItem, Idea as DBIdea } from "@/integrations/supabase/database.types";

export const brandFromDB = (r: DBBrand): Brand => ({
  id: r.id,
  name: r.name,
  color: r.color || "#01696f",
  description: r.description ?? undefined,
  createdAt: r.created_at,
});

export const brandToDB = (b: Partial<Brand>) => ({
  ...(b.name !== undefined ? { name: b.name } : {}),
  ...(b.color !== undefined ? { color: b.color } : {}),
  ...(b.description !== undefined ? { description: b.description } : {}),
});

const datePart = (iso: string) => (iso || "").slice(0, 10);

export const pubFromDB = (r: ContentItem): Publication => ({
  id: r.id,
  brandId: r.brand_id,
  format: (r.format as Publication["format"]) || "post",
  objective: (r.objective as Publication["objective"]) || "organic",
  paidType: (r.paid_type as Publication["paidType"]) ?? undefined,
  campaign: (r.campaign as Publication["campaign"]) ?? undefined,
  imageText: r.image_text ?? "",
  copy: r.copy ?? "",
  references: (r.references_data as Reference[]) ?? [],
  finalDesigns: (r.final_designs as FileAttachment[]) ?? [],
  platforms: (r.platforms as Publication["platforms"]) ?? [],
  deliveryDate: r.delivery_date ?? "",
  publishDate: r.publish_at ?? new Date(r.date + "T12:00:00").toISOString(),
  importance: (r.importance as Publication["importance"]) || "relaxed",
  status: (r.status as Publication["status"]) || "por_publicar",
  isOverdue: r.is_overdue,
  scheduledAt: r.scheduled_at ?? undefined,
  notes: r.notes ?? undefined,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const pubToDB = (p: Partial<Publication>, userId?: string) => {
  const row: Record<string, unknown> = {};
  if (p.brandId !== undefined) row.brand_id = p.brandId;
  if (p.format !== undefined) row.format = p.format;
  if (p.objective !== undefined) row.objective = p.objective;
  if (p.paidType !== undefined) row.paid_type = p.paidType ?? null;
  if (p.campaign !== undefined) row.campaign = p.campaign ?? null;
  if (p.imageText !== undefined) {
    row.image_text = p.imageText;
    row.title = p.imageText.slice(0, 200);
  }
  if (p.copy !== undefined) row.copy = p.copy;
  if (p.references !== undefined) row.references_data = p.references;
  if (p.finalDesigns !== undefined) row.final_designs = p.finalDesigns;
  if (p.platforms !== undefined) row.platforms = p.platforms;
  if (p.deliveryDate !== undefined) row.delivery_date = p.deliveryDate || null;
  if (p.publishDate !== undefined) {
    row.publish_at = p.publishDate;
    row.date = datePart(p.publishDate);
  }
  if (p.importance !== undefined) row.importance = p.importance;
  if (p.status !== undefined) row.status = p.status;
  if (p.isOverdue !== undefined) row.is_overdue = p.isOverdue;
  if (p.scheduledAt !== undefined) row.scheduled_at = p.scheduledAt ?? null;
  if (p.notes !== undefined) row.notes = p.notes ?? null;
  if (userId) row.user_id = userId;
  return row;
};

export const ideaFromDB = (r: DBIdea): Idea => ({
  id: r.id,
  brandId: r.brand_id,
  title: r.title,
  description: r.description ?? "",
  references: (r.references_data as Reference[]) ?? [],
  convertedToPublication: r.converted_to_publication,
  convertedPublicationId: r.converted_publication_id ?? undefined,
  createdAt: r.created_at,
});

export const ideaToDB = (i: Partial<Idea>, userId?: string) => {
  const row: Record<string, unknown> = {};
  if (i.brandId !== undefined) row.brand_id = i.brandId;
  if (i.title !== undefined) row.title = i.title;
  if (i.description !== undefined) row.description = i.description;
  if (i.references !== undefined) row.references_data = i.references;
  if (i.convertedToPublication !== undefined) row.converted_to_publication = i.convertedToPublication;
  if (i.convertedPublicationId !== undefined) row.converted_publication_id = i.convertedPublicationId ?? null;
  if (userId) row.user_id = userId;
  return row;
};
