import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppShell } from "@/components/app-shell";
import { GlassCard } from "@/components/ui/glass-card";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Prima prova con il client RLS-aware (rispetta le policy).
  let profile = null as
    | { id: string; role: string; full_name: string | null; avatar_url: string | null; is_active: boolean }
    | null;
  let lookupError: string | null = null;

  const { data: rlsProfile, error: rlsError } = await supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (rlsProfile) {
    profile = rlsProfile as typeof profile;
  } else {
    lookupError = rlsError?.message ?? "RLS ha bloccato la lettura o riga mancante";
    // Fallback: prova con admin client (bypass RLS) — abbiamo già
    // autenticato via getUser() quindi è sicuro leggere il proprio profilo.
    try {
      const admin = createAdminClient();
      const { data: adminProfile } = await admin
        .from("profiles")
        .select("id, role, full_name, avatar_url, is_active")
        .eq("id", user.id)
        .maybeSingle();
      if (adminProfile) profile = adminProfile as typeof profile;
    } catch (e) {
      lookupError += ` | Admin lookup failed: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  if (!profile) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center px-5">
        <GlassCard variant="strong" className="max-w-md w-full text-center p-8">
          <h1 className="text-xl font-semibold">Profilo non trovato</h1>
          <p className="mt-2 text-sm text-white/60">
            Account autenticato ma nessuna riga in <code>profiles</code> con questo id.
          </p>
          <div className="mt-4 text-left bg-black/30 rounded-lg p-3 text-xs font-mono text-white/70 break-all">
            <div>user.id: {user.id}</div>
            <div>email: {user.email ?? "(no email)"}</div>
            {lookupError && <div className="mt-1 text-red-300">err: {lookupError}</div>}
          </div>
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
    <AppShell role={profile.role as "admin" | "coach" | "user"} fullName={profile.full_name}>
      {children}
    </AppShell>
  );
}
