"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Timer } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { saveSessionAction } from "./actions";

interface ExerciseInfo {
  id: string;            // workout_exercises.id
  exerciseId: string;    // exercises.id
  name: string;
  equipment: string | null;
  muscleGroup: string;
  imageUrl: string | null;
  sets: number;
  targetReps: string;
  restSeconds: number | null;
  notes: string | null;
}

export function LogSessionForm({
  dayId,
  exercises,
}: {
  dayId: string;
  exercises: ExerciseInfo[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await saveSessionAction(formData);
      } catch (e) {
        if (
          e &&
          typeof e === "object" &&
          "digest" in e &&
          String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
        ) {
          throw e;
        }
        setError(e instanceof Error ? e.message : "Errore");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="dayId" value={dayId} />

      {exercises.map((ex) => (
        <ExerciseBlock key={ex.id} exercise={ex} />
      ))}

      <GlassCard>
        <Label htmlFor="overallNotes">Note sessione (opz.)</Label>
        <textarea
          id="overallNotes"
          name="overallNotes"
          rows={3}
          className="w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-brand-500/60 focus:bg-white/[0.07] transition-colors px-4 py-3 resize-none"
          style={{ colorScheme: "dark" }}
          placeholder="Come ti sei sentito? Note generali…"
        />
      </GlassCard>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Salva sessione
      </Button>
    </form>
  );
}

function ExerciseBlock({ exercise }: { exercise: ExerciseInfo }) {
  const [completedSets, setCompletedSets] = useState<Set<number>>(new Set());

  function toggleSet(n: number) {
    setCompletedSets((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  return (
    <GlassCard variant="strong">
      <div className="mb-3 flex items-start gap-3">
        {exercise.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={exercise.imageUrl}
            alt={exercise.name}
            className="h-16 w-16 rounded-lg object-cover bg-white/5 shrink-0"
          />
        ) : null}
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold">{exercise.name}</h3>
          <p className="mt-0.5 text-xs text-white/60">
            {exercise.muscleGroup}
            {exercise.equipment && ` · ${exercise.equipment}`} · target {exercise.sets} ×{" "}
            {exercise.targetReps}
            {exercise.restSeconds && (
              <span className="inline-flex items-center gap-1 ml-2">
                <Timer className="h-3 w-3" />
                {exercise.restSeconds}s
              </span>
            )}
          </p>
          {exercise.notes && (
            <p className="mt-1 text-xs text-white/50 italic">{exercise.notes}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[28px_1fr_1fr_36px] gap-2 text-[10px] uppercase tracking-wider text-white/40 px-1">
          <div>#</div>
          <div>Peso (kg)</div>
          <div>Reps</div>
          <div></div>
        </div>
        {Array.from({ length: exercise.sets }, (_, i) => i + 1).map((setNumber) => {
          const done = completedSets.has(setNumber);
          const fieldBase = `set:${exercise.id}:${exercise.exerciseId}:${setNumber}`;
          return (
            <div
              key={setNumber}
              className={`grid grid-cols-[28px_1fr_1fr_36px] gap-2 items-center rounded-lg px-1 py-1 ${
                done ? "bg-emerald-500/10" : ""
              }`}
            >
              <div className="text-sm font-medium text-white/60 text-center">{setNumber}</div>
              <Input
                type="number"
                name={`${fieldBase}:weight`}
                step="0.5"
                min={0}
                placeholder="0"
                className="h-9 text-sm"
              />
              <Input
                type="number"
                name={`${fieldBase}:reps`}
                min={0}
                placeholder={exercise.targetReps}
                className="h-9 text-sm"
              />
              <input
                type="hidden"
                name={`${fieldBase}:done`}
                value={done ? "1" : "0"}
              />
              <button
                type="button"
                onClick={() => toggleSet(setNumber)}
                className={`h-9 w-9 grid place-items-center rounded-lg transition-colors ${
                  done
                    ? "bg-emerald-500 text-white hover:bg-emerald-400"
                    : "border border-white/15 text-white/50 hover:text-white"
                }`}
                aria-label={done ? "Annulla completamento" : "Completa serie"}
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
