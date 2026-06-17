import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const ready = useAuth((s) => s.ready);
  const me = useAuth((s) => s.currentUserId);
  useEffect(() => {
    if (!ready) return;
    navigate({ to: me ? "/brands" : "/login", replace: true });
  }, [ready, me, navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-muted-foreground text-sm">Cargando…</div>
    </div>
  );
}
