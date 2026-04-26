"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  addDayAction,
  addExerciseAction,
  deleteDayAction,
  deleteExerciseAction,
} from "../actions";

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

interface DayListProps {
  workoutId: string;
  days: Day[];
  exercises: DayExercise[];
  library: ExerciseLib[];
}

export function DayList({ workoutId, days, exercises, library }: DayListProps) {
  const [openDayId, setOpenDayId] = useState<string | null>(days[0]?.id ?? null);
  const [showAddDay, setShowAddDay] = useState(false);

  function pickEx(de: DayExercise): ExerciseLib | undefined {
    return Array.isArray(de.exercises) ? de.exercises[0] : (de.exercises ?? undefined);
  }

  // Raggruppa esercizi per giorno
  const exercisesByDay = new Map<string, DayExercise[]>();
  for (const ex of exercises) {
    const arr = exercisesByDay.get(ex.workout_day_id) ?? [];
    arr.push(ex);
    exercisesByDay.set(ex.workout_day_id, arr);
  }

  // Raggruppa libreria per gruppo muscolare
  const libraryByGroup = new Map<string, ExerciseLib[]>();
  for (const e of library) {
    const arr = libraryByGroup.get(e.muscle_group) ?? [];
    arr.push(e);
    libraryByGroup.set(e.muscle_group, arr);
  }

  return (
    <div className="space-y-3">
      {days.map((day) => {
        const dayExercises = exercisesByDay.get(day.id) ?? [];
        const open = openDayId === day.id;
        return (
          <GlassCard key={day.id} className="!p-0 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenDayId(open ? null : day.id)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold">{day.label}</p>
                <p className="text-xs text-white/50 mt-0.5">
                  {dayExercises.length} {dayExercises.length === 1 ? "esercizio" : "esercizi"}
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-white/50 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open && (
              <div className="border-t border-white/5 px-5 py-4 space-y-4">
                {dayExercises.length > 0 && (
                  <ul className="space-y-2">
                    {dayExercises.map((de) => {
                      const ex = pickEx(de);
                      return (
                        <li
                          key={de.id}
                          className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{ex?.name ?? "Esercizio"}</p>
                            <p className="text-xs text-white/60 mt-0.5">
                              {de.sets} × {de.target_reps}
                              {de.rest_seconds && ` · recupero ${de.rest_seconds}s`}
                            </p>
                            {de.notes && (
                              <p className="text-xs text-white/50 mt-1 italic">{de.notes}</p>
                            )}
                          </div>
                          <DeleteExerciseButton id={de.id} workoutId={workoutId} />
                        </li>
                      );
                    })}
                  </ul>
                )}

                <AddExerciseForm
                  workoutId={workoutId}
                  dayId={day.id}
                  libraryByGroup={libraryByGroup}
                />

                <DeleteDayButton id={day.id} workoutId={workoutId} />
              </div>
            )}
          </GlassCard>
        );
      })}

      {showAddDay ? (
        <AddDayForm workoutId={workoutId} onCancel={() => setShowAddDay(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowAddDay(true)}
          className="w-full glass rounded-2xl py-4 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" /> Aggiungi giorno
        </button>
      )}
    </div>
  );
}

// ---------- Sub-components ---------------------------------------------

function AddDayForm({ workoutId, onCancel }: { workoutId: string; onCancel: () => void }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await addDayAction(formData);
      onCancel();
    });
  }

  return (
    <GlassCard variant="strong">
      <form action={handleSubmit} className="space-y-3">
        <input type="hidden" name="workoutId" value={workoutId} />
        <div>
          <Label htmlFor="day-label">Etichetta giorno</Label>
          <Input
            id="day-label"
            name="label"
            required
            placeholder="Es. Giorno A · Spinta — oppure: Lunedì"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="md" disabled={isPending}>
            Aggiungi
          </Button>
          <Button type="button" size="md" variant="glass" onClick={onCancel}>
            Annulla
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}

function AddExerciseForm({
  workoutId,
  dayId,
  libraryByGroup,
}: {
  workoutId: string;
  dayId: string;
  libraryByGroup: Map<string, ExerciseLib[]>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await addExerciseAction(formData);
      setFormKey((k) => k + 1);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-white/15 py-3 text-sm text-white/60 hover:text-white hover:border-white/30 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" /> Aggiungi esercizio
      </button>
    );
  }

  return (
    <form key={formKey} action={handleSubmit} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <input type="hidden" name="workoutId" value={workoutId} />
      <input type="hidden" name="dayId" value={dayId} />

      <div>
        <Label htmlFor={`ex-${dayId}`}>Esercizio</Label>
        <Select id={`ex-${dayId}`} name="exerciseId" required defaultValue="">
          <option value="" disabled>Seleziona…</option>
          {Array.from(libraryByGroup.entries()).map(([group, items]) => (
            <optgroup key={group} label={group}>
              {items.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                  {e.equipment ? ` (${e.equipment})` : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor={`sets-${dayId}`}>Serie</Label>
          <Input
            id={`sets-${dayId}`}
            name="sets"
            type="number"
            min={1}
            max={20}
            defaultValue={3}
            required
          />
        </div>
        <div>
          <Label htmlFor={`reps-${dayId}`}>Reps</Label>
          <Input
            id={`reps-${dayId}`}
            name="targetReps"
            required
            placeholder="8-10"
            defaultValue="8-10"
          />
        </div>
        <div>
          <Label htmlFor={`rest-${dayId}`}>Recupero (s)</Label>
          <Input
            id={`rest-${dayId}`}
            name="restSeconds"
            type="number"
            min={0}
            placeholder="90"
          />
        </div>
      </div>

      <div>
        <Label htmlFor={`notes-${dayId}`}>Note (opz.)</Label>
        <Input id={`notes-${dayId}`} name="notes" placeholder="Es. tempo controllato 3-1-1" />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="md" disabled={isPending}>
          Aggiungi
        </Button>
        <Button type="button" size="md" variant="glass" onClick={() => setOpen(false)}>
          Annulla
        </Button>
      </div>
    </form>
  );
}

function DeleteExerciseButton({ id, workoutId }: { id: string; workoutId: string }) {
  return (
    <form action={deleteExerciseAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="workoutId" value={workoutId} />
      <button
        type="submit"
        className="h-8 w-8 grid place-items-center rounded-lg text-white/50 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        aria-label="Rimuovi esercizio"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}

function DeleteDayButton({ id, workoutId }: { id: string; workoutId: string }) {
  return (
    <form
      action={deleteDayAction}
      onSubmit={(e) => {
        if (!confirm("Eliminare il giorno e tutti i suoi esercizi?")) {
          e.preventDefault();
        }
      }}
      className="pt-2 border-t border-white/5"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="workoutId" value={workoutId} />
      <button
        type="submit"
        className="text-xs text-white/40 hover:text-red-300 inline-flex items-center gap-1.5"
      >
        <Trash2 className="h-3 w-3" /> Elimina giorno
      </button>
    </form>
  );
}
