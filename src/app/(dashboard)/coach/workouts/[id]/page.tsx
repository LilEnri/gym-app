import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/glass-card";
import { setWorkoutActiveAction } from "../actions";
import { DayList } from "./day-list";
import { DeleteWorkoutButton } from "./delete-workout-button";

export const dynamic = "force-dynamic";

type Workout = {
  id: string;
  title: string;
  description: string | null;
  structure: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  user_id: string;
  athlete?: { id: string; full_name: string | null } | { id: string; full_name: string | null }[] | null;
};

type Day = {
  id: string;
  label: string;
  order_index: number;
  notes: string | null;
};

type ExerciseLib = {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string | null;
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
  exercises?: ExerciseLib | ExerciseLib[] | null;
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkoutDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workoutData } = await supabase
    .from("workouts")
    .select(
      "id, title, description, structure, is_active, start_date, end_date, user_id, athlete:user_id(id, full_name)",
    )
    .eq("id", id)
    .eq("coach_id", user.id)
    .maybeSingle();

  if (!workoutData) notFound();
  const workout = workoutData as Workout;
  const athlete = Array.isArray(workout.athlete) ? workout.athlete[0] : workout.athlete;

  const { data: daysData } = await supabase
    .from("workout_days")
    .select("id, label, order_index, notes")
    .eq("workout_id", id)
    .order("order_index", { ascending: true });

  const days = (daysData ?? []) as Day[];

  // Carica tutti gli esercizi di tutti i giorni in un colpo
  let exercises: DayExercise[] = [];
  if (days.length > 0) {
    const dayIds = days.map((d) => d.id);
    const { data: exData } = await supabase
      .from("workout_exercises")
      .select(
        "id, workout_day_id, exercise_id, order_index, sets, target_reps, rest_seconds, notes, exercises:exercise_id(id, name, muscle_group, equipment)",
      )
      .in("workout_day_id", dayIds)
      .order("order_index", { ascending: true });
    exercises = (exData ?? []) as DayExercise[];
  }

  // Libreria esercizi
  const { data: libraryData } = await supabase
    .from("exercises")
    .select("id, name, muscle_group, equipment")
    .order("muscle_group", { ascending: true })
    .order("name", { ascending: true });
  const library = (libraryData ?? []) as ExerciseLib[];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Link
          href="/coach/workouts"
          className="h-9 w-9 grid place-items-center rounded-xl glass text-white/70 hover:text-white shrink-0"
          aria-label="Indietro"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight truncate">
            {workout.title}
          </h1>
          <p className="mt-0.5 text-sm text-white/60 truncate">
            {athlete?.full_name ?? "Allievo"} · {workout.structure}
            {workout.is_active && (
              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-medium uppercase tracking-wider">
                Attiva
              </span>
            )}
          </p>
        </div>
      </div>

      {workout.description && (
        <GlassCard>
          <p className="text-sm text-white/80 whitespace-pre-wrap">{workout.description}</p>
        </GlassCard>
      )}

      <div className="flex flex-wrap gap-2">
        <form action={setWorkoutActiveAction}>
          <input type="hidden" name="id" value={workout.id} />
          <input type="hidden" name="setActive" value={(!workout.is_active).toString()} />
          <button
            type="submit"
            className={
              workout.is_active
                ? "h-9 px-3 rounded-lg text-sm font-medium glass text-white hover:bg-white/10"
                : "h-9 px-3 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500"
            }
          >
            {workout.is_active ? "Archivia" : "Imposta come attiva"}
          </button>
        </form>

        <DeleteWorkoutButton workoutId={workout.id} />
      </div>

      <DayList workoutId={workout.id} days={days} exercises={exercises} library={library} />
    </div>
  );
}
