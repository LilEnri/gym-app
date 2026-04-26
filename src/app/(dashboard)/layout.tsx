import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { GlassCard } from "@/components/ui/glass-card";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url, is_active")
    .eq("id", user.id)
    .single();

  // Se il profilo manca davvero (RLS che blocca, riga assente, etc.) NON
  // facciamo redirect a /login: produrrebbe un loop perché il middleware
  // potrebbe rimandare qui. Mostriamo invece uno stato d'errore con logout.
  if (profileError || !profile) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center px-5">
        <GlassCard variant="strong" className="max-w-md w-full text-center p-8">
          <h1 className="text-xl font-semibold">Profilo non trovato</h1>
          <p className="mt-2 text-sm text-white/60">
            Il tuo account è autenticato ma manca un profilo nel database.
            Contatta un amministratore.
          </p>
          <form action="/auth/signout" method="post" className="mt-6">
            <button type="submit" className="w-full h-11 rounded-xl glass text-white hover:bg-white/10">
              Esci
            </button>
          </form>
        </GlassCard>
      </main>
    );
  }

  if (!profile.is_active) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center px-5">
        <GlassCard variant="strong" className="max-w-md w-full text-center p-8">
          <h1 className="text-xl font-semibold">Account sospeso</h1>
          <p className="mt-2 text-sm text-white/60">
            Il tuo account è stato disattivato. Contatta l&apos;amministratore della palestra.
          </p>
          <form action="/auth/signout" method="post" className="mt-6">
            <button type="submit" className="w-full h-11 rounded-xl glass text-white hover:bg-white/10">
              Esci
            </button>
          </form>
        </GlassCard>
      </main>
    );
  }

  return (
    <AppShell role={profile.role} fullName={profile.full_name}>
      {children}
    </AppShell>
  );
}
