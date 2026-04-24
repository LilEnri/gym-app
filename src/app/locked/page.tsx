import { Lock } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

export default function LockedPage() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-5">
      <GlassCard variant="strong" className="max-w-md w-full text-center p-8">
        <div className="mx-auto h-12 w-12 rounded-xl glass-brand grid place-items-center">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">Account bloccato</h1>
        <p className="mt-2 text-sm text-white/60">
          Il tuo account è stato sospeso. Contatta l&apos;amministrazione della palestra.
        </p>
        <form action="/auth/signout" method="post" className="mt-6">
          <Button type="submit" variant="glass" className="w-full">Esci</Button>
        </form>
      </GlassCard>
    </main>
  );
}
