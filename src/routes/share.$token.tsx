import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Brand, ContentItem, Comment, ShareToken } from "@/integrations/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/share/$token")({
  head: () => ({ meta: [{ title: "Grilla compartida — Paradox" }] }),
  component: SharePage,
});

function SharePage() {
  const { token } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [tokenRow, setTokenRow] = useState<ShareToken | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [active, setActive] = useState<ContentItem | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: t } = await supabase
        .from("share_tokens")
        .select("*")
        .eq("token", token)
        .eq("is_active", true)
        .maybeSingle();
      if (!mounted) return;
      if (!t) { setLoading(false); return; }
      if (t.expires_at && new Date(t.expires_at) < new Date()) {
        setLoading(false);
        return;
      }
      setTokenRow(t as ShareToken);
      const [{ data: b }, { data: c }] = await Promise.all([
        supabase.from("brands").select("*").eq("id", t.brand_id).maybeSingle(),
        supabase.from("content_items").select("*").eq("brand_id", t.brand_id).order("date", { ascending: false }),
      ]);
      if (!mounted) return;
      setBrand(b as Brand | null);
      setItems((c ?? []) as ContentItem[]);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [token]);

  const loadComments = async (itemId: string) => {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("content_item_id", itemId)
      .order("created_at", { ascending: true });
    setComments((data ?? []) as Comment[]);
  };

  const openItem = async (item: ContentItem) => {
    setActive(item);
    setComments([]);
    await loadComments(item.id);
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !tokenRow) return;
    if (!authorName.trim() || !message.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("comments").insert({
      content_item_id: active.id,
      share_token_id: tokenRow.id,
      author_name: authorName.trim(),
      author_email: authorEmail.trim() || null,
      message: message.trim(),
    });
    setPosting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMessage("");
    toast.success("Comentario publicado");
    await loadComments(active.id);
  };

  const grid = useMemo(() => items, [items]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Cargando…</div>;
  }
  if (!tokenRow || !brand) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Enlace no válido</h1>
          <p className="text-muted-foreground mt-2">Este enlace ha caducado o fue revocado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black"
            style={{ background: brand.color || "#01696f" }}
          >
            {brand.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold">{brand.name}</div>
            <div className="text-xs text-muted-foreground">Vista pública · solo lectura</div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {grid.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl text-muted-foreground">
            Aún no hay contenido publicado.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {grid.map((it) => (
              <button
                key={it.id}
                onClick={() => openItem(it)}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted text-left hover:shadow-soft transition"
              >
                {it.file_url ? (
                  <img src={it.file_url} alt={it.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-3xl">📝</div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white">
                  <div className="text-xs font-semibold truncate">{it.title || "Sin título"}</div>
                  <div className="text-[10px] opacity-80">{format(parseISO(it.date), "dd MMM")}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>{active.title || "Sin título"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {active.file_url && (
                  <img src={active.file_url} alt="" className="w-full rounded-lg border border-border" />
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Fecha:</span> {format(parseISO(active.date), "dd MMM yyyy")}</div>
                  <div><span className="text-muted-foreground">Formato:</span> {active.format}</div>
                  <div><span className="text-muted-foreground">Estado:</span> {active.status}</div>
                </div>
                {active.description && <p className="text-sm">{active.description}</p>}
                {active.external_links?.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Enlaces</div>
                    <div className="flex flex-wrap gap-2">
                      {active.external_links.map((u: string, i: number) => (
                        <a
                          key={i}
                          href={u}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline text-primary truncate max-w-[260px]"
                        >
                          {u}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {active.file_url && (
                  <a href={active.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">Descargar archivo</Button>
                  </a>
                )}

                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold mb-3">Comentarios</h3>
                  <div className="space-y-2 mb-4">
                    {comments.length === 0 && (
                      <p className="text-xs text-muted-foreground">Sé el primero en comentar.</p>
                    )}
                    {comments.map((c) => (
                      <div key={c.id} className="bg-muted/50 rounded p-3">
                        <div className="text-xs font-semibold">{c.author_name}</div>
                        <div className="text-sm mt-1 whitespace-pre-wrap">{c.message}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {format(parseISO(c.created_at), "dd MMM HH:mm")}
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={submitComment} className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="mb-1 text-xs">Tu nombre *</Label>
                        <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} required />
                      </div>
                      <div>
                        <Label className="mb-1 text-xs">Email (opcional)</Label>
                        <Input type="email" value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label className="mb-1 text-xs">Comentario *</Label>
                      <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} required />
                    </div>
                    <Button type="submit" disabled={posting} size="sm">
                      {posting ? "Enviando…" : "Publicar comentario"}
                    </Button>
                  </form>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
