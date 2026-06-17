import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Plus, X, Link as LinkIcon, Upload, Loader2, ExternalLink, Play } from "lucide-react";
import { fetchOG, fileToDataUrl, domainOf } from "@/lib/og-fetch";
import { uid } from "@/lib/storage";
import type { Reference } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilePreviewModal, type PreviewItem } from "./FilePreviewModal";

export function ReferencesField({
  refs,
  onChange,
}: {
  refs: Reference[];
  onChange: (refs: Reference[]) => void;
}) {
  const [url, setUrl] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Keep latest refs/onChange in refs so async updates don't use stale closure.
  const refsRef = useRef(refs);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    refsRef.current = refs;
    onChangeRef.current = onChange;
  });

  // Track which IDs we've already fired a fetch for (across renders).
  const fetchedIds = useRef<Set<string>>(new Set());

  // Kick off OG fetch for any URL ref that hasn't been fetched yet.
  useEffect(() => {
    refs.forEach((r) => {
      if (r.type !== "url" || !r.url) return;
      if (r.ogFetched) return;
      if (fetchedIds.current.has(r.id)) return;
      fetchedIds.current.add(r.id);
      fetchOG(r.url).then((og) => {
        const current = refsRef.current;
        const idx = current.findIndex((x) => x.id === r.id);
        if (idx === -1) return;
        const next = current.slice();
        next[idx] = {
          ...current[idx],
          ogTitle: og.title,
          ogDescription: og.description,
          ogImage: og.image,
          ogDomain: og.domain,
          ogIsFavicon: og.isFavicon,
          ogFetched: true,
        };
        onChangeRef.current(next);
      });
    });
  }, [refs]);

  const fileItems: PreviewItem[] = useMemo(
    () =>
      refs
        .filter((r) => r.type !== "url" && r.fileDataUrl)
        .map((r) => ({
          id: r.id,
          fileName: r.fileName || "archivo",
          fileType: r.fileType || (r.type === "video" ? "video/mp4" : "image/*"),
          fileDataUrl: r.fileDataUrl!,
        })),
    [refs]
  );

  const addUrl = () => {
    const u = url.trim();
    if (!u) return;
    const newRef: Reference = {
      id: uid(),
      type: "url",
      url: u,
      ogDomain: domainOf(u),
      ogFetched: false,
    };
    onChangeRef.current([...refsRef.current, newRef]);
    setUrl("");
  };

  const handleFiles = async (list: FileList | null) => {
    if (!list) return;
    const next: Reference[] = [];
    for (const f of Array.from(list)) {
      const dataUrl = await fileToDataUrl(f);
      next.push({
        id: uid(),
        type: f.type.startsWith("video") ? "video" : "image",
        fileName: f.name,
        fileType: f.type,
        fileDataUrl: dataUrl,
      });
    }
    onChangeRef.current([...refsRef.current, ...next]);
  };

  const remove = (id: string) => {
    onChangeRef.current(refsRef.current.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
          placeholder="https://… (pega un link de referencia)"
        />
        <Button type="button" onClick={addUrl} disabled={!url} style={{ touchAction: "manipulation" }}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-brand transition-colors text-sm text-muted-foreground">
        <Upload className="w-4 h-4" /> Sube imágenes o videos de referencia
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {refs.length > 0 && (
        <div className="space-y-2">
          {refs
            .filter((r) => r.type === "url")
            .map((r) => (
              <LinkPreviewCard key={r.id} reference={r} onRemove={() => remove(r.id)} />
            ))}

          {fileItems.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {refs
                .filter((r) => r.type !== "url")
                .map((r) => (
                  <div
                    key={r.id}
                    className="relative group border border-border rounded-md overflow-hidden bg-muted aspect-square"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewId(r.id)}
                      className="w-full h-full block"
                      style={{ touchAction: "manipulation" }}
                    >
                      {r.type === "video" ? (
                        <>
                          <video src={r.fileDataUrl} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="w-8 h-8 text-white" fill="white" />
                          </div>
                        </>
                      ) : (
                        <img src={r.fileDataUrl} alt={r.fileName} className="w-full h-full object-cover" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-90"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      <FilePreviewModal
        items={fileItems}
        startId={previewId}
        onClose={() => setPreviewId(null)}
        onDelete={(id) => remove(id)}
      />
    </div>
  );
}

const LinkPreviewCard = memo(
  function LinkPreviewCard({
    reference,
    onRemove,
  }: {
    reference: Reference;
    onRemove: () => void;
  }) {
    const url = reference.url || "";
    const domain = reference.ogDomain || domainOf(url);
    const loading = !reference.ogFetched;

    if (loading) {
      return (
        <div className="flex gap-3 p-3 border border-border rounded-lg bg-card animate-pulse">
          <div className="w-[60px] h-[60px] rounded bg-muted shrink-0 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            <div className="text-[11px] text-muted-foreground">{domain}</div>
            <div className="h-3 bg-muted rounded w-2/3" />
            <div className="h-2 bg-muted rounded w-full" />
          </div>
        </div>
      );
    }
    return (
      <div className="group relative flex gap-3 p-3 border border-border rounded-lg bg-card hover:shadow-soft transition-shadow">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex gap-3 flex-1 min-w-0"
          style={{ touchAction: "manipulation" }}
        >
          {reference.ogImage ? (
            <img
              src={reference.ogImage}
              alt={reference.ogTitle || ""}
              className="w-[60px] h-[60px] rounded shrink-0 bg-muted"
              style={{
                objectFit: reference.ogIsFavicon ? "contain" : "cover",
                padding: reference.ogIsFavicon ? 12 : 0,
              }}
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
                target.style.objectFit = "contain";
                target.style.padding = "12px";
              }}
            />
          ) : (
            <div className="w-[60px] h-[60px] rounded bg-muted shrink-0 flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
              {domain}
              <ExternalLink className="w-3 h-3 shrink-0" />
            </div>
            <div className="font-semibold text-sm truncate mt-0.5">
              {reference.ogTitle || domain}
            </div>
            {reference.ogDescription && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {reference.ogDescription}
              </p>
            )}
          </div>
        </a>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 self-start text-muted-foreground hover:text-destructive p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  },
  (prev, next) =>
    prev.reference === next.reference && prev.onRemove === next.onRemove
);
