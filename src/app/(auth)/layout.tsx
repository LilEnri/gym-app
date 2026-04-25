export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-[100dvh] flex items-center justify-center px-5 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-20 h-64 w-64 -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(225,29,72,0.4), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-10 right-0 h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(136,19,55,0.5), transparent 70%)" }}
      />
      <div className="relative w-full max-w-md">{children}</div>
    </main>
  );
}
