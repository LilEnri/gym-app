import { redirect } from "next/navigation";
import { Activity, Calendar, Dumbbell, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/glass-card";
import { StatsCharts } from "./charts";

export const dynamic = "force-dynamic";

type SessionRow = {
  id: string;
  performed_at: string;
};

type ExerciseLogRow = {
  workout_log_id: string;
  weight_kg: number | null;
  reps_done: number | null;
  completed: boolean;
  workout_exercise_id: string;
  workout_exercises:
    | { exercise_id: string; exercises: { id: string; name: string; muscle_group: string } | { id: string; name: string; muscle_group: string }[] | null }
    | { exercise_id: string; exercises: { id: string; name: string; muscle_group: string } | { id: string; name: string; muscle_group: string }[] | null }[]
    | null;
};

function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}

function isoWeekKey(iso: string) {
  const d = new Date(iso);
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export default async function UserStatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Tutte le sessioni dell'utente, in ordine cronologico
  const { data: sessionsData } = await supabase
    .from("workout_logs")
    .select("id, performed_at")
    .eq("user_id", user.id)
    .order("performed_at", { ascending: true });

  const sessions = (sessionsData ?? []) as SessionRow[];
  const sessionIds = sessions.map((s) => s.id);

  // Tutti gli exercise_logs collegati
  let exerciseLogs: ExerciseLogRow[] = [];
  if (sessionIds.length > 0) {
    const { data } = await supabase
      .from("exercise_logs")
      .select(
        "workout_log_id, weight_kg, reps_done, completed, workout_exercise_id, workout_exercises:workout_exercise_id(exercise_id, exercises:exercise_id(id, name, muscle_group))",
      )
      .in("workout_log_id", sessionIds);
    exerciseLogs = (data ?? []) as ExerciseLogRow[];
  }

  function pickExercise(row: ExerciseLogRow) {
    const we = Array.isArray(row.workout_exercises) ? row.workout_exercises[0] : row.workout_exercises;
    if (!we) return null;
    return Array.isArray(we.exercises) ? we.exercises[0] ?? null : we.exercises;
  }

  // ---------- aggregazioni ----------------------------------------------

  const totalSessions = sessions.length;

  const totalVolume = exerciseLogs.reduce(
    (sum, l) => sum + (l.weight_kg ?? 0) * (l.reps_done ?? 0),
    0,
  );

  const exercisesTrained = new Set(
    exerciseLogs.map((l) => pickExercise(l)?.id).filter(Boolean),
  ).size;

  // Volume per sessione (ultimi 20)
  const volumeBySession = new Map<string, number>();
  for (const l of exerciseLogs) {
    const v = (l.weight_kg ?? 0) * (l.reps_done ?? 0);
    volumeBySession.set(l.workout_log_id, (volumeBySession.get(l.workout_log_id) ?? 0) + v);
  }
  const volumePerSession = sessions
    .slice(-20)
    .map((s) => ({
      date: fmtShortDate(s.performed_at),
      volume: Math.round(volumeBySession.get(s.id) ?? 0),
    }));

  // Top esercizi per volume (top 5)
  const exerciseVolumes = new Map<string, { id: string; name: string; volume: number; topWeight: number }>();
  for (const l of exerciseLogs) {
    const ex = pickExercise(l);
    if (!ex) continue;
    const cur = exerciseVolumes.get(ex.id) ?? {
      id: ex.id,
      name: ex.name,
      volume: 0,
      topWeight: 0,
    };
    cur.volume += (l.weight_kg ?? 0) * (l.reps_done ?? 0);
    if ((l.weight_kg ?? 0) > cur.topWeight) cur.topWeight = l.weight_kg ?? 0;
    exerciseVolumes.set(ex.id, cur);
  }
  const topExercises = Array.from(exerciseVolumes.values())
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5)
    .map((e) => ({ name: e.name, volume: Math.round(e.volume) }));

  // PR per esercizio (top 5 by topWeight)
  const personalRecords = Array.from(exerciseVolumes.values())
    .filter((e) => e.topWeight > 0)
    .sort((a, b) => b.topWeight - a.topWeight)
    .slice(0, 5);

  // Sessioni per settimana (ultime 12 settimane)
  const sessionsByWeek = new Map<string, number>();
  for (const s of sessions) {
    const k = isoWeekKey(s.performed_at);
    sessionsByWeek.set(k, (sessionsByWeek.get(k) ?? 0) + 1);
  }
  const sessionsPerWeek = Array.from(sessionsByWeek.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, count]) => ({ week: week.replace(/^\d+-/, ""), count }));

  // ---------- render ----------------------------------------------------

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Statistiche</h1>
        <p className="mt-1 text-sm text-white/60">I tuoi progressi a colpo d&apos;occhio.</p>
      </div>

      {totalSessions === 0 ? (
        <GlassCard className="text-center py-12">
          <TrendingUp className="mx-auto h-8 w-8 text-white/40" />
          <h2 className="mt-3 font-display font-semibold">Nessun dato ancora</h2>
          <p className="mt-1 text-sm text-white/60 max-w-sm mx-auto">
            Esegui qualche giorno di scheda e salva le serie. Le tue statistiche cresceranno qui.
          </p>
        </GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile
              icon={<Activity className="h-4 w-4" />}
              label="Sessioni"
              value={totalSessions}
            />
            <StatTile
              icon={<Dumbbell className="h-4 w-4" />}
              label="Volume tot. (kg)"
              value={Math.round(totalVolume).toLocaleString("it-IT")}
            />
            <StatTile
              icon={<TrendingUp className="h-4 w-4" />}
              label="Esercizi"
              value={exercisesTrained}
            />
            <StatTile
              icon={<Calendar className="h-4 w-4" />}
              label="Settimane"
              value={sessionsPerWeek.length}
            />
          </div>

          <StatsCharts
            volumePerSession={volumePerSession}
            topExercises={topExercises}
            sessionsPerWeek={sessionsPerWeek}
          />

          {personalRecords.length > 0 && (
            <GlassCard>
              <h2 className="font-display font-semibold mb-3">Record personali</h2>
              <ul className="space-y-2">
                {personalRecords.map((pr) => (
                  <li
                    key={pr.id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pr.name}</p>
                    </div>
                    <span className="text-sm font-display font-semibold text-brand-400">
                      {pr.topWeight} kg
                    </span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <GlassCard className="!p-3">
      <div className="text-brand-400">{icon}</div>
      <p className="mt-2 text-[10px] uppercase tracking-wider text-white/50">{label}</p>
      <p className="mt-0.5 font-display text-xl font-semibold leading-none">{value}</p>
    </GlassCard>
  );
}
