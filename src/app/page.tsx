import Link from "next/link";
import { Dumbbell, LineChart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

export default function LandingPage() {
  return (
    <main className="relative min-h-[100dvh] flex flex-col">
      {/* Nav */}
      <header className="px-5 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl glass-brand grid place-items-center">
            <Dumbbell className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold tracking-tight">Gym App</span>
        </div>
        <Link href="/login">
          <Button variant="glass" size="sm">Accedi</Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="flex-1 px-5 sm:px-8 flex items-center">
        <div className="max-w-5xl mx-auto w-full py-10 sm:py-16">
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
            La tua palestra,
            <br />
            <span className="text-gradient-brand">in una sola app.</span>
          </h1>
          <p className="mt-5 text-lg text-white/70 max-w-xl">
            Gestisci schede, allievi e progressi. Per coach e atleti, ovunque tu sia.
          </p>

          <div className="mt-8 flex gap-3 flex-wrap">
            <Link href="/register">
              <Button size="lg">Inizia ora</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="glass">Ho già un account</Button>
            </Link>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            <GlassCard>
              <Users className="h-6 w-6 text-brand-400" />
              <h3 className="mt-3 font-semibold">Allievi & coach</h3>
              <p className="mt-1 text-sm text-white/60">
                Ogni ruolo ha la propria vista. Il coach crea, l&apos;allievo esegue.
              </p>
            </GlassCard>
            <GlassCard>
              <Dumbbell className="h-6 w-6 text-brand-400" />
              <h3 className="mt-3 font-semibold">Schede su misura</h3>
              <p className="mt-1 text-sm text-white/60">
                Libreria di esercizi, serie, ripetizioni e note personalizzate.
              </p>
            </GlassCard>
            <GlassCard>
              <LineChart className="h-6 w-6 text-brand-400" />
              <h3 className="mt-3 font-semibold">Progressi</h3>
              <p className="mt-1 text-sm text-white/60">
                Storico, grafici e statistiche per tracciare ogni miglioramento.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      <footer className="px-5 sm:px-8 py-6 text-sm text-white/40">
        © {new Date().getFullYear()} Gym App
      </footer>
    </main>
  );
}
