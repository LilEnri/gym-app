"use client";

import { useMemo, useState, useTransition } from "react";
import { Lock, Search, Trash2, Unlock } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  deleteUserAction,
  setUserRoleAction,
  toggleUserActiveAction,
} from "./actions";

type UserRow = {
  id: string;
  role: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
};

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-rose-500/20 text-rose-200 border-rose-400/30",
  coach: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  user: "bg-white/10 text-white/70 border-white/15",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function UsersList({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "admin" | "coach" | "user" | "suspended">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === "suspended" && u.is_active) return false;
      if (filter !== "all" && filter !== "suspended" && u.role !== filter) return false;
      if (!q) return true;
      return (
        (u.full_name ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, query, filter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            placeholder="Cerca per nome o email…"
          />
        </div>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="sm:w-48"
        >
          <option value="all">Tutti</option>
          <option value="admin">Admin</option>
          <option value="coach">Coach</option>
          <option value="user">Allievi</option>
          <option value="suspended">Solo sospesi</option>
        </Select>
      </div>

      <ul className="space-y-2">
        {filtered.map((u) => (
          <li key={u.id}>
            <UserRowCard user={u} isMe={u.id === currentUserId} />
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="text-sm text-white/50 text-center py-6">Nessun risultato.</li>
        )}
      </ul>
    </div>
  );
}

function UserRowCard({ user, isMe }: { user: UserRow; isMe: boolean }) {
  const [isPending, startTransition] = useTransition();
  const initials = (user.full_name ?? user.email ?? "?")
    .split(/[\s.@]/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleRoleChange(newRole: string) {
    if (isMe) return;
    const fd = new FormData();
    fd.set("userId", user.id);
    fd.set("role", newRole);
    startTransition(() => setUserRoleAction(fd));
  }

  function handleToggleActive() {
    if (isMe) return;
    const fd = new FormData();
    fd.set("userId", user.id);
    fd.set("setActive", (!user.is_active).toString());
    startTransition(() => toggleUserActiveAction(fd));
  }

  function handleDelete() {
    if (isMe) return;
    if (!confirm(`Eliminare definitivamente ${user.full_name ?? user.email}? L'azione è irreversibile.`)) return;
    const fd = new FormData();
    fd.set("userId", user.id);
    startTransition(() => deleteUserAction(fd));
  }

  return (
    <GlassCard className={`!p-3 ${!user.is_active ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full glass-brand grid place-items-center text-xs font-semibold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{user.full_name ?? "(senza nome)"}</p>
            {isMe && <span className="text-[10px] text-white/40 uppercase">tu</span>}
          </div>
          <p className="text-xs text-white/60 truncate">{user.email ?? "—"}</p>
          <p className="text-[10px] text-white/40 mt-0.5">Iscritto il {fmt(user.created_at)}</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider border ${
            ROLE_BADGE[user.role] ?? ROLE_BADGE.user
          }`}
        >
          {user.role}
        </span>

        {!user.is_active && (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider bg-amber-500/20 text-amber-200 border border-amber-400/30">
            Sospeso
          </span>
        )}

        <Select
          value={user.role}
          onChange={(e) => handleRoleChange(e.target.value)}
          disabled={isMe || isPending}
          className="h-8 text-xs ml-auto sm:w-32"
          aria-label="Cambia ruolo"
        >
          <option value="user">user</option>
          <option value="coach">coach</option>
          <option value="admin">admin</option>
        </Select>

        <button
          type="button"
          onClick={handleToggleActive}
          disabled={isMe || isPending}
          className="h-8 w-8 grid place-items-center rounded-lg glass text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          aria-label={user.is_active ? "Sospendi" : "Riattiva"}
          title={user.is_active ? "Sospendi" : "Riattiva"}
        >
          {user.is_active ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isMe || isPending}
          className="h-8 w-8 grid place-items-center rounded-lg glass text-red-300 hover:bg-red-500/10 hover:text-red-200 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          aria-label="Elimina utente"
          title="Elimina utente"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </GlassCard>
  );
}
