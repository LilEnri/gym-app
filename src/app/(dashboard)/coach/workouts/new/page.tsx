import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/glass-card";
import { NewWorkoutForm } from "./new-workout-form";

export const dynamic = "force-dynamic";

export default async function NewWorkoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: athletes } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("invited_by", user.id)
    .eq("role", "user")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  const list = (athletes ?? []) as Array<{ id: string; full_name: string | null }>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/coach/workouts"
          className="h-9 w-9 grid place-items-center rounded-xl glass text-white/70 hover:text-white"
          aria-label="Indietro"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Nuova scheda</h1>
        </div>
      </div>

      <GlassCard variant="strong">
        {list.length === 0 ? (
          <p className="text-sm text-white/60 text-center py-6">
            Non hai ancora allievi. Vai su{" "}
            <Link href="/coach/athletes" className="text-brand-400 hover:text-brand-300">
              Allievi
            </Link>{" "}
            per inviare un invito.
          </p>
        ) : (
          <NewWorkoutForm athletes={list} />
        )}
      </GlassCard>
    </div>
  );
}
