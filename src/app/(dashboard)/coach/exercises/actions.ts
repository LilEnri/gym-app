"use server";

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
  if (role !== "coach" && role !== "admin") throw new Error("Permesso negato");

  return { supabase, userId: user.id };
}

export async function createExerciseAction(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireCoach();

  const name = String(formData.get("name") ?? "").trim();
  const muscleGroup = String(formData.get("muscleGroup") ?? "").trim().toLowerCase();
  const equipment = String(formData.get("equipment") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();

  if (!name || !muscleGroup) return;

  await supabase.from("exercises").insert({
    name,
    muscle_group: muscleGroup,
    equipment: equipment || null,
    description: description || null,
    image_url: imageUrl || null,
    video_url: videoUrl || null,
    is_preset: false,
    created_by: userId,
  });

  revalidatePath("/coach/exercises");
}

export async function updateExerciseAction(formData: FormData): Promise<void> {
  const { supabase } = await requireCoach();

  const id = String(formData.get("id") ?? "");
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();

  if (!id) return;

  await supabase
    .from("exercises")
    .update({
      image_url: imageUrl || null,
      description: description || null,
      video_url: videoUrl || null,
    })
    .eq("id", id);

  revalidatePath("/coach/exercises");
  // anche le pagine workout dell'utente mostrano l'immagine
  revalidatePath("/user", "layout");
}
