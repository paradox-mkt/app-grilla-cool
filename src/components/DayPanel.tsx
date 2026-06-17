import { format } from "date-fns";
import { Plus } from "lucide-react";
import type { Publication } from "@/lib/types";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { PublicationCard } from "./PublicationCard";

interface Props {
  date: Date | null;
  publications: Publication[];
  onClose: () => void;
  onNew: () => void;
  onSelect: (id: string) => void;
}

export function DayPanel({ date, publications, onClose, onNew, onSelect }: Props) {
  const isMobile = useIsMobile();
  return (
    <Sheet open={!!date} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "h-[85vh] max-h-[85vh] p-0 flex flex-col rounded-t-2xl"
            : "w-[480px] sm:max-w-[480px] p-0 flex flex-col"
        }
      >
        {date && (
          <>
            {isMobile && (
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
              </div>
            )}
            <div className="px-6 py-4 md:py-5 border-b border-border">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {format(date, "EEEE")}
              </div>
              <SheetTitle className="text-xl md:text-2xl font-bold capitalize">
                {format(date, "dd 'de' MMMM, yyyy")}
              </SheetTitle>
              <div className="text-xs text-muted-foreground mt-1">
                {publications.length} publicación{publications.length === 1 ? "" : "es"}
              </div>
            </div>

            <div className="p-4 md:p-6">
              <Button
                onClick={onNew}
                className="w-full bg-brand text-white hover:opacity-90"
                style={{ touchAction: "manipulation" }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva publicación
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 md:px-6 pb-6 space-y-3">
              {publications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="text-4xl mb-2">🗓️</div>
                  <p className="text-sm">Sin publicaciones para este día</p>
                </div>
              ) : (
                publications.map((p) => (
                  <PublicationCard key={p.id} pub={p} onClick={() => onSelect(p.id)} />
                ))
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
