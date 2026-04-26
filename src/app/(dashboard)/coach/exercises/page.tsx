import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/glass-card";
import { ExercisesManager } from "./exercises-manager";

export const dynamic = "force-dynamic";

type Exercise = {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string | null;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  is_preset: boolean;
};

export default async function CoachExercisesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("exercises")
    .select("id, name, muscle_group, equipment, description, image_url, video_url, is_preset")
    .order("muscle_group", { ascending: true })
    .order("name", { ascending: true });

  const exercises = (data ?? []) as Exercise[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Esercizi</h1>
        <p className="mt-1 text-sm text-white/60">
          Libreria condivisa. Aggiungi immagini per rendere gli esercizi più chiari ai tuoi allievi.
        </p>
      </div>

      {exercises.length === 0 ? (
        <GlassCard className="text-center py-10">
          <p className="text-sm text-white/60">Nessun esercizio in libreria.</p>
        </GlassCard>
      ) : (
        <ExercisesManager exercises={exercises} />
      )}
    </div>
  );
}
