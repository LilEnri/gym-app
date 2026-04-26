"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type LoggedSet = {
  workoutExerciseId: string;
  exerciseId: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
};

export async function saveSessionAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autenticato");

  const dayId = String(formData.get("dayId") ?? "");
  const overallNotes = String(formData.get("overallNotes") ?? "").trim();
  if (!dayId) throw new Error("Giorno mancante");

  // Verifica ownership: il giorno deve appartenere a una scheda dell'utente
  const { data: day } = await supabase
    .from("workout_days")
    .select("workout_id, workouts:workout_id(user_id)")
    .eq("id", dayId)
    .maybeSingle();

  type WorkoutOwner = { user_id: string };
  const wf = (day as { workouts?: WorkoutOwner | WorkoutOwner[] | null } | null)?.workouts;
  const owner = Array.isArray(wf) ? wf[0] : wf;
  if (!owner || owner.user_id !== user.id) {
    throw new Error("Permesso negato");
  }

  // Estrai i set dal form. Convenzione campi:
  //   set:<workoutExerciseId>:<exerciseId>:<setNumber>:weight
  //   set:<workoutExerciseId>:<exerciseId>:<setNumber>:reps
  //   set:<workoutExerciseId>:<exerciseId>:<setNumber>:done  ('1' se completato)
  const map = new Map<string, LoggedSet>();
  for (const [key, val] of formData.entries()) {
    if (!key.startsWith("set:")) continue;
    const parts = key.split(":");
    if (parts.length !== 5) continue;
    const [, workoutExerciseId, exerciseId, setNumberStr, field] = parts;
    const setNumber = Number(setNumberStr);
    const id = `${workoutExerciseId}:${setNumber}`;
    const existing = map.get(id) ?? {
      workoutExerciseId,
      exerciseId,
      setNumber,
      weight: null,
      reps: null,
      completed: false,
    };
    if (field === "weight") {
      const n = Number(String(val).replace(",", "."));
      existing.weight = Number.isFinite(n) && n > 0 ? n : null;
    } else if (field === "reps") {
      const n = Number(val);
      existing.reps = Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
    } else if (field === "done") {
      existing.completed = String(val) === "1";
    }
    map.set(id, existing);
  }

  const sets = Array.from(map.values()).filter(
    (s) => s.completed || s.weight !== null || s.reps !== null,
  );

  if (sets.length === 0) {
    throw new Error("Nessuna serie registrata");
  }

  // Crea workout_log
  const { data: log, error: logError } = await supabase
    .from("workout_logs")
    .insert({
      user_id: user.id,
      workout_day_id: dayId,
      overall_notes: overallNotes || null,
    })
    .select("id")
    .single();

  if (logError) throw new Error(logError.message);
  const logId = (log as { id: string }).id;

  // Inserisci tutti gli exercise_logs
  const rows = sets.map((s) => ({
    workout_log_id: logId,
    workout_exercise_id: s.workoutExerciseId,
    set_number: s.setNumber,
    weight_kg: s.weight,
    reps_done: s.reps,
    completed: s.completed,
  }));

  const { error: setsError } = await supabase.from("exercise_logs").insert(rows);
  if (setsError) throw new Error(setsError.message);

  revalidatePath("/user");
  revalidatePath("/user/history");
  redirect("/user/history");
}
