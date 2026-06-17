import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Trash2, X } from "lucide-react";

export interface PreviewItem {
  id: string;
  fileName: string;
  fileType?: string;
  fileDataUrl: string;
}

interface Props {
  items: PreviewItem[];
  startId: string | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function FilePreviewModal({ items, startId, onClose, onDelete }: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (startId) {
      const i = items.findIndex((x) => x.id === startId);
      setIdx(i >= 0 ? i : 0);
    }
  }, [startId, items]);

  useEffect(() => {
    if (!startId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => Math.min(items.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [startId, items.length, onClose]);

  if (!startId || items.length === 0) return null;
  const cur = items[idx];
  if (!cur) return null;
  const isVideo = (cur.fileType || "").startsWith("video") || /\.(mp4|webm|mov)$/i.test(cur.fileName);

  const download = () => {
    const a = document.createElement("a");
    a.href = cur.fileDataUrl;
    a.download = cur.fileName || "archivo";
    a.click();
  };

  const remove = () => {
    if (!onDelete) return;
    if (confirm("¿Eliminar este archivo?")) {
      onDelete(cur.id);
      if (items.length === 1) onClose();
      else setIdx((i) => Math.min(i, items.length - 2));
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-white/90 hover:text-white p-2 rounded-full bg-white/10"
        aria-label="Cerrar"
      >
        <X className="w-5 h-5" />
      </button>

      {items.length > 1 && idx > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIdx((i) => Math.max(0, i - 1));
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-3 rounded-full bg-white/10 hover:bg-white/20"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {items.length > 1 && idx < items.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIdx((i) => Math.min(items.length - 1, i + 1));
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-3 rounded-full bg-white/10 hover:bg-white/20"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      <div
        className="flex flex-col items-center gap-4 max-w-[95vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            src={cur.fileDataUrl}
            controls
            autoPlay
            className="max-w-[90vw] max-h-[80vh] rounded-lg"
          />
        ) : (
          <img
            src={cur.fileDataUrl}
            alt={cur.fileName}
            className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
          />
        )}
        <div className="text-white/90 text-sm font-medium truncate max-w-[90vw]">
          {cur.fileName}
          {items.length > 1 && (
            <span className="ml-2 text-white/60">
              {idx + 1} / {items.length}
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          <button
            type="button"
            onClick={download}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white text-black text-sm font-medium hover:bg-white/90"
          >
            <Download className="w-4 h-4" /> Descargar
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={remove}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-destructive text-white text-sm font-medium hover:opacity-90"
            >
              <Trash2 className="w-4 h-4" /> Eliminar
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white/10 text-white text-sm font-medium hover:bg-white/20"
          >
            <X className="w-4 h-4" /> Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
