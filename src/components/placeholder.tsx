import { Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

export function Placeholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <GlassCard className="text-center py-12">
        <div className="mx-auto h-12 w-12 rounded-xl glass-brand grid place-items-center">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-semibold">Arriva presto</h2>
        <p className="mt-1 text-sm text-white/60 max-w-sm mx-auto">
          {description ?? "Questa sezione è in costruzione. Torna tra poco."}
        </p>
      </GlassCard>
    </div>
  );
}
