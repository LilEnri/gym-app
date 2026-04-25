import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, ChevronRight, ClipboardList, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/glass-card";

export default async function UserHomePage() {
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

  // Coach/admin hanno la propria home
  if (profile?.role === "coach") redirect("/coach");
  if (profile?.role === "admin") redirect("/admin");

  const { data: currentWorkout } = await supabase
    .from("workouts")
    .select("id, title, description, structure")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: workoutDays } = currentWorkout
    ? await supabase
        .from("workout_days")
        .select("id, label, order_index")
        .eq("workout_id", currentWorkout.id)
        .order("order_index", { ascending: true })
    : { data: null };

  const { count: sessionsCount } = await supabase
    .from("workout_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const firstName = profile?.full_name?.split(" ")[0] ?? "atleta";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-white/60">Pronto ad allenarti?</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Ciao, {firstName}</h1>
      </div>

      {currentWorkout ? (
        <GlassCard variant="brand">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold">{currentWorkout.title}</h2>
              {currentWorkout.description && (
                <p className="mt-1 text-sm text-white/70">{currentWorkout.description}</p>
              )}
            </div>
            <ClipboardList className="h-5 w-5 shrink-0 text-white/80" />
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/60">
              Giorni / sessioni
            </p>
            <ul className="space-y-2">
              {(workoutDays ?? []).map((day) => (
                <li key={day.id}>
                  <Link
                    href={`/user/workout/${day.id}`}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:border-white/20 hover:bg-white/10 transition-colors"
                  >
                    <span className="font-medium">{day.label}</span>
                    <ChevronRight className="h-4 w-4 text-white/50" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="text-center py-10">
          <Calendar className="mx-auto h-8 w-8 text-white/40" />
          <h2 className="mt-3 font-display text-lg font-semibold">Nessuna scheda attiva</h2>
          <p className="mt-1 text-sm text-white/60">
            Il tuo coach non ti ha ancora assegnato una scheda.
          </p>
        </GlassCard>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/user/history" className="group">
          <GlassCard className="transition-colors group-hover:bg-white/10">
            <TrendingUp className="h-5 w-5 text-brand-400" />
            <p className="mt-3 font-display text-2xl font-semibold">{sessionsCount ?? 0}</p>
            <p className="mt-0.5 text-xs text-white/60">Sessioni svolte</p>
          </GlassCard>
        </Link>
        <Link href="/user/stats" className="group">
          <GlassCard className="transition-colors group-hover:bg-white/10">
            <Calendar className="h-5 w-5 text-brand-400" />
            <p className="mt-3 font-display text-sm font-semibold">Vedi progressi</p>
            <p className="mt-0.5 text-xs text-white/60">Grafici e PR</p>
          </GlassCard>
        </Link>
      </div>
    </div>
  );
}
