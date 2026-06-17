import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, LogOut, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth, initials } from "@/store/auth";
import { useData } from "@/store/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/brands")({
  head: () => ({ meta: [{ title: "Marcas — Paradox Content Grid" }] }),
  component: BrandsPage,
});

function BrandsPage() {
  const navigate = useNavigate();
  const me = useAuth((s) => s.users.find((u) => u.id === s.currentUserId));
  const authReady = useAuth((s) => s.ready);
  const currentUserId = useAuth((s) => s.currentUserId);
  const logout = useAuth((s) => s.logout);
  const { brands, addBrand, updateBrand, deleteBrand } = useData();
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", color: "#01696f", description: "" });

  useEffect(() => {
    if (authReady && !currentUserId) navigate({ to: "/login", replace: true });
  }, [authReady, currentUserId, navigate]);


  const openNew = () => {
    setEditId(null);
    setForm({ name: "", color: "#01696f", description: "" });
    setOpen(true);
  };
  const openEdit = (id: string) => {
    const b = brands.find((x) => x.id === id);
    if (!b) return;
    setEditId(id);
    setForm({ name: b.name, color: b.color, description: b.description ?? "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Nombre requerido");
    try {
      if (editId) {
        await updateBrand(editId, form);
        toast.success("Marca actualizada");
      } else {
        await addBrand(form);
        toast.success("Marca creada");
      }
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    }
  };


  const remove = (id: string) => {
    if (confirm("¿Eliminar marca? Se eliminarán sus publicaciones e ideas.")) {
      deleteBrand(id);
      toast.success("Marca eliminada");
    }
  };

  if (!me) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black" style={{ background: "#01696f" }}>P</div>
            <div>
              <div className="font-bold">Paradox Content Grid</div>
              <div className="text-xs text-muted-foreground">Selecciona una marca</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                {initials(me.name)}
              </div>
              <span>{me.name}</span>
            </div>
            <Link to="/settings">
              <Button variant="outline" size="icon"><SettingsIcon className="w-4 h-4" /></Button>
            </Link>
            <Button variant="outline" size="icon" onClick={() => { logout(); navigate({ to: "/login" }); }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Marcas</h1>
            <p className="text-sm text-muted-foreground mt-1">Cada marca es una grilla independiente.</p>
          </div>
          {me.role === "admin" && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNew} className="bg-brand text-white hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" /> Nueva marca
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editId ? "Editar marca" : "Nueva marca"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="mb-1.5">Nombre</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label className="mb-1.5">Color</Label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={form.color}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                        className="w-12 h-10 rounded cursor-pointer border border-border"
                      />
                      <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1.5">Descripción</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
                  </div>
                  <Button onClick={save} className="w-full bg-brand text-white hover:opacity-90">
                    Guardar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {brands.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl">
            <div className="text-5xl mb-2">📦</div>
            <p className="text-muted-foreground">Aún no hay marcas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((b) => (
              <div
                key={b.id}
                className="group relative bg-card border border-border rounded-2xl p-5 hover:shadow-soft transition-shadow"
              >
                <Link
                  to="/b/$brandId/calendar"
                  params={{ brandId: b.id }}
                  className="flex items-start gap-4"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-black shrink-0"
                    style={{ background: b.color }}
                  >
                    {b.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{b.name}</div>
                    {b.description && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.description}</div>
                    )}
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-2 h-2 rounded-full" style={{ background: b.color }} />
                      {b.color.toUpperCase()}
                    </div>
                  </div>
                </Link>
                {me.role === "admin" && (
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(b.id)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(b.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
