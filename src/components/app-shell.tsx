"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Home, LineChart, LogOut, Settings, Shield, Users, Calendar, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/supabase/database.types";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const navByRole: Record<UserRole, NavItem[]> = {
  user: [
    { href: "/user", label: "Home", icon: Home },
    { href: "/user/history", label: "Storico", icon: Calendar },
    { href: "/user/stats", label: "Statistiche", icon: LineChart },
    { href: "/user/profile", label: "Profilo", icon: UserCog },
  ],
  coach: [
    { href: "/coach", label: "Home", icon: Home },
    { href: "/coach/athletes", label: "Allievi", icon: Users },
    { href: "/coach/workouts", label: "Schede", icon: Dumbbell },
    { href: "/coach/exercises", label: "Esercizi", icon: Dumbbell },
  ],
  admin: [
    { href: "/admin", label: "Home", icon: Home },
    { href: "/admin/users", label: "Utenti", icon: Users },
    { href: "/admin/logs", label: "Log", icon: Shield },
    { href: "/admin/settings", label: "Impostazioni", icon: Settings },
  ],
};

interface AppShellProps {
  role: UserRole;
  fullName: string | null;
  children: React.ReactNode;
}

export function AppShell({ role, fullName, children }: AppShellProps) {
  const pathname = usePathname();
  const items = navByRole[role];
  const initials = (fullName ?? "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:sticky lg:top-0 lg:h-[100dvh] lg:p-4">
        <div className="glass rounded-2xl h-full flex flex-col p-4">
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="h-9 w-9 rounded-xl glass-brand grid place-items-center">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span className="font-semibold tracking-tight">Gym App</span>
          </div>

          <nav className="mt-6 flex-1 space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                    active
                      ? "glass-brand text-white"
                      : "text-white/70 hover:text-white hover:bg-white/5",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="h-9 w-9 rounded-full glass-brand grid place-items-center text-xs font-semibold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fullName ?? "Utente"}</p>
                <p className="text-xs text-white/50 capitalize">{role}</p>
              </div>
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Esci
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Topbar mobile */}
      <header className="lg:hidden sticky top-0 z-30 px-4 pt-4">
        <div className="glass rounded-2xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg glass-brand grid place-items-center">
              <Dumbbell className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight">Gym App</span>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-white/60 hover:text-white" aria-label="Esci">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-4 py-5 pb-28 lg:pb-8 lg:px-8 lg:py-8">
        <div className="max-w-5xl mx-auto w-full">{children}</div>
      </main>

      {/* Bottom nav mobile */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3"
        style={{ background: "linear-gradient(to top, rgba(10,6,9,0.9), transparent)" }}
      >
        <div className="glass-strong rounded-2xl px-2 py-2 flex items-center justify-around">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl transition-colors",
                  active ? "text-brand-400" : "text-white/60 hover:text-white",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
