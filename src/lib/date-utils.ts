import { parseISO, format, isSameDay } from "date-fns";
import type { Publication } from "./types";

export function getPublicationDay(publication: Publication): Date {
  return parseISO(publication.publishDate);
}

export function publicationBelongsToDay(publication: Publication, day: Date): boolean {
  return isSameDay(parseISO(publication.publishDate), day);
}

export function publicationDayKey(publication: Publication): string {
  return format(parseISO(publication.publishDate), "yyyy-MM-dd");
}

export function dayKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}
