"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

export async function createInviteAction(formData: FormData): Promise<ActionResult<{ token: string }>> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Email non valida." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non autenticato." };

  // Verifica ruolo del chiamante
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const callerRole = (profile as { role?: string } | null)?.role;
  if (callerRole !== "coach" && callerRole !== "admin") {
    return { ok: false, error: "Permesso negato." };
  }

  // Coach può invitare solo come 'user'; admin può scegliere ma qui è coach.
  const role = "user" as const;

  // Verifica che non esista già un invito attivo o un utente con quella email
  const admin = createAdminClient();

  const { data: existingInvite } = await admin
    .from("invites")
    .select("id, status, expires_at")
    .eq("email", email)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (existingInvite) {
    return { ok: false, error: "Esiste già un invito attivo per questa email." };
  }

  const token = randomUUID();

  const { error: insertError } = await admin.from("invites").insert({
    email,
    role,
    invited_by: user.id,
    token,
  });

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  revalidatePath("/coach/athletes");
  return { ok: true, data: { token } };
}

// Usata direttamente in <form action={...}>: deve ritornare void.
// Errori vengono ignorati silenziosamente (azione idempotente).
export async function revokeInviteAction(formData: FormData): Promise<void> {
  const inviteId = String(formData.get("inviteId") ?? "");
  if (!inviteId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("invites")
    .update({ status: "revoked" })
    .eq("id", inviteId)
    .eq("invited_by", user.id);

  revalidatePath("/coach/athletes");
}
