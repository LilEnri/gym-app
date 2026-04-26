import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ClipboardList, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type WorkoutRow = {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  user_id: string;
  athlete?: { id: string; full_name: string | null } | { id: string; full_name: string | null }[] | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function CoachWorkoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("workouts")
    .select("id, title, description, is_active, start_date, end_date, user_id, athlete:user_id(id, full_name)")
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  const workouts = (data ?? []) as WorkoutRow[];

  function pickAthlete(w: WorkoutRow) {
    return Array.isArray(w.athlete) ? w.athlete[0] : w.athlete;
  }

  const active = workouts.filter((w) => w.is_active);
  const archived = workouts.filter((w) => !w.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Schede</h1>
          <p className="mt-1 text-sm text-white/60">Crea, modifica e assegna schede ai tuoi allievi.</p>
        </div>
        <Link href="/coach/workouts/new">
          <Button size="md">
            <Plus className="h-4 w-4" /> Nuova
          </Button>
        </Link>
      </div>

      {workouts.length === 0 ? (
        <GlassCard className="text-center py-12">
          <div className="mx-auto h-12 w-12 rounded-xl glass-brand grid place-items-center">
            <ClipboardList className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display font-semibold">Nessuna scheda ancora</h2>
          <p className="mt-1 text-sm text-white/60 max-w-sm mx-auto">
            Crea la prima scheda per uno dei tuoi allievi.
          </p>
          <Link href="/coach/workouts/new" className="inline-block mt-5">
            <Button size="md">
              <Plus className="h-4 w-4" /> Crea scheda
            </Button>
          </Link>
        </GlassCard>
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <h2 className="text-xs font-medium uppercase tracking-wider text-white/50 mb-3">Attive</h2>
              <ul className="space-y-2">
                {active.map((w) => {
                  const a = pickAthlete(w);
                  return (
                    <li key={w.id}>
                      <Link href={`/coach/workouts/${w.id}`} className="group block">
                        <GlassCard variant="brand" className="transition-all group-hover:scale-[1.005]">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-display font-semibold truncate">{w.title}</p>
                              <p className="text-xs text-white/70 mt-0.5">
                                {a?.full_name ?? "Allievo"} · dal {formatDate(w.start_date)}
                                {w.end_date && ` al ${formatDate(w.end_date)}`}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-white/70" />
                          </div>
                        </GlassCard>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {archived.length > 0 && (
            <section>
              <h2 className="text-xs font-medium uppercase tracking-wider text-white/50 mb-3">Archivio</h2>
              <ul className="space-y-2">
                {archived.map((w) => {
                  const a = pickAthlete(w);
                  return (
                    <li key={w.id}>
                      <Link href={`/coach/workouts/${w.id}`} className="group block">
                        <GlassCard className="transition-colors group-hover:bg-white/10">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{w.title}</p>
                              <p className="text-xs text-white/50 mt-0.5">
                                {a?.full_name ?? "Allievo"} · {formatDate(w.start_date)}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-white/50" />
                          </div>
                        </GlassCard>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
