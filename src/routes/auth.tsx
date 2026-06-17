import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Acceso — Paradox Content Grid" }] }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/brands", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/brands",
            data: { full_name: fullName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Cuenta creada. Revisa tu correo si la confirmación está activa.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bienvenido");
        navigate({ to: "/brands" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error de autenticación";
      toast.error(msg);
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
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "signin" ? "Inicia sesión para continuar" : "Crea tu cuenta"}
            </p>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-4"
        >
          {mode === "signup" && (
            <div>
              <Label htmlFor="name" className="mb-1.5">Nombre</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          )}
          <div>
            <Label htmlFor="email" className="mb-1.5">Correo</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password" className="mb-1.5">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-brand text-white hover:opacity-90">
            {busy ? "Procesando…" : mode === "signin" ? "Entrar" : "Crear cuenta"}
          </Button>
          <button
            type="button"
            className="block w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
          >
            {mode === "signin"
              ? "¿No tienes cuenta? Regístrate"
              : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
          {!isSupabaseConfigured && (
            <div className="text-xs text-destructive border border-destructive/30 rounded p-2">
              Supabase no configurado. Define <code>VITE_SUPABASE_URL</code> y{" "}
              <code>VITE_SUPABASE_ANON_KEY</code>.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
