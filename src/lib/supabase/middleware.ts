import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Middleware minimale: rinfresca la sessione Supabase ad ogni request,
 * propaga i cookie aggiornati. NIENTE redirect per evitare race condition
 * con i guard nei layout — la protezione delle route è nei singoli layout
 * (dashboard) e pagine.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return supabaseResponse;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Tocca getUser per forzare il refresh dei token; ignoriamo il risultato.
  try {
    await supabase.auth.getUser();
  } catch {
    // Ignora — la pagina deciderà se il caso è recuperabile.
  }

  return supabaseResponse;
}
