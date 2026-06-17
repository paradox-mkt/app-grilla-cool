import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Calendar as CalIcon, List, Lightbulb, Settings, LogOut, Sun, Moon, ArrowLeftRight } from "lucide-react";
import type { Brand } from "@/lib/types";
import { useAuth, initials } from "@/store/auth";
import { useUI } from "@/store/ui";
import { Button } from "@/components/ui/button";

export function BrandSidebar({ brand }: { brand: Brand }) {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const logout = useAuth((s) => s.logout);
  const me = useAuth((s) => s.users.find((u) => u.id === s.currentUserId));
  const { theme, toggleTheme } = useUI();

  const nav = [
    { to: `/b/${brand.id}/calendar`, label: "Calendario", icon: CalIcon },
    { to: `/b/${brand.id}/list`, label: "Lista", icon: List },
    { to: `/b/${brand.id}/ideas`, label: "Banco de Ideas", icon: Lightbulb },
  ];

  return (
    <aside className="hidden md:flex w-64 shrink-0 h-screen sticky top-0 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="p-5 border-b border-sidebar-border">
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
          onClick={() => navigate({ to: "/brands" })}
        >
          <ArrowLeftRight className="w-4 h-4" />
          Cambiar marca
        </Button>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => {
          const active = path.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-soft text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              style={active ? { color: brand.color } : undefined}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-1">
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
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <Settings className="w-4 h-4" /> Ajustes
        </Link>
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
            navigate({ to: "/login" });
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
