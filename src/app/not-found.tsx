import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-5">
      <div className="glass-strong rounded-2xl p-8 max-w-md w-full text-center">
        <p className="text-6xl font-display font-bold text-gradient-brand">404</p>
        <h1 className="mt-3 text-xl font-semibold">Pagina non trovata</h1>
        <p className="mt-2 text-sm text-white/60">
          Il link che hai aperto non esiste o è stato rimosso.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center h-11 px-5 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-medium"
        >
          Torna alla home
        </Link>
      </div>
    </main>
  );
}
