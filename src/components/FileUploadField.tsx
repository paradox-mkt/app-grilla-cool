import { useState } from "react";
import { Play, Upload, X } from "lucide-react";
import { fileToDataUrl } from "@/lib/og-fetch";
import { uid } from "@/lib/storage";
import type { FileAttachment } from "@/lib/types";
import { FilePreviewModal } from "./FilePreviewModal";

export function FileUploadField({
  label,
  files,
  onChange,
  accept = "image/*,video/*",
}: {
  label: string;
  files: FileAttachment[];
  onChange: (files: FileAttachment[]) => void;
  accept?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const handleFiles = async (list: FileList | null) => {
    if (!list) return;
    setBusy(true);
    const next: FileAttachment[] = [];
    for (const f of Array.from(list)) {
      try {
        const dataUrl = await fileToDataUrl(f);
        next.push({ id: uid(), fileName: f.name, fileType: f.type, fileDataUrl: dataUrl });
      } catch {
        // ignore
      }
    }
    onChange([...files, ...next]);
    setBusy(false);
  };

  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <label className="mt-2 flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-brand transition-colors text-sm text-muted-foreground">
        <Upload className="w-4 h-4" />
        {busy ? "Subiendo…" : "Arrastra o haz click para subir"}
        <input
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>
      {files.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {files.map((f) => {
            const isVideo = f.fileType.startsWith("video");
            return (
              <div key={f.id} className="relative shrink-0 group">
                <button
                  type="button"
                  onClick={() => setPreviewId(f.id)}
                  className="block relative"
                  style={{ touchAction: "manipulation" }}
                >
                  {isVideo ? (
                    <>
                      <video
                        src={f.fileDataUrl}
                        className="w-24 h-24 object-cover rounded-md border border-border"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-md">
                        <Play className="w-6 h-6 text-white" fill="white" />
                      </div>
                    </>
                  ) : (
                    <img
                      src={f.fileDataUrl}
                      alt={f.fileName}
                      className="w-24 h-24 object-cover rounded-md border border-border"
                    />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onChange(files.filter((x) => x.id !== f.id))}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 opacity-90"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <FilePreviewModal
        items={files}
        startId={previewId}
        onClose={() => setPreviewId(null)}
        onDelete={(id) => onChange(files.filter((x) => x.id !== id))}
      />
    </div>
  );
}
