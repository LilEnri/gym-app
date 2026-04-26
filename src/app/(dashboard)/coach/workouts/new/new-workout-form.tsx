"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createWorkoutAction } from "../actions";

interface NewWorkoutFormProps {
  athletes: Array<{ id: string; full_name: string | null }>;
}

export function NewWorkoutForm({ athletes }: NewWorkoutFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createWorkoutAction(formData);
      } catch (e) {
        // redirect() throws — propagalo
        if (e && typeof e === "object" && "digest" in e &&
            String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) {
          throw e;
        }
        setError(e instanceof Error ? e.message : "Errore");
      }
    });
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Titolo</Label>
        <Input id="title" name="title" required placeholder="Es. Forza 4 settimane" />
      </div>

      <div>
        <Label htmlFor="athleteId">Allievo</Label>
        <Select id="athleteId" name="athleteId" required defaultValue="">
          <option value="" disabled>Seleziona un allievo…</option>
          {athletes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.full_name ?? "(senza nome)"}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Descrizione (opzionale)</Label>
        <Input
          id="description"
          name="description"
          placeholder="Es. Mesociclo di accumulo, focus pulling"
        />
      </div>

      <div>
        <Label htmlFor="structure">Struttura</Label>
        <Select id="structure" name="structure" required defaultValue="weekly">
          <option value="weekly">Settimanale (Lun/Mer/Ven)</option>
          <option value="rotation">A rotazione (A/B/C)</option>
          <option value="single">Singola sessione</option>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="startDate">Data inizio</Label>
          <Input id="startDate" name="startDate" type="date" required defaultValue={today} />
        </div>
        <div>
          <Label htmlFor="endDate">Data fine (opz.)</Label>
          <Input id="endDate" name="endDate" type="date" />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Crea scheda
      </Button>
    </form>
  );
}
