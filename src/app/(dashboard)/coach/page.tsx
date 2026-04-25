import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Dumbbell, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/glass-card";

export default async function CoachHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "coach" && profile?.role !== "admin") redirect("/user");

  // Allievi: profili con ruolo 'user' su cui il coach ha almeno una scheda attiva
  const { data: athletes } = await supabase
    .from("workouts")
    .select("user_id")
    .eq("coach_id", user.id)
    .eq("is_active", true);

  const athletesCount = new Set((athletes ?? []).map((w) => w.user_id)).size;

  const { count: activeWorkoutsCount } = await supabase
    .from("workouts")
    .select("*", { count: "exact", head: true })
    .eq("coach_id", user.id)
    .eq("is_active", true);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-white/60">Area coach</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Ciao, {profile?.full_name?.split(" ")[0] ?? "Coach"}
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/coach/athletes" className="group">
          <GlassCard className="transition-colors group-hover:bg-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Allievi attivi</p>
                <p className="mt-1 font-display text-2xl font-semibold">{athletesCount}</p>
              </div>
              <Users className="h-6 w-6 text-brand-400" />
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 text-sm text-white/70 group-hover:text-white">
              Gestisci <ArrowRight className="h-4 w-4" />
            </div>
          </GlassCard>
        </Link>

        <Link href="/coach/workouts" className="group">
          <GlassCard className="transition-colors group-hover:bg-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Schede attive</p>
                <p className="mt-1 font-display text-2xl font-semibold">{activeWorkoutsCount ?? 0}</p>
              </div>
              <Dumbbell className="h-6 w-6 text-brand-400" />
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 text-sm text-white/70 group-hover:text-white">
              Apri <ArrowRight className="h-4 w-4" />
            </div>
          </GlassCard>
        </Link>
      </div>

      <GlassCard>
        <h2 className="font-display font-semibold">Prossimi passi</h2>
        <ul className="mt-3 space-y-2 text-sm text-white/70">
          <li>• Invita un allievo da <Link href="/coach/athletes" className="text-brand-400">Allievi</Link>.</li>
          <li>• Crea una scheda da <Link href="/coach/workouts" className="text-brand-400">Schede</Link>.</li>
          <li>• Amplia la <Link href="/coach/exercises" className="text-brand-400">libreria esercizi</Link>.</li>
        </ul>
      </GlassCard>
    </div>
  );
}
