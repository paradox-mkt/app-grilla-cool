import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { parseISO, isSameDay } from "date-fns";
import { useData } from "@/store/data";
import { CalendarGrid } from "@/components/CalendarGrid";
import { DayPanel } from "@/components/DayPanel";
import { PublicationModal } from "@/components/PublicationModal";
import { ExportButton } from "@/components/ExportButton";

export const Route = createFileRoute("/b/$brandId/calendar")({
  component: CalendarView,
});

function CalendarView() {
  const { brandId } = Route.useParams();
  const brand = useData((s) => s.brands.find((b) => b.id === brandId));
  const allPubs = useData((s) => s.publications);
  const publications = useMemo(
    () => allPubs.filter((p) => p.brandId === brandId),
    [allPubs, brandId]
  );

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [initialDate, setInitialDate] = useState<Date | undefined>(undefined);

  if (!brand) return null;

  const dayPubs = selectedDay
    ? publications.filter((p) => isSameDay(parseISO(p.publishDate), selectedDay))
    : [];

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-end mb-4">
        <ExportButton brand={brand} publications={publications} />
      </div>
      <CalendarGrid
        brand={brand}
        publications={publications}
        onDayClick={(d) => setSelectedDay(d)}
      />

      <DayPanel
        date={selectedDay}
        publications={dayPubs}
        onClose={() => setSelectedDay(null)}
        onNew={() => {
          setEditId(undefined);
          setInitialDate(selectedDay ?? undefined);
          setModalOpen(true);
        }}
        onSelect={(id) => {
          setEditId(id);
          setInitialDate(undefined);
          setModalOpen(true);
        }}
      />

      <PublicationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        pubId={editId}
        brandId={brandId}
        initialDate={initialDate}
      />
    </div>
  );
}
