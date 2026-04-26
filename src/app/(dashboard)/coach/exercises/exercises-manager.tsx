"use client";

import { useMemo, useState, useTransition } from "react";
import { ImageOff, Plus, Search } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createExerciseAction, updateExerciseAction } from "./actions";

type Exercise = {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string | null;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  is_preset: boolean;
};

const MUSCLE_GROUPS = [
  "petto",
  "schiena",
  "gambe",
  "spalle",
  "braccia",
  "core",
  "cardio",
  "altro",
];

export function ExercisesManager({ exercises }: { exercises: Exercise[] }) {
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscle_group.toLowerCase().includes(q) ||
        (e.equipment ?? "").toLowerCase().includes(q),
    );
  }, [exercises, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Exercise[]>();
    for (const e of filtered) {
      const arr = map.get(e.muscle_group) ?? [];
      arr.push(e);
      map.set(e.muscle_group, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            placeholder="Cerca per nome, muscolo o attrezzo…"
          />
        </div>
        <Button type="button" onClick={() => setShowNew((v) => !v)} size="md">
          <Plus className="h-4 w-4" /> {showNew ? "Annulla" : "Nuovo esercizio"}
        </Button>
      </div>

      {showNew && <NewExerciseForm onDone={() => setShowNew(false)} />}

      {grouped.map(([group, items]) => (
        <section key={group}>
          <h2 className="text-xs font-medium uppercase tracking-wider text-white/50 mb-2 mt-4">
            {group}
          </h2>
          <ul className="space-y-2">
            {items.map((ex) => (
              <li key={ex.id}>
                <ExerciseRow
                  exercise={ex}
                  isEditing={editingId === ex.id}
                  onToggleEdit={() => setEditingId(editingId === ex.id ? null : ex.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ExerciseRow({
  exercise,
  isEditing,
  onToggleEdit,
}: {
  exercise: Exercise;
  isEditing: boolean;
  onToggleEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateExerciseAction(formData);
      onToggleEdit();
    });
  }

  return (
    <GlassCard className="!p-3">
      <div className="flex items-center gap-3">
        <ExerciseThumb url={exercise.image_url} alt={exercise.name} />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{exercise.name}</p>
          <p className="text-xs text-white/50 mt-0.5">
            {exercise.equipment ?? "—"}
            {exercise.is_preset ? " · preset" : " · custom"}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleEdit}
          className="text-xs text-brand-400 hover:text-brand-300 px-2 py-1 rounded"
        >
          {isEditing ? "Chiudi" : "Modifica"}
        </button>
      </div>

      {isEditing && (
        <form action={handleSubmit} className="mt-3 pt-3 border-t border-white/5 space-y-3">
          <input type="hidden" name="id" value={exercise.id} />

          <div>
            <Label htmlFor={`img-${exercise.id}`}>URL immagine</Label>
            <Input
              id={`img-${exercise.id}`}
              name="imageUrl"
              type="url"
              defaultValue={exercise.image_url ?? ""}
              placeholder="https://…"
            />
            <p className="mt-1 text-xs text-white/40">
              Incolla il link diretto a un&apos;immagine (es. da Wikimedia, Imgur, ecc.).
            </p>
          </div>

          <div>
            <Label htmlFor={`vid-${exercise.id}`}>URL video (opz.)</Label>
            <Input
              id={`vid-${exercise.id}`}
              name="videoUrl"
              type="url"
              defaultValue={exercise.video_url ?? ""}
              placeholder="https://youtube.com/…"
            />
          </div>

          <div>
            <Label htmlFor={`desc-${exercise.id}`}>Descrizione (opz.)</Label>
            <Input
              id={`desc-${exercise.id}`}
              name="description"
              defaultValue={exercise.description ?? ""}
              placeholder="Note tecniche, accortezze, etc."
            />
          </div>

          <Button type="submit" size="md" disabled={isPending}>
            Salva
          </Button>
        </form>
      )}
    </GlassCard>
  );
}

function ExerciseThumb({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <div className="h-12 w-12 rounded-lg bg-white/5 grid place-items-center text-white/30 shrink-0">
        <ImageOff className="h-4 w-4" />
      </div>
    );
  }
  // Usiamo <img> normale: l'utente puo incollare URL da qualsiasi host
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className="h-12 w-12 rounded-lg object-cover bg-white/5 shrink-0"
    />
  );
}

function NewExerciseForm({ onDone }: { onDone: () => void }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createExerciseAction(formData);
      onDone();
    });
  }

  return (
    <GlassCard variant="strong">
      <h2 className="font-display font-semibold mb-3">Nuovo esercizio</h2>
      <form action={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="new-name">Nome</Label>
          <Input id="new-name" name="name" required placeholder="Es. Hip thrust" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="new-mg">Gruppo muscolare</Label>
            <Select id="new-mg" name="muscleGroup" required defaultValue="petto">
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="new-eq">Attrezzo (opz.)</Label>
            <Input id="new-eq" name="equipment" placeholder="bilanciere / manubri / …" />
          </div>
        </div>

        <div>
          <Label htmlFor="new-img">URL immagine</Label>
          <Input id="new-img" name="imageUrl" type="url" placeholder="https://…" />
        </div>

        <div>
          <Label htmlFor="new-vid">URL video (opz.)</Label>
          <Input id="new-vid" name="videoUrl" type="url" placeholder="https://youtube.com/…" />
        </div>

        <div>
          <Label htmlFor="new-desc">Descrizione (opz.)</Label>
          <Input id="new-desc" name="description" placeholder="Note tecniche…" />
        </div>

        <div className="flex gap-2">
          <Button type="submit" size="md" disabled={isPending}>
            Crea
          </Button>
          <Button type="button" variant="glass" size="md" onClick={onDone}>
            Annulla
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
