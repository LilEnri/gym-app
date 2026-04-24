import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <GlassCard variant="strong" className="p-7">
      <h1 className="text-2xl font-semibold tracking-tight">Crea account</h1>
      <p className="mt-1 text-sm text-white/60">
        Registrati come allievo. Il tuo coach ti collegherà al resto del sistema.
      </p>

      <div className="mt-6">
        <RegisterForm />
      </div>

      <p className="mt-6 text-sm text-white/60 text-center">
        Hai già un account?{" "}
        <Link href="/login" className="text-brand-400 hover:text-brand-300">
          Accedi
        </Link>
      </p>
    </GlassCard>
  );
}
