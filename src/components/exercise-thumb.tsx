interface ExerciseThumbProps {
  url: string | null;
  alt: string;
  muscleGroup?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: "h-10 w-10 text-[10px]",
  md: "h-12 w-12 text-xs",
  lg: "h-16 w-16 text-sm",
};

const GROUP_COLORS: Record<string, string> = {
  petto: "from-rose-500/30 to-rose-700/30",
  schiena: "from-blue-500/30 to-blue-700/30",
  gambe: "from-emerald-500/30 to-emerald-700/30",
  spalle: "from-amber-500/30 to-amber-700/30",
  braccia: "from-violet-500/30 to-violet-700/30",
  core: "from-cyan-500/30 to-cyan-700/30",
  cardio: "from-pink-500/30 to-pink-700/30",
};

/** Miniatura esercizio: <img> se url, altrimenti placeholder colorato per gruppo muscolare. */
export function ExerciseThumb({ url, alt, muscleGroup = "", size = "md" }: ExerciseThumbProps) {
  const sizeClass = SIZE_MAP[size];
  const colorClass = GROUP_COLORS[muscleGroup.toLowerCase()] ?? "from-white/10 to-white/5";
  const initial = (muscleGroup[0] ?? "?").toUpperCase();

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        className={`${sizeClass} rounded-lg object-cover bg-white/5 shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} shrink-0 rounded-lg grid place-items-center font-display font-bold text-white/80 bg-gradient-to-br ${colorClass} border border-white/10`}
      aria-label={`Nessuna immagine per ${alt}`}
    >
      {initial}
    </div>
  );
}
