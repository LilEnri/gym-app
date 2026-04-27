import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GlassCard } from "@/components/ui/glass-card";
import { UsersList } from "./users-list";

export const dynamic = "force-dynamic";

type Profile = {
  id: string;
  role: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
};

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if ((myProfile as { role?: string } | null)?.role !== "admin") redirect("/user");

  const admin = createAdminClient();

  const { data: profilesData } = await admin
    .from("profiles")
    .select("id, role, full_name, is_active, created_at")
    .order("created_at", { ascending: false });

  const profiles = (profilesData ?? []) as Profile[];

  // Email da auth.users
  const { data: usersList } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map<string, string>();
  for (const u of usersList?.users ?? []) {
    if (u.email) emailById.set(u.id, u.email);
  }

  const enriched = profiles.map((p) => ({
    ...p,
    email: emailById.get(p.id) ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Utenti</h1>
        <p className="mt-1 text-sm text-white/60">
          Gestione ruoli, sospensione, eliminazione account.
        </p>
      </div>

      {enriched.length === 0 ? (
        <GlassCard className="text-center py-10">
          <p className="text-sm text-white/60">Nessun utente registrato.</p>
        </GlassCard>
      ) : (
        <UsersList users={enriched} currentUserId={user.id} />
      )}
    </div>
  );
}
