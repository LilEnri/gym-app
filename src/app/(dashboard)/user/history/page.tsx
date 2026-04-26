import { redirect } from "next/navigation";
import { Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/glass-card";

export const dynamic = "force-dynamic";

type LogRow = {
  id: string;
  performed_at: string;
  duration_minutes: number | null;
  overall_notes: string | null;
  workout_day_id: string;
  workout_days?:
    | { label: string; workouts?: { title: string } | { title: string }[] | null }
    | { label: string; workouts?: { title: string } | { title: string }[] | null }[]
    | null;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function UserHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("workout_logs")
    .select(
      "id, performed_at, duration_minutes, overall_notes, workout_day_id, workout_days:workout_day_id(label, workouts:workout_id(title))",
    )
    .eq("user_id", user.id)
    .order("performed_at", { ascending: false })
    .limit(50);

  const logs = (data ?? []) as LogRow[];

  function pickDay(l: LogRow) {
    return Array.isArray(l.workout_days) ? l.workout_days[0] : l.workout_days;
  }
  function pickWorkout(d: NonNullable<ReturnType<typeof pickDay>>) {
    return Array.isArray(d.workouts) ? d.workouts[0] : d.workouts;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Storico</h1>
        <p className="mt-1 text-sm text-white/60">Le sessioni che hai registrato.</p>
      </div>

      {logs.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Calendar className="mx-auto h-8 w-8 text-white/40" />
          <h2 className="mt-3 font-display font-semibold">Nessuna sessione registrata</h2>
          <p className="mt-1 text-sm text-white/60 max-w-sm mx-auto">
            Quando esegui un giorno della tua scheda e salvi le serie, lo trovi qui.
          </p>
        </GlassCard>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => {
            const day = pickDay(log);
            const workout = day ? pickWorkout(day) : undefined;
            return (
              <li key={log.id}>
                <GlassCard>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/50 uppercase tracking-wider">
                        {workout?.title ?? "Scheda"}
                      </p>
                      <p className="font-medium truncate">{day?.label ?? "Giorno"}</p>
                      <p className="text-xs text-white/60 mt-1">{fmt(log.performed_at)}</p>
                      {log.overall_notes && (
                        <p className="text-xs text-white/70 mt-1 italic">{log.overall_notes}</p>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
