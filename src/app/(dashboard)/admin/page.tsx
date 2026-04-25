import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, Shield, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/glass-card";

export default async function AdminHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/user");

  const [{ count: usersCount }, { count: coachCount }, { count: suspendedCount }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "coach"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", false),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-white/60">Area amministrazione</p>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard admin</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Utenti totali</p>
              <p className="mt-1 text-2xl font-semibold">{usersCount ?? 0}</p>
            </div>
            <Users className="h-6 w-6 text-brand-400" />
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Coach</p>
              <p className="mt-1 text-2xl font-semibold">{coachCount ?? 0}</p>
            </div>
            <Shield className="h-6 w-6 text-brand-400" />
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Sospesi</p>
              <p className="mt-1 text-2xl font-semibold">{suspendedCount ?? 0}</p>
            </div>
            <Lock className="h-6 w-6 text-brand-400" />
          </div>
        </GlassCard>
      </div>

      <Link href="/admin/users" className="block group">
        <GlassCard className="transition-all group-hover:bg-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Gestione utenti</h2>
              <p className="mt-1 text-sm text-white/60">
                Visualizza, assegna ruoli, blocca/sblocca utenti.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-white/60 group-hover:text-white" />
          </div>
        </GlassCard>
      </Link>
    </div>
  );
}
