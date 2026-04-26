"use client";

import { useState, useTransition } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";
import { GlassCard } from "@/components/ui/glass-card";
import { createInviteAction } from "./actions";

export function InviteForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setCreatedLink(null);
    startTransition(async () => {
      const result = await createInviteAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setCreatedLink(`${origin}/accept-invite?token=${result.data.token}`);
    });
  }

  return (
    <GlassCard variant="strong">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="h-5 w-5 text-brand-400" />
        <h2 className="font-display font-semibold">Invita un nuovo allievo</h2>
      </div>

      <form action={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="email">Email allievo</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="allievo@email.it"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" size="md" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Genera invito
        </Button>
      </form>

      {createdLink && (
        <div className="mt-5 rounded-xl bg-emerald-950/30 border border-emerald-900/40 p-3">
          <p className="text-xs text-emerald-300 mb-2">
            Invito creato. Manda questo link all&apos;allievo (scade in 7 giorni):
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-black/30 rounded-lg p-2 break-all text-white/80">
              {createdLink}
            </code>
            <CopyButton value={createdLink} />
          </div>
        </div>
      )}
    </GlassCard>
  );
}
