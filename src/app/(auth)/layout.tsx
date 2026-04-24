import Link from "next/link";
import { Dumbbell } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="p-5">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl glass-brand grid place-items-center">
            <Dumbbell className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold tracking-tight">Gym App</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-5 pb-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
