"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
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
  if (role !== "admin") throw new Error("Permesso negato");
  return { actor: user };
}

async function logActivity(
  actorId: string,
  action: string,
  targetUserId: string,
  metadata?: Record<string, unknown>,
) {
  const admin = createAdminClient();
  await admin.from("activity_logs").insert({
    actor_id: actorId,
    action,
    entity_type: "profile",
    entity_id: targetUserId,
    metadata: metadata ?? null,
  });
}

export async function setUserRoleAction(formData: FormData): Promise<void> {
  const { actor } = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const newRole = String(formData.get("role") ?? "");
  if (!userId || !["admin", "coach", "user"].includes(newRole)) return;
  if (userId === actor.id) return; // no auto-demote

  const admin = createAdminClient();
  await admin.from("profiles").update({ role: newRole }).eq("id", userId);
  await logActivity(actor.id, "role_changed", userId, { newRole });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function toggleUserActiveAction(formData: FormData): Promise<void> {
  const { actor } = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const setActive = formData.get("setActive") === "true";
  if (!userId) return;
  if (userId === actor.id) return; // no auto-suspend

  const admin = createAdminClient();
  await admin.from("profiles").update({ is_active: setActive }).eq("id", userId);
  await logActivity(actor.id, setActive ? "user_activated" : "user_suspended", userId);

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const { actor } = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;
  if (userId === actor.id) return; // no auto-delete

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(userId);
  // profile + relazioni cascade via ON DELETE CASCADE
  await logActivity(actor.id, "user_deleted", userId);

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}
