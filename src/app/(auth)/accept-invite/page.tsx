import { GlassCard } from "@/components/ui/glass-card";
import { createAdminClient } from "@/lib/supabase/admin";
import type { InviteRow } from "@/lib/supabase/database.types";
import { AcceptInviteForm } from "./accept-form";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

type InviteCheck = Pick<InviteRow, "email" | "role">;

export default async function AcceptInvitePage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <GlassCard variant="strong" className="p-7 text-center">
        <h1 className="text-xl font-semibold">Link non valido</h1>
        <p className="mt-2 text-sm text-white/60">Manca il token di invito.</p>
      </GlassCard>
    );
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  // Filtri direttamente nella query: non serve check successivo su status/expires
  const { data } = await admin
    .from("invites")
    .select("email, role")
    .eq("token", token)
    .eq("status", "pending")
    .gt("expires_at", nowIso)
    .maybeSingle();

  const invite = data as InviteCheck | null;

  if (!invite) {
    return (
      <GlassCard variant="strong" className="p-7 text-center">
        <h1 className="text-xl font-semibold">Invito non valido</h1>
        <p className="mt-2 text-sm text-white/60">
          Il link non è valido, è già stato usato o è scaduto. Chiedi al coach di rigenerarlo.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="strong" className="p-7">
      <h1 className="text-2xl font-semibold tracking-tight">Completa la registrazione</h1>
      <p className="mt-1 text-sm text-white/60">
        Sei stato invitato come <span className="text-brand-400">{invite.role}</span>.
      </p>
      <div className="mt-6">
        <AcceptInviteForm email={invite.email} />
      </div>
    </GlassCard>
  );
}
