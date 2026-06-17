import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useData } from "@/store/data";
import { PublicationCard } from "@/components/PublicationCard";
import { PublicationModal } from "@/components/PublicationModal";
import { ExportButton } from "@/components/ExportButton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/b/$brandId/list")({
  component: ListView,
});

function ListView() {
  const { brandId } = Route.useParams();
  const brand = useData((s) => s.brands.find((b) => b.id === brandId));
  const allPubs = useData((s) => s.publications);

  const publications = useMemo(
    () => allPubs.filter((p) => p.brandId === brandId),
    [allPubs, brandId]
  );

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [hideEmpty, setHideEmpty] = useState(true);
  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof publications>();
    publications
      .slice()
      .sort((a, b) => a.publishDate.localeCompare(b.publishDate))
      .forEach((p) => {
        const k = format(parseISO(p.publishDate), "yyyy-MM-dd");
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(p);
      });
    return Array.from(map.entries());
  }, [publications]);

  if (!brand) return null;

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Lista</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {publications.length} publicación{publications.length === 1 ? "" : "es"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setHideEmpty(!hideEmpty)}>
            {hideEmpty ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
            {hideEmpty ? "Mostrar días vacíos" : "Ocultar días vacíos"}
          </Button>
          <ExportButton brand={brand} publications={publications} />
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl text-muted-foreground">
          <div className="text-5xl mb-2">📭</div>
          <p>No hay publicaciones todavía.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([day, items]) => {
            const isOpen = !collapsed.has(day);
            return (
              <div key={day} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() =>
                    setCollapsed((c) => {
                      const n = new Set(c);
                      if (n.has(day)) n.delete(day);
                      else n.add(day);
                      return n;
                    })
                  }
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-accent"
                >
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className="font-semibold capitalize">
                    {format(parseISO(day), "EEEE dd 'de' MMMM")}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {items.length} publicación{items.length === 1 ? "" : "es"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 space-y-3">
                    {items.map((p) => (
                      <PublicationCard
                        key={p.id}
                        pub={p}
                        onClick={() => {
                          setEditId(p.id);
                          setModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <PublicationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        pubId={editId}
        brandId={brandId}
      />
    </div>
  );
}
