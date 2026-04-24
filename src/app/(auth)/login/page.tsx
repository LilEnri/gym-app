import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <GlassCard variant="strong" className="p-7">
      <h1 className="text-2xl font-semibold tracking-tight">Accedi</h1>
      <p className="mt-1 text-sm text-white/60">
        Bentornato. Inserisci le tue credenziali per continuare.
      </p>

      <div className="mt-6">
        <LoginForm />
      </div>

      <p className="mt-6 text-sm text-white/60 text-center">
        Non hai un account?{" "}
        <Link href="/register" className="text-brand-400 hover:text-brand-300">
          Registrati
        </Link>
      </p>
    </GlassCard>
  );
}
