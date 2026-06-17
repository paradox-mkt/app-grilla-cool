import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth, initials } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Ajustes — Paradox Content Grid" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const me = useAuth((s) => s.users.find((u) => u.id === s.currentUserId));
  const authReady = useAuth((s) => s.ready);
  const currentUserId = useAuth((s) => s.currentUserId);
  const { users, createUser, deleteUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member" as "admin" | "member" });

  useEffect(() => {
    if (authReady && !currentUserId) navigate({ to: "/login", replace: true });
  }, [authReady, currentUserId, navigate]);

  if (!me) return null;

  const save = async () => {
    if (!form.name || !form.email || !form.password) return toast.error("Completa los campos");
    if (users.some((u) => u.email.toLowerCase() === form.email.toLowerCase())) {
      return toast.error("Ese correo ya existe");
    }
    setBusy(true);
    try {
      const u = await createUser(form);
      if (!u) return toast.error("No se pudo crear el usuario");
      toast.success("Usuario creado");
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "member" });
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/brands">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Volver</Button>
          </Link>
          <h1 className="font-bold">Ajustes</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <section className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-4">Equipo</h2>
          {me.role !== "admin" ? (
            <p className="text-sm text-muted-foreground">Solo los administradores pueden gestionar usuarios.</p>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-brand text-white hover:opacity-90">
                      <Plus className="w-4 h-4 mr-2" /> Nuevo usuario
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nuevo usuario</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label className="mb-1.5">Nombre</Label>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      </div>
                      <div>
                        <Label className="mb-1.5">Correo</Label>
                        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                      </div>
                      <div>
                        <Label className="mb-1.5">Contraseña</Label>
                        <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                      </div>
                      <div>
                        <Label className="mb-1.5">Rol</Label>
                        <select
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                          value={form.role}
                          onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "member" })}
                        >
                          <option value="member">Miembro</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                      <Button onClick={save} className="w-full bg-brand text-white hover:opacity-90">
                        Crear
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="divide-y divide-border">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 py-3">
                    <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {initials(u.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{u.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                    </div>
                    <span className="text-xs uppercase tracking-wider bg-muted px-2 py-1 rounded">{u.role}</span>
                    {u.id !== me.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("¿Eliminar usuario?")) {
                            deleteUser(u.id);
                            toast.success("Usuario eliminado");
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-2">Sobre Paradox Content Grid</h2>
          <p className="text-sm text-muted-foreground">
            App instalable (PWA). Todos los datos se guardan localmente en tu navegador.
          </p>
        </section>
      </main>
    </div>
  );
}
