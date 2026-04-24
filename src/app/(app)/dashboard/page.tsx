import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Dumbbell, Flame, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/glass-card";

export default async function UserDashboardPage() {
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

  // Coach e admin hanno la propria home
  if (profile?.role === "coach") redirect("/coach");
  if (profile?.role === "admin") redirect("/admin");

  const { data: activePlan } = await supabase
    .from("workout_plans")
    .select("id, title, start_date, end_date")
    .eq("athlete_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: totalLogs } = await supabase
    .from("workout_logs")
    .select("*", { count: "exact", head: true })
    .eq("athlete_id", user.id);

  const firstName = profile?.full_name?.split(" ")[0] ?? "atleta";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-white/60">Ciao,</p>
        <h1 className="text-3xl font-semibold tracking-tight">{firstName} 👋</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard variant="brand">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Scheda attuale</p>
              <p className="mt-1 text-lg font-semibold">
                {activePlan?.title ?? "Nessuna scheda attiva"}
              </p>
            </div>
            <Dumbbell className="h-6 w-6 text-white/80" />
          </div>
          {activePlan && (
            <Link
              href={`/dashboard/workouts/${activePlan.id}`}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white"
            >
              Apri scheda <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Allenamenti totali</p>
              <p className="mt-1 text-2xl font-semibold">{totalLogs ?? 0}</p>
            </div>
            <Flame className="h-6 w-6 text-brand-400" />
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-brand-400" />
          <h2 className="font-semibold">Progressi recenti</h2>
        </div>
        <p className="mt-3 text-sm text-white/60">
          Completa i tuoi allenamenti per vedere qui grafici e statistiche.
        </p>
      </GlassCard>
    </div>
  );
}
