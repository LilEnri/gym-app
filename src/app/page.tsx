import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Se Supabase non è configurato (env var mancanti) reindirizziamo
  // comunque al login: meglio un redirect che un crash 500.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/login");
  }

  let user: { id: string } | null = null;
  let role: string | null = null;

  try {
    const supabase = await createClient();
    const result = await supabase.auth.getUser();
    user = result.data.user;

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      role = (profile as { role?: string } | null)?.role ?? null;
    }
  } catch {
    redirect("/login");
  }

  if (!user) redirect("/login");
  redirect(`/${role ?? "user"}`);
}
