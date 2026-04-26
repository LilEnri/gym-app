"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireCoach() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autenticato");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as { role?: string } | null)?.role;
  if (role !== "coach" && role !== "admin") {
    throw new Error("Permesso negato");
  }

  return { supabase, userId: user.id };
}

// ---------- Workouts ----------------------------------------------------

export async function createWorkoutAction(formData: FormData) {
  const { supabase, userId } = await requireCoach();

  const athleteId = String(formData.get("athleteId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const structure = String(formData.get("structure") ?? "weekly") as
    | "weekly"
    | "rotation"
    | "single";
  const startDate = String(formData.get("startDate") ?? "");
  const endDateRaw = String(formData.get("endDate") ?? "");

  if (!athleteId || !title || !startDate) {
    throw new Error("Compila titolo, allievo e data di inizio");
  }

  const { data, error } = await supabase
    .from("workouts")
    .insert({
      user_id: athleteId,
      coach_id: userId,
      title,
      description: description || null,
      structure,
      start_date: startDate,
      end_date: endDateRaw || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/coach/workouts");
  revalidatePath("/coach");
  redirect(`/coach/workouts/${(data as { id: string }).id}`);
}

export async function updateWorkoutMetaAction(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireCoach();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!id || !title) return;

  await supabase
    .from("workouts")
    .update({ title, description: description || null })
    .eq("id", id)
    .eq("coach_id", userId);

  revalidatePath(`/coach/workouts/${id}`);
}

export async function setWorkoutActiveAction(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireCoach();

  const id = String(formData.get("id") ?? "");
  const setActive = formData.get("setActive") === "true";
  if (!id) return;

  if (setActive) {
    // Disattiva le altre schede dello stesso atleta create da me
    const { data: w } = await supabase
      .from("workouts")
      .select("user_id")
      .eq("id", id)
      .single();
    const targetUser = (w as { user_id?: string } | null)?.user_id;
    if (targetUser) {
      await supabase
        .from("workouts")
        .update({ is_active: false })
        .eq("user_id", targetUser)
        .eq("coach_id", userId);
    }
  }

  await supabase
    .from("workouts")
    .update({ is_active: setActive })
    .eq("id", id)
    .eq("coach_id", userId);

  revalidatePath("/coach/workouts");
  revalidatePath(`/coach/workouts/${id}`);
}

export async function deleteWorkoutAction(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireCoach();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("workouts").delete().eq("id", id).eq("coach_id", userId);

  revalidatePath("/coach/workouts");
  redirect("/coach/workouts");
}

// ---------- Workout days -------------------------------------------------

export async function addDayAction(formData: FormData): Promise<void> {
  const { supabase } = await requireCoach();

  const workoutId = String(formData.get("workoutId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  if (!workoutId || !label) return;

  const { data: existing } = await supabase
    .from("workout_days")
    .select("order_index")
    .eq("workout_id", workoutId)
    .order("order_index", { ascending: false })
    .limit(1);

  const last = existing?.[0] as { order_index?: number } | undefined;
  const nextIndex = (last?.order_index ?? -1) + 1;

  await supabase.from("workout_days").insert({
    workout_id: workoutId,
    label,
    order_index: nextIndex,
  });

  revalidatePath(`/coach/workouts/${workoutId}`);
}

export async function deleteDayAction(formData: FormData): Promise<void> {
  const { supabase } = await requireCoach();
  const id = String(formData.get("id") ?? "");
  const workoutId = String(formData.get("workoutId") ?? "");
  if (!id) return;

  await supabase.from("workout_days").delete().eq("id", id);
  revalidatePath(`/coach/workouts/${workoutId}`);
}

// ---------- Workout exercises -------------------------------------------

export async function addExerciseAction(formData: FormData): Promise<void> {
  const { supabase } = await requireCoach();

  const dayId = String(formData.get("dayId") ?? "");
  const exerciseId = String(formData.get("exerciseId") ?? "");
  const setsRaw = formData.get("sets");
  const sets = setsRaw ? Number(setsRaw) : 3;
  const targetReps = String(formData.get("targetReps") ?? "8-10").trim();
  const restRaw = formData.get("restSeconds");
  const restSeconds = restRaw && String(restRaw).trim() !== "" ? Number(restRaw) : null;
  const notes = String(formData.get("notes") ?? "").trim();
  const workoutId = String(formData.get("workoutId") ?? "");

  if (!dayId || !exerciseId || !targetReps) return;

  const { data: existing } = await supabase
    .from("workout_exercises")
    .select("order_index")
    .eq("workout_day_id", dayId)
    .order("order_index", { ascending: false })
    .limit(1);

  const last = existing?.[0] as { order_index?: number } | undefined;
  const nextIndex = (last?.order_index ?? -1) + 1;

  await supabase.from("workout_exercises").insert({
    workout_day_id: dayId,
    exercise_id: exerciseId,
    sets,
    target_reps: targetReps,
    rest_seconds: restSeconds,
    notes: notes || null,
    order_index: nextIndex,
  });

  revalidatePath(`/coach/workouts/${workoutId}`);
}

export async function deleteExerciseAction(formData: FormData): Promise<void> {
  const { supabase } = await requireCoach();
  const id = String(formData.get("id") ?? "");
  const workoutId = String(formData.get("workoutId") ?? "");
  if (!id) return;

  await supabase.from("workout_exercises").delete().eq("id", id);
  revalidatePath(`/coach/workouts/${workoutId}`);
}
