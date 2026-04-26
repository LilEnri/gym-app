"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginResult = { error: string } | { ok: true };

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Inserisci email e password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "Email o password non corretti."
          : error.message,
    };
  }

  // Recupera il ruolo per redirigere alla home corretta
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let dest = "/user";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = (profile as { role?: string } | null)?.role;
    if (role === "admin" || role === "coach" || role === "user") {
      dest = `/${role}`;
    }
  }

  revalidatePath("/", "layout");
  redirect(dest);
}
