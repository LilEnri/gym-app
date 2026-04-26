import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PUBLIC_PREFIXES = ["/login", "/accept-invite", "/auth/callback"];

/**
 * Copia tutti i cookie da `source` in `target` e restituisce target.
 * Indispensabile quando middleware crea una nuova NextResponse (redirect)
 * dopo che supabase.auth.getUser() ha rinfrescato i token: senza questa
 * propagazione i cookie aggiornati vanno persi → al prossimo request
 * la sessione non viene riconosciuta → loop di redirect.
 */
function copyCookies(target: NextResponse, source: NextResponse): NextResponse {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
  return target;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return supabaseResponse;
  }

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

  let user: { id: string } | null = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    return supabaseResponse;
  }

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (!user && !isPublic && pathname !== "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return copyCookies(NextResponse.redirect(redirectUrl), supabaseResponse);
  }

  if (user && pathname === "/login") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const redirectUrl = request.nextUrl.clone();
    const role = (profile as { role?: string } | null)?.role;
    redirectUrl.pathname = `/${role ?? "user"}`;
    return copyCookies(NextResponse.redirect(redirectUrl), supabaseResponse);
  }

  if (user && (pathname.startsWith("/admin") || pathname.startsWith("/coach"))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = (profile as { role?: string } | null)?.role;

    if (pathname.startsWith("/admin") && role !== "admin") {
      return copyCookies(
        NextResponse.redirect(new URL(`/${role ?? "user"}`, request.url)),
        supabaseResponse,
      );
    }
    if (pathname.startsWith("/coach") && role !== "coach" && role !== "admin") {
      return copyCookies(
        NextResponse.redirect(new URL(`/${role ?? "user"}`, request.url)),
        supabaseResponse,
      );
    }
  }

  return supabaseResponse;
}
