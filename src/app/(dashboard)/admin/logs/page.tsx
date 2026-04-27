import { redirect } from "next/navigation";
import { Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GlassCard } from "@/components/ui/glass-card";

export const dynamic = "force-dynamic";

type LogRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  role_changed: { label: "Cambio ruolo", color: "text-amber-300" },
  user_suspended: { label: "Sospensione", color: "text-orange-300" },
  user_activated: { label: "Riattivazione", color: "text-emerald-300" },
  user_deleted: { label: "Eliminazione", color: "text-red-300" },
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

export default async function AdminLogsPage() {
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
  const { data: logsData } = await admin
    .from("activity_logs")
    .select("id, actor_id, action, entity_type, entity_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const logs = (logsData ?? []) as LogRow[];

  // Risolvi nomi attori e target
  const ids = new Set<string>();
  logs.forEach((l) => {
    if (l.actor_id) ids.add(l.actor_id);
    if (l.entity_id) ids.add(l.entity_id);
  });

  const nameById = new Map<string, string>();
  if (ids.size > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(ids));
    for (const p of (profiles ?? []) as Array<{ id: string; full_name: string | null }>) {
      nameById.set(p.id, p.full_name ?? "(senza nome)");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Log</h1>
        <p className="mt-1 text-sm text-white/60">
          Cronologia delle azioni amministrative (ultime 200).
        </p>
      </div>

      {logs.length === 0 ? (
        <GlassCard className="text-center py-10">
          <Activity className="mx-auto h-8 w-8 text-white/40" />
          <h2 className="mt-3 font-display font-semibold">Nessuna attività</h2>
          <p className="mt-1 text-sm text-white/60">Le azioni admin compariranno qui.</p>
        </GlassCard>
      ) : (
        <ul className="space-y-2">
          {logs.map((l) => {
            const meta = ACTION_LABELS[l.action] ?? { label: l.action, color: "text-white/70" };
            const actor = l.actor_id ? nameById.get(l.actor_id) ?? "?" : "sistema";
            const target = l.entity_id ? nameById.get(l.entity_id) ?? l.entity_id.slice(0, 8) : null;
            const newRole =
              l.action === "role_changed" && l.metadata && typeof l.metadata === "object"
                ? String((l.metadata as { newRole?: unknown }).newRole ?? "")
                : null;
            return (
              <li key={l.id}>
                <GlassCard className="!p-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-2 w-2 rounded-full bg-current ${meta.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className={`font-medium ${meta.color}`}>{meta.label}</span>
                        {target && (
                          <>
                            {" "}
                            <span className="text-white/50">su</span>{" "}
                            <span className="font-medium">{target}</span>
                          </>
                        )}
                        {newRole && (
                          <>
                            {" "}
                            <span className="text-white/50">→</span>{" "}
                            <span className="text-brand-300 font-mono text-xs">{newRole}</span>
                          </>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-white/50">
                        {actor} · {fmt(l.created_at)}
                      </p>
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
