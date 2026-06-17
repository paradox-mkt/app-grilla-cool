import { format, parseISO, isAfter } from "date-fns";
import { CalendarClock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { Publication } from "@/lib/types";
import { formatById, importanceById, platformById } from "@/lib/platforms";

export function PublicationCard({
  pub,
  onClick,
}: {
  pub: Publication;
  onClick: () => void;
}) {
  const imp = importanceById(pub.importance);
  const fmt = formatById(pub.format);
  const now = new Date();
  const publishDt = parseISO(pub.publishDate);
  const pastPublish = isAfter(now, publishDt);
  const status = pub.status || "por_publicar";

  const isOverdueScheduled = status === "programado" && pastPublish;
  const isMissed = status === "por_publicar" && pastPublish;

  let borderColor = imp.color;
  let bgTint = "";
  if (status === "publicado") {
    borderColor = "#16a34a";
    bgTint = "bg-green-500/5";
  } else if (isOverdueScheduled) {
    borderColor = "#dc2626";
    bgTint = "bg-destructive/5";
  } else if (status === "programado") {
    borderColor = "#2563eb";
  } else if (isMissed) {
    borderColor = "#dc2626";
    bgTint = "bg-destructive/5";
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-card border border-border rounded-lg p-4 hover:shadow-soft transition-shadow ${bgTint}`}
      style={{ borderLeftWidth: 4, borderLeftColor: borderColor, touchAction: "manipulation" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold flex-wrap">
          <span className="text-base">{fmt.icon}</span>
          <span>{fmt.label}</span>
          {pub.objective === "paid" && (
            <span className="text-[10px] uppercase tracking-wider bg-brand-soft text-foreground px-1.5 py-0.5 rounded">
              Pagado
            </span>
          )}
          {status === "publicado" && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-green-500/15 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3" /> Publicado
            </span>
          )}
          {status === "programado" && !isOverdueScheduled && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-blue-500/15 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">
              <CalendarClock className="w-3 h-3" /> Programado
            </span>
          )}
          {isOverdueScheduled && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-destructive/15 text-destructive px-1.5 py-0.5 rounded">
              <AlertTriangle className="w-3 h-3" /> Fuera de tiempo
              <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            </span>
          )}
          {isMissed && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-destructive/15 text-destructive px-1.5 py-0.5 rounded">
              <XCircle className="w-3 h-3" /> No publicado
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {pub.platforms.map((id) => (
            <img key={id} src={platformById(id).logo} alt={id} className="w-5 h-5" />
          ))}
        </div>
      </div>

      <p className="mt-2 text-sm text-foreground/80 line-clamp-2">
        {pub.copy || pub.imageText || "—"}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`px-2 py-1 rounded ${
            (isOverdueScheduled || isMissed)
              ? "bg-destructive/15 text-destructive border border-destructive/30"
              : "bg-muted text-muted-foreground"
          }`}
        >
          Publica {format(publishDt, "dd MMM HH:mm")}
        </span>
        <span className="text-muted-foreground">
          Entrega {format(parseISO(pub.deliveryDate), "dd MMM")}
        </span>
      </div>
    </button>
  );
}
