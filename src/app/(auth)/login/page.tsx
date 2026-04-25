import { Dumbbell } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl glass-brand">
          <Dumbbell className="h-7 w-7 text-white" />
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight">
          <span className="text-gradient-brand">Gym App</span>
        </h1>
        <p className="mt-2 text-sm text-white/60">Accedi per allenarti meglio.</p>
      </div>

      <GlassCard variant="strong" className="p-7">
        <LoginForm />
      </GlassCard>

      <p className="mt-6 text-center text-xs text-white/40">
        L&apos;accesso è su invito. Contatta il tuo coach se hai problemi.
      </p>
    </div>
  );
}
