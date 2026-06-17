import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { isAfter, parseISO } from "date-fns";
import { useAuth } from "@/store/auth";
import { useData } from "@/store/data";
import { useBrandAccent } from "@/hooks/use-brand-accent";
import { BrandSidebar } from "@/components/BrandSidebar";
import { MobileHeader, MobileBottomNav } from "@/components/MobileChrome";

export const Route = createFileRoute("/b/$brandId")({
  component: BrandLayout,
});

function BrandLayout() {
  const { brandId } = Route.useParams();
  const navigate = useNavigate();
  const me = useAuth((s) => s.currentUserId);
  const authReady = useAuth((s) => s.ready);
  const hydrated = useData((s) => s.hydrated);
  const brand = useBrandAccent(brandId);
  const publications = useData((s) => s.publications);
  const updatePublication = useData((s) => s.updatePublication);

  useEffect(() => {
    if (authReady && !me) navigate({ to: "/login", replace: true });
  }, [authReady, me, navigate]);

  useEffect(() => {
    if (hydrated && !brand) navigate({ to: "/brands", replace: true });
  }, [hydrated, brand, navigate]);


  // Auto-flag overdue scheduled publications.
  useEffect(() => {
    const check = () => {
      const now = new Date();
      publications.forEach((p) => {
        if (p.status === "programado" && !p.isOverdue) {
          const pd = parseISO(p.publishDate);
          const grace = new Date(pd.getTime() + 5 * 60 * 1000);
          if (isAfter(now, grace)) {
            updatePublication(p.id, { isOverdue: true });
            const preview = (p.copy || p.imageText || "Publicación").slice(0, 60);
            toast.warning(`⚠️ ${preview} no fue marcada como publicada`);
          }
        }
      });
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [publications, updatePublication]);

  if (!me || !brand) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Cargando…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <BrandSidebar brand={brand} />
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileHeader brand={brand} />
        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          <Outlet />
        </main>
        <MobileBottomNav brand={brand} />
      </div>
    </div>
  );
}
