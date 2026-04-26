import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/glass-card";
import { LogSessionForm } from "./log-form";

export const dynamic = "force-dynamic";

type Day = {
  id: string;
  workout_id: string;
  label: string;
  notes: string | null;
};

type ExerciseLib = {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string | null;
  image_url: string | null;
};

type DayExercise = {
  id: string;
  workout_day_id: string;
  exercise_id: string;
  order_index: number;
  sets: number;
  target_reps: string;
  rest_seconds: number | null;
  notes: string | null;
  exercises: ExerciseLib | ExerciseLib[] | null;
};

interface PageProps {
  params: Promise<{ dayId: string }>;
}

export default async function WorkoutDayPage({ params }: PageProps) {
  const { dayId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Carica il giorno + verifica che la scheda padre appartenga all'utente
  const { data: dayData } = await supabase
    .from("workout_days")
    .select("id, workout_id, label, notes, workouts:workout_id(user_id, title)")
    .eq("id", dayId)
    .maybeSingle();

  if (!dayData) notFound();

  type WorkoutMeta = { user_id: string; title: string };
  const workoutsField = (dayData as { workouts?: WorkoutMeta | WorkoutMeta[] | null }).workouts;
  const workoutMeta = Array.isArray(workoutsField) ? workoutsField[0] : workoutsField;

  if (!workoutMeta || workoutMeta.user_id !== user.id) {
    notFound();
  }

  const day = dayData as unknown as Day;

  const { data: exData } = await supabase
    .from("workout_exercises")
    .select(
      "id, workout_day_id, exercise_id, order_index, sets, target_reps, rest_seconds, notes, exercises:exercise_id(id, name, muscle_group, equipment, image_url)",
    )
    .eq("workout_day_id", dayId)
    .order("order_index", { ascending: true });

  const exercises = (exData ?? []) as DayExercise[];

  function pickEx(de: DayExercise): ExerciseLib | undefined {
    return Array.isArray(de.exercises) ? de.exercises[0] : (de.exercises ?? undefined);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Link
          href="/user"
          className="h-9 w-9 grid place-items-center rounded-xl glass text-white/70 hover:text-white shrink-0"
          aria-label="Indietro"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/50 uppercase tracking-wider">{workoutMeta.title}</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight truncate">
            {day.label}
          </h1>
        </div>
      </div>

      {day.notes && (
        <GlassCard>
          <p className="text-sm text-white/80 whitespace-pre-wrap">{day.notes}</p>
        </GlassCard>
      )}

      {exercises.length === 0 ? (
        <GlassCard className="text-center py-10">
          <p className="text-sm text-white/60">
            Il coach non ha ancora aggiunto esercizi a questo giorno.
          </p>
        </GlassCard>
      ) : (
        <LogSessionForm
          dayId={dayId}
          exercises={exercises.map((de) => {
            const lib = pickEx(de);
            return {
              id: de.id,
              exerciseId: de.exercise_id,
              name: lib?.name ?? "Esercizio",
              equipment: lib?.equipment ?? null,
              muscleGroup: lib?.muscle_group ?? "",
              imageUrl: lib?.image_url ?? null,
              sets: de.sets,
              targetReps: de.target_reps,
              restSeconds: de.rest_seconds,
              notes: de.notes,
            };
          })}
        />
      )}
    </div>
  );
}
