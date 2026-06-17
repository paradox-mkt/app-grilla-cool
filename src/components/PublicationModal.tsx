import { useEffect, useRef, useState } from "react";
import { isAfter, parseISO, format } from "date-fns";
import { toast } from "sonner";
import { Trash2, Copy, ChevronDown, CheckCircle2, CalendarClock, FileText } from "lucide-react";
import type { Publication } from "@/lib/types";
import { useData } from "@/store/data";
import { CAMPAIGNS, FORMATS, IMPORTANCE } from "@/lib/platforms";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { ReferencesField } from "./ReferencesField";
import { FileUploadField } from "./FileUploadField";
import { PlatformPicker } from "./PlatformPicker";

interface Props {
  open: boolean;
  onClose: () => void;
  pubId?: string;
  brandId: string;
  initialDate?: Date;
}

const blank = (brandId: string, date?: Date): Omit<Publication, "id" | "createdAt" | "updatedAt"> => {
  const d = date ?? new Date();
  const day = new Date(d);
  day.setHours(12, 0, 0, 0);
  const delivery = new Date(d);
  delivery.setDate(delivery.getDate() - 1);
  return {
    brandId,
    format: "post",
    objective: "organic",
    imageText: "",
    copy: "",
    references: [],
    finalDesigns: [],
    platforms: [],
    deliveryDate: delivery.toISOString().slice(0, 10),
    publishDate: day.toISOString().slice(0, 16),
    importance: "relaxed",
    status: "por_publicar",
    notes: "",
  };
};

export function PublicationModal({ open, onClose, pubId, brandId, initialDate }: Props) {
  const existing = useData((s) => (pubId ? s.publications.find((p) => p.id === pubId) : undefined));
  const { addPublication, updatePublication, deletePublication, duplicatePublication } = useData();
  const isMobile = useIsMobile();

  const [draft, setDraft] = useState<Omit<Publication, "id" | "createdAt" | "updatedAt">>(
    existing ?? blank(brandId, initialDate)
  );

  const wasOpen = useRef(false);
  useEffect(() => {
    // Only reset the draft when the modal transitions from closed to open
    // (or when target pubId/brandId changes while open). This prevents
    // live store updates (e.g. publishDate) from clobbering the input as
    // the user types.
    if (open && !wasOpen.current) {
      setDraft(
        existing
          ? {
              ...existing,
              status: existing.status || "por_publicar",
              publishDate: existing.publishDate.slice(0, 16),
              deliveryDate: existing.deliveryDate.slice(0, 10),
            }
          : blank(brandId, initialDate)
      );
    }
    wasOpen.current = open;
  }, [open, existing, brandId, initialDate]);

  const update = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    // Live-persist date changes for existing publications so the calendar chip
    // moves to the correct day cell immediately, before the user hits Save.
    if (pubId && (key === "publishDate" || key === "deliveryDate")) {
      try {
        if (key === "publishDate" && typeof value === "string" && value) {
          updatePublication(pubId, { publishDate: new Date(value).toISOString() });
        } else if (key === "deliveryDate" && typeof value === "string" && value) {
          updatePublication(pubId, { deliveryDate: value });
        }
      } catch {
        /* invalid intermediate date — ignore */
      }
    }
  };

  const publishOverdue = isAfter(new Date(), parseISO(draft.publishDate));

  const save = () => {
    if (!draft.deliveryDate || !draft.publishDate) {
      toast.error("Faltan las fechas");
      return;
    }
    const delivery = new Date(draft.deliveryDate);
    const publish = new Date(draft.publishDate);
    if (!isAfter(publish, delivery)) {
      toast.error("La fecha de publicación debe ser después de la fecha de entrega");
      return;
    }
    if (draft.platforms.length === 0) {
      toast.error("Selecciona al menos una plataforma");
      return;
    }
    const payload = {
      ...draft,
      publishDate: new Date(draft.publishDate).toISOString(),
      deliveryDate: draft.deliveryDate,
      scheduledAt:
        draft.status === "programado" ? new Date(draft.publishDate).toISOString() : undefined,
    };
    if (pubId) {
      updatePublication(pubId, payload);
      toast.success("Publicación actualizada");
    } else {
      addPublication(payload);
      toast.success("Publicación creada");
    }
    onClose();
  };

  const handleDelete = () => {
    if (!pubId) return;
    if (confirm("¿Eliminar esta publicación?")) {
      deletePublication(pubId);
      toast.success("Eliminada");
      onClose();
    }
  };

  const handleDuplicate = async () => {
    if (!pubId) return;
    const c = await duplicatePublication(pubId);
    if (c) {
      toast.success("Duplicada");
      onClose();
    }
  };


  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={
          isMobile
            ? "!max-w-[100vw] !w-screen !h-[100dvh] !max-h-[100dvh] !rounded-none p-0 overflow-hidden flex flex-col gap-0 inset-0 translate-x-0 translate-y-0 top-0 left-0"
            : "!max-w-[80vw] !w-[80vw] h-[90vh] max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0"
        }
      >
        <DialogTitle className="sr-only">
          {pubId ? "Editar publicación" : "Nueva publicación"}
        </DialogTitle>

        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border bg-card sticky top-0 z-10">
          <h2 className="text-base md:text-lg font-bold pr-8 truncate">
            {pubId ? "Editar publicación" : "Nueva publicación"}
          </h2>
          <div className="flex items-center gap-2 pr-8">
            {pubId && !isMobile && (
              <>
                <Button variant="outline" size="sm" onClick={handleDuplicate}>
                  <Copy className="w-4 h-4 mr-1.5" /> Duplicar
                </Button>
                <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-1.5" /> Eliminar
                </Button>
              </>
            )}
            <Button size="sm" onClick={save} className="bg-brand text-white hover:opacity-90" style={{ touchAction: "manipulation" }}>
              Guardar
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 md:space-y-8" style={{ paddingBottom: isMobile ? 96 : undefined }}>
          <Section title="Formato" mobileCollapse={isMobile}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => update("format", f.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                    draft.format === f.id
                      ? "border-brand bg-brand-soft"
                      : "border-border hover:border-muted-foreground"
                  }`}
                  style={{ touchAction: "manipulation" }}
                >
                  <span className="text-2xl">{f.icon}</span>
                  <span className="text-sm font-medium">{f.label}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Objetivo" mobileCollapse={isMobile}>
            <div className="flex gap-2">
              {(["organic", "paid"] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => update("objective", o)}
                  className={`px-5 py-2.5 rounded-md text-sm font-medium border-2 transition-colors ${
                    draft.objective === o
                      ? "border-brand bg-brand-soft"
                      : "border-border hover:border-muted-foreground"
                  }`}
                  style={{ touchAction: "manipulation" }}
                >
                  {o === "organic" ? "Orgánico" : "Pagado"}
                </button>
              ))}
            </div>

            {draft.objective === "paid" && (
              <div className="mt-4 grid md:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/40 border border-border">
                <div>
                  <Label className="mb-2">Tipo de publicación</Label>
                  <div className="flex gap-2">
                    {(["dark_post", "published_ad"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => update("paidType", t)}
                        className={`flex-1 px-3 py-2 rounded-md text-sm border-2 ${
                          draft.paidType === t ? "border-brand bg-card" : "border-border"
                        }`}
                      >
                        {t === "dark_post" ? "Dark Post" : "Pub + Anuncio"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-2">Campaña</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={draft.campaign ?? ""}
                    onChange={(e) => update("campaign", e.target.value as Publication["campaign"])}
                  >
                    <option value="">Selecciona…</option>
                    {CAMPAIGNS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </Section>

          <Section title="Texto en Imagen" mobileCollapse={isMobile}>
            <Textarea
              value={draft.imageText}
              onChange={(e) => update("imageText", e.target.value)}
              placeholder="Escribe el texto que irá en el diseño…"
              rows={3}
            />
          </Section>

          <Section title="Copy para redes" mobileCollapse={isMobile}>
            <Textarea
              value={draft.copy}
              onChange={(e) => update("copy", e.target.value)}
              placeholder="Escribe el copy con emojis que se publicará…"
              rows={5}
            />
            <div className="text-xs text-muted-foreground mt-1">{draft.copy.length} caracteres</div>
          </Section>

          <Section title="Referencias" mobileCollapse={isMobile}>
            <ReferencesField
              refs={draft.references}
              onChange={(r) => update("references", r)}
            />
          </Section>

          <Section title="Diseño Final" mobileCollapse={isMobile}>
            <FileUploadField
              label="Sube las imágenes o videos del diseño terminado"
              files={draft.finalDesigns}
              onChange={(f) => update("finalDesigns", f)}
            />
          </Section>

          <Section title="Plataformas" mobileCollapse={isMobile}>
            <PlatformPicker
              selected={draft.platforms}
              onChange={(p) => update("platforms", p)}
            />
          </Section>

          <Section title="Fechas" mobileCollapse={isMobile}>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">Fecha de Entrega</Label>
                <div className="text-xs text-muted-foreground mb-2">
                  ¿Cuándo debe estar listo el diseño?
                </div>
                <Input
                  type="date"
                  value={draft.deliveryDate}
                  onChange={(e) => update("deliveryDate", e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-2">Fecha y Hora de Publicación</Label>
                <div className="text-xs text-muted-foreground mb-2">¿Cuándo se publica?</div>
                <div
                  className={`rounded-md ${
                    publishOverdue
                      ? "ring-2 ring-destructive bg-destructive/10 p-1"
                      : ""
                  }`}
                >
                  <Input
                    type="datetime-local"
                    value={draft.publishDate}
                    onChange={(e) => update("publishDate", e.target.value)}
                  />
                </div>
                {publishOverdue && (
                  <div className="mt-2 text-xs font-medium text-destructive">
                    ⚠️ Fuera de fecha
                  </div>
                )}
              </div>
            </div>
          </Section>

          <Section title="Importancia" mobileCollapse={isMobile}>
            <div className="flex flex-wrap gap-2">
              {IMPORTANCE.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => update("importance", i.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-md border-2 text-sm font-medium transition-colors ${
                    draft.importance === i.id ? "bg-card" : "border-border opacity-70"
                  }`}
                  style={
                    draft.importance === i.id
                      ? { borderColor: i.color, color: i.color, touchAction: "manipulation" }
                      : { touchAction: "manipulation" }
                  }
                >
                  <span>{i.emoji}</span> {i.label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Estado de Publicación" mobileCollapse={false} defaultOpen>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {(
                [
                  { id: "por_publicar", label: "Por Publicar", icon: FileText, color: "#737373" },
                  { id: "programado", label: "Programado", icon: CalendarClock, color: "#2563eb" },
                  { id: "publicado", label: "Publicado", icon: CheckCircle2, color: "#16a34a" },
                ] as const
              ).map((s) => {
                const Icon = s.icon;
                const active = draft.status === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => update("status", s.id)}
                    className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 text-sm font-semibold transition-colors"
                    style={{
                      borderColor: active ? s.color : "var(--border)",
                      background: active ? `color-mix(in oklab, ${s.color} 12%, transparent)` : "transparent",
                      color: active ? s.color : undefined,
                      touchAction: "manipulation",
                    }}
                  >
                    <Icon className="w-5 h-5" /> {s.label}
                  </button>
                );
              })}
            </div>
            {draft.status === "programado" && (
              <div className="mt-3 p-3 rounded-md bg-blue-500/10 border border-blue-500/30 text-sm">
                🗓️ Programado para:{" "}
                <span className="font-semibold">
                  {format(new Date(draft.publishDate), "dd MMM yyyy, HH:mm")}
                </span>
              </div>
            )}
          </Section>

          <Section title="Notas internas" mobileCollapse={isMobile}>
            <Textarea
              value={draft.notes ?? ""}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Notas para el equipo (no se publican)"
              rows={3}
            />
          </Section>

          {pubId && isMobile && (
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleDuplicate} className="flex-1">
                <Copy className="w-4 h-4 mr-1.5" /> Duplicar
              </Button>
              <Button variant="outline" size="sm" onClick={handleDelete} className="flex-1 text-destructive">
                <Trash2 className="w-4 h-4 mr-1.5" /> Eliminar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  children,
  mobileCollapse,
  defaultOpen,
}: {
  title: string;
  children: React.ReactNode;
  mobileCollapse?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? !mobileCollapse);
  if (!mobileCollapse) {
    return (
      <section className="py-2 md:py-0">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          {title}
        </h3>
        {children}
      </section>
    );
  }
  return (
    <section className="border-b border-border md:border-0 py-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-2"
        style={{ touchAction: "manipulation" }}
      >
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pt-2 pb-3">{children}</div>}
    </section>
  );
}
