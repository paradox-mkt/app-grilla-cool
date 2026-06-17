import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Iniciar sesión — Paradox Content Grid" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const me = useAuth((s) => s.currentUserId);
  const ready = useAuth((s) => s.ready);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && me) navigate({ to: "/brands", replace: true });
  }, [ready, me, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(email, password);
      if (!u) {
        toast.error("Credenciales inválidas");
        return;
      }
      toast.success(`Bienvenido, ${u.name}`);
      navigate({ to: "/brands" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-soft"
            style={{ background: "#01696f" }}
          >
            P
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Paradox Content Grid</h1>
            <p className="text-sm text-muted-foreground mt-1">Tu grilla. Tu agencia.</p>
          </div>
        </div>

        <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-4">
          <div>
            <Label htmlFor="email" className="mb-1.5">Correo</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password" className="mb-1.5">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-brand text-white hover:opacity-90">
            {busy ? "Entrando…" : "Entrar"}
          </Button>
          <div className="text-xs text-muted-foreground text-center pt-2">
            ¿No tienes cuenta? Pide a un administrador que te invite desde Ajustes.
          </div>
        </form>
      </div>
    </div>
  );
}
