import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Brand, Publication } from "@/lib/types";
import { formatById, importanceById, platformById } from "@/lib/platforms";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  brand: Brand;
  publications: Publication[];
  onDayClick: (date: Date) => void;
}

const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DOW_FULL = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

function statusColor(p: Publication, brandColor: string) {
  const now = new Date();
  const past = isAfter(now, parseISO(p.publishDate));
  const status = p.status || "por_publicar";
  if (status === "publicado") return { color: "#16a34a", icon: "✓" as string | null };
  if (status === "programado" && past) return { color: "#dc2626", icon: "⚠️" };
  if (status === "programado") return { color: "#2563eb", icon: null };
  if (status === "por_publicar" && past) return { color: "#dc2626", icon: "✗" };
  return { color: brandColor, icon: null };
}

export function CalendarGrid({ brand, publications, onDayClick }: Props) {
  const [month, setMonth] = useState(new Date());
  const isMobile = useIsMobile();

  const monthDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfMonth(month),
        end: endOfMonth(month),
      }),
    [month]
  );

  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const pubsByDay = useMemo(() => {
    const map = new Map<string, Publication[]>();
    publications.forEach((p) => {
      const key = format(parseISO(p.publishDate), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return map;
  }, [publications]);

  const today = new Date();

  const TopBar = (
    <div className="sticky top-0 z-20 -mx-4 md:mx-0 bg-background/95 backdrop-blur border-b border-border md:border-0 px-4 md:px-0 py-3 md:py-0 md:static md:bg-transparent flex items-center justify-between gap-2 mb-4 md:mb-6">
      <div className="min-w-0">
        <h1 className="text-xl md:text-3xl font-bold capitalize truncate">
          {format(month, "MMMM yyyy")}
        </h1>
        <p className="hidden md:block text-sm text-muted-foreground mt-1">
          {publications.length} publicación{publications.length === 1 ? "" : "es"} este mes
        </p>
      </div>
      <div className="flex gap-1.5 md:gap-2 shrink-0">
        <Button variant="outline" size="icon" onClick={() => setMonth(subMonths(month, 1))} style={{ touchAction: "manipulation" }}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" onClick={() => setMonth(new Date())} style={{ touchAction: "manipulation" }}>
          Hoy
        </Button>
        <Button variant="outline" size="icon" onClick={() => setMonth(addMonths(month, 1))} style={{ touchAction: "manipulation" }}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div>
        {TopBar}
        <div className="space-y-2">
          {monthDays.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const items = pubsByDay.get(key) || [];
            const isToday = isSameDay(d, today);
            const dow = DOW_FULL[(d.getDay() + 6) % 7];
            return (
              <button
                key={key}
                onClick={() => onDayClick(d)}
                className={`w-full text-left bg-card border border-border rounded-xl p-3 flex gap-3 items-start hover:shadow-soft transition-shadow ${
                  isToday ? "ring-2" : ""
                }`}
                style={{
                  touchAction: "manipulation",
                  ...(isToday ? { boxShadow: `0 0 0 2px ${brand.color}` } : {}),
                }}
              >
                <div className="shrink-0 w-14 text-center">
                  <div
                    className={`text-2xl font-bold ${isToday ? "" : ""}`}
                    style={isToday ? { color: brand.color } : undefined}
                  >
                    {format(d, "d")}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {dow.slice(0, 3)}
                  </div>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  {items.length === 0 ? (
                    <div className="text-xs text-muted-foreground/70 italic py-2">
                      Sin publicaciones
                    </div>
                  ) : (
                    items.map((p) => {
                      const imp = importanceById(p.importance);
                      const fmt = formatById(p.format);
                      const sc = statusColor(p, brand.color);
                      return (
                        <div
                          key={p.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded text-xs bg-background border border-border"
                          style={{ borderLeftWidth: 3, borderLeftColor: sc.color || imp.color }}
                        >
                          {p.platforms.slice(0, 1).map((id) => (
                            <img key={id} src={platformById(id).logo} alt="" className="w-4 h-4 shrink-0" />
                          ))}
                          <span className="shrink-0">{fmt.icon}</span>
                          <span className="truncate flex-1">
                            {p.copy || p.imageText || fmt.label}
                          </span>
                          {sc.icon && <span className="shrink-0">{sc.icon}</span>}
                        </div>
                      );
                    })
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      {TopBar}
      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border shadow-soft">
        {DOW.map((d) => (
          <div
            key={d}
            className="bg-card px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {gridDays.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const items = pubsByDay.get(key) || [];
          const inMonth = isSameMonth(d, month);
          const isToday = isSameDay(d, today);
          return (
            <button
              key={key}
              onClick={() => onDayClick(d)}
              className={`bg-card min-h-[110px] p-2 text-left flex flex-col gap-1 hover:bg-accent transition-colors ${
                inMonth ? "" : "opacity-40"
              }`}
              style={{ touchAction: "manipulation" }}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-semibold inline-flex items-center justify-center w-7 h-7 rounded-full ${
                    isToday ? "text-white" : ""
                  }`}
                  style={isToday ? { background: brand.color } : undefined}
                >
                  {format(d, "d")}
                </span>
                {items.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">{items.length}</span>
                )}
              </div>
              <div className="space-y-1 overflow-hidden">
                {items.slice(0, 3).map((p) => {
                  const fmt = formatById(p.format);
                  const sc = statusColor(p, brand.color);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-1.5 px-1.5 py-1 rounded text-xs bg-background border border-border"
                      style={{ borderLeftWidth: 3, borderLeftColor: sc.color }}
                      title={p.copy || p.imageText}
                    >
                      <span>{fmt.icon}</span>
                      <div className="flex -space-x-1">
                        {p.platforms.slice(0, 2).map((id) => (
                          <img
                            key={id}
                            src={platformById(id).logo}
                            alt=""
                            className="w-3 h-3 rounded-sm bg-white"
                          />
                        ))}
                      </div>
                      <span className="truncate flex-1 text-foreground/80">
                        {p.copy || p.imageText || "Sin texto"}
                      </span>
                      {p.status === "publicado" && <CheckCircle2 className="w-3 h-3 text-green-600 shrink-0" />}
                      {p.status === "programado" && isAfter(new Date(), parseISO(p.publishDate)) && (
                        <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
                      )}
                    </div>
                  );
                })}
                {items.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1.5">
                    +{items.length - 3} más
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
