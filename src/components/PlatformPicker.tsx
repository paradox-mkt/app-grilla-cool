import { PLATFORMS } from "@/lib/platforms";
import type { PlatformId } from "@/lib/types";

export function PlatformPicker({
  selected,
  onChange,
}: {
  selected: PlatformId[];
  onChange: (ids: PlatformId[]) => void;
}) {
  const toggle = (id: PlatformId) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="flex flex-wrap gap-2">
      {PLATFORMS.map((p) => {
        const active = selected.includes(p.id);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => toggle(p.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 text-sm transition-colors ${
              active ? "bg-card" : "bg-card/50 border-border text-muted-foreground hover:text-foreground"
            }`}
            style={active ? { borderColor: p.color, color: p.color } : undefined}
          >
            <img src={p.logo} alt={p.label} className="w-5 h-5" />
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
