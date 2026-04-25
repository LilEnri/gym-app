import { GlassCard } from "@/components/ui/glass-card";
import { createAdminClient } from "@/lib/supabase/admin";
import { AcceptInviteForm } from "./accept-form";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

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
  const { data: invite } = await admin
    .from("invites")
    .select("email, role, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
    return (
      <GlassCard variant="strong" className="p-7 text-center">
        <h1 className="text-xl font-semibold">Invito non trovato</h1>
        <p className="mt-2 text-sm text-white/60">Verifica il link ricevuto via email.</p>
      </GlassCard>
    );
  }

  if (invite.status !== "pending" || new Date(invite.expires_at) < new Date()) {
    return (
      <GlassCard variant="strong" className="p-7 text-center">
        <h1 className="text-xl font-semibold">Invito non più valido</h1>
        <p className="mt-2 text-sm text-white/60">
          L&apos;invito è già stato accettato, revocato o è scaduto. Chiedi al coach di rigenerarlo.
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
