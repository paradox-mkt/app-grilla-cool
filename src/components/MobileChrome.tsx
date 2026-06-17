import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Calendar as CalIcon,
  List,
  Lightbulb,
  Settings,
  Menu,
  LogOut,
  ArrowLeftRight,
  Sun,
  Moon,
} from "lucide-react";
import type { Brand } from "@/lib/types";
import { useAuth, initials } from "@/store/auth";
import { useUI } from "@/store/ui";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function MobileHeader({ brand }: { brand: Brand }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const logout = useAuth((s) => s.logout);
  const me = useAuth((s) => s.users.find((u) => u.id === s.currentUserId));
  const { theme, toggleTheme } = useUI();

  return (
    <header className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-3 py-2.5 flex items-center gap-2">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            className="p-2 rounded-md hover:bg-accent"
            style={{ touchAction: "manipulation" }}
            aria-label="Menú"
          >
            <Menu className="w-5 h-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full" style={{ background: brand.color }} />
              <div className="min-w-0">
                <div className="font-bold truncate">{brand.name}</div>
                <div className="text-xs text-muted-foreground">Paradox Content Grid</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 justify-start gap-2"
              onClick={() => {
                setOpen(false);
                navigate({ to: "/brands" });
              }}
            >
              <ArrowLeftRight className="w-4 h-4" />
              Cambiar marca
            </Button>
          </div>
          <div className="p-3 mt-auto border-t border-border space-y-1">
            {me && (
              <div className="flex items-center gap-3 px-3 py-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: brand.color }}
                >
                  {initials(me.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{me.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{me.role}</div>
                </div>
              </div>
            )}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              Modo {theme === "dark" ? "claro" : "oscuro"}
            </button>
            <button
              onClick={() => {
                logout();
                setOpen(false);
                navigate({ to: "/login" });
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: brand.color }} />
        <span className="font-bold truncate">{brand.name}</span>
      </div>
    </header>
  );
}

export function MobileBottomNav({ brand }: { brand: Brand }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { to: `/b/${brand.id}/calendar`, label: "Calendario", icon: CalIcon },
    { to: `/b/${brand.id}/list`, label: "Lista", icon: List },
    { to: `/b/${brand.id}/ideas`, label: "Ideas", icon: Lightbulb },
    { to: `/settings`, label: "Ajustes", icon: Settings },
  ];
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur border-t border-border flex justify-around pb-[env(safe-area-inset-bottom)]"
      style={{ touchAction: "manipulation" }}
    >
      {items.map((it) => {
        const Icon = it.icon;
        const active = path.startsWith(it.to);
        return (
          <Link
            key={it.to}
            to={it.to}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium"
            style={active ? { color: brand.color } : { color: "var(--muted-foreground)" }}
          >
            <Icon className="w-5 h-5" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
