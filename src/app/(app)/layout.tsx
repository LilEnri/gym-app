import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, locked")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (profile.locked) redirect("/locked");

  return (
    <AppShell role={profile.role} fullName={profile.full_name}>
      {children}
    </AppShell>
  );
}
