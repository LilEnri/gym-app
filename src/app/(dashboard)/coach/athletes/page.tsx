import { redirect } from "next/navigation";
import { Mail, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/glass-card";
import { InviteForm } from "./invite-form";
import { revokeInviteAction } from "./actions";

export const dynamic = "force-dynamic";

type Invite = {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
};

type Athlete = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function CoachAthletesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Inviti pendenti del coach
  const { data: invitesData } = await supabase
    .from("invites")
    .select("id, email, role, expires_at, created_at")
    .eq("invited_by", user.id)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  const invites = (invitesData ?? []) as Invite[];

  // Atleti attivi: profili con almeno una scheda dove coach_id = me
  const { data: workoutsData } = await supabase
    .from("workouts")
    .select("user_id, profiles:user_id(id, full_name, avatar_url)")
    .eq("coach_id", user.id);

  const seen = new Set<string>();
  const athletes: Athlete[] = [];
  for (const row of (workoutsData ?? []) as Array<{
    user_id: string;
    profiles: Athlete | Athlete[] | null;
  }>) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    if (profile && !seen.has(profile.id)) {
      seen.add(profile.id);
      athletes.push(profile);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Allievi</h1>
        <p className="mt-1 text-sm text-white/60">
          Invita nuovi allievi e gestisci quelli attivi.
        </p>
      </div>

      <InviteForm />

      {/* Inviti pendenti */}
      {invites.length > 0 && (
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-5 w-5 text-brand-400" />
            <h2 className="font-display font-semibold">Inviti in attesa</h2>
            <span className="ml-auto text-xs text-white/50">{invites.length}</span>
          </div>
          <ul className="space-y-2">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{invite.email}</p>
                  <p className="text-xs text-white/50">
                    Scade il {formatDate(invite.expires_at)}
                  </p>
                </div>
                <form action={revokeInviteAction}>
                  <input type="hidden" name="inviteId" value={invite.id} />
                  <button
                    type="submit"
                    className="h-8 w-8 grid place-items-center rounded-lg text-white/60 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    aria-label="Revoca invito"
                    title="Revoca invito"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      {/* Atleti attivi */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-brand-400" />
          <h2 className="font-display font-semibold">Allievi attivi</h2>
          <span className="ml-auto text-xs text-white/50">{athletes.length}</span>
        </div>

        {athletes.length === 0 ? (
          <p className="text-sm text-white/60 py-6 text-center">
            Nessun allievo ancora. Invita qualcuno qui sopra per iniziare.
          </p>
        ) : (
          <ul className="space-y-2">
            {athletes.map((athlete) => {
              const initials = (athlete.full_name ?? "?")
                .split(" ")
                .map((p) => p[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <li
                  key={athlete.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
                >
                  <div className="h-10 w-10 rounded-full glass-brand grid place-items-center text-xs font-semibold">
                    {initials || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {athlete.full_name ?? "Senza nome"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
