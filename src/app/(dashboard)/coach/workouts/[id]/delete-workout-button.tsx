"use client";

import { Trash2 } from "lucide-react";
import { deleteWorkoutAction } from "../actions";

export function DeleteWorkoutButton({ workoutId }: { workoutId: string }) {
  return (
    <form
      action={deleteWorkoutAction}
      onSubmit={(e) => {
        if (!confirm("Eliminare la scheda? Questa operazione non si può annullare.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={workoutId} />
      <button
        type="submit"
        className="h-9 px-3 rounded-lg text-sm font-medium glass text-red-300 hover:bg-red-500/10 hover:text-red-200 inline-flex items-center gap-1.5"
      >
        <Trash2 className="h-4 w-4" /> Elimina
      </button>
    </form>
  );
}
