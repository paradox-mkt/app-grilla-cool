import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/store/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ReferencesField } from "@/components/ReferencesField";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/b/$brandId/ideas")({
  component: IdeasView,
});

function IdeasView() {
  const { brandId } = Route.useParams();
  const brand = useData((s) => s.brands.find((b) => b.id === brandId));
  const brands = useData((s) => s.brands);
  const allIdeas = useData((s) => s.ideas);
  const { addIdea, deleteIdea, updateIdea, addPublication } = useData();
  const ideas = useMemo(() => allIdeas.filter((i) => i.brandId === brandId), [allIdeas, brandId]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    references: [] as ReturnType<typeof Object>[],
  });
  const [convertId, setConvertId] = useState<string | null>(null);
  const [convertDate, setConvertDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [convertBrand, setConvertBrand] = useState<string>(brandId);

  const save = () => {
    if (!form.title.trim()) return toast.error("Título requerido");
    addIdea({
      brandId,
      title: form.title.trim(),
      description: form.description,
      references: form.references as never,
    });
    setForm({ title: "", description: "", references: [] });
    toast.success("Idea guardada");
  };

  const doConvert = async () => {
    const idea = ideas.find((i) => i.id === convertId);
    if (!idea) return;
    const pub = await addPublication({
      brandId: convertBrand,
      format: "post",
      objective: "organic",
      imageText: idea.title,
      copy: idea.description,
      references: idea.references,
      finalDesigns: [],
      platforms: [],
      deliveryDate: convertDate,
      publishDate: new Date(convertDate + "T12:00").toISOString(),
      importance: "relaxed",
      status: "por_publicar",
    });
    await updateIdea(idea.id, { convertedToPublication: true, convertedPublicationId: pub.id });
    toast.success("Idea pasada a la grilla");
    setConvertId(null);
  };


  if (!brand) return null;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Banco de Ideas</h1>
        <p className="text-sm text-muted-foreground mt-1">Guarda ideas sueltas y conviértelas en publicaciones.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold mb-4">Nueva idea</h2>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5">Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ej. Reto 5K seguidores"
              />
            </div>
            <div>
              <Label className="mb-1.5">Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="¿De qué trata esta idea?"
                rows={4}
              />
            </div>
            <div>
              <Label className="mb-2">Referencias</Label>
              <ReferencesField
                refs={form.references as never}
                onChange={(r) => setForm({ ...form, references: r as never })}
              />
            </div>
            <Button onClick={save} className="w-full bg-brand text-white hover:opacity-90">
              Guardar idea
            </Button>
          </div>
        </div>

        <div>
          <h2 className="font-bold mb-4">Ideas guardadas ({ideas.length})</h2>
          {ideas.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl text-muted-foreground">
              <div className="text-4xl mb-2">💡</div>
              <p className="text-sm">Sin ideas todavía</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ideas.map((i) => (
                <div key={i.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold flex items-center gap-2">
                        {i.title}
                        {i.convertedToPublication && (
                          <span className="text-[10px] uppercase tracking-wider bg-green-500/15 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                            <Check className="w-3 h-3" /> Pasada a grilla
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                        {i.description || "—"}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("¿Eliminar idea?")) {
                          deleteIdea(i.id);
                          toast.success("Eliminada");
                        }
                      }}
                      className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {i.references.length > 0 && (
                    <div className="mt-3 flex gap-1.5 overflow-x-auto">
                      {i.references.slice(0, 4).map((r) => (
                        <div key={r.id} className="shrink-0">
                          {r.type === "url" ? (
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-[10px]">
                              URL
                            </div>
                          ) : (
                            <img
                              src={r.fileDataUrl}
                              alt=""
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {!i.convertedToPublication && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        setConvertId(i.id);
                        setConvertBrand(brandId);
                        setConvertDate(new Date().toISOString().slice(0, 10));
                      }}
                    >
                      Pasar a Grilla <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!convertId} onOpenChange={(o) => !o && setConvertId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pasar idea a la grilla</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5">Marca destino</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={convertBrand}
                onChange={(e) => setConvertBrand(e.target.value)}
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1.5">Día programado</Label>
              <Input
                type="date"
                value={convertDate}
                onChange={(e) => setConvertDate(e.target.value)}
              />
            </div>
            <Button onClick={doConvert} className="w-full bg-brand text-white hover:opacity-90">
              Crear publicación
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
