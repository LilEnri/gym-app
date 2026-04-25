import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PUBLIC_PREFIXES = ["/login", "/accept-invite", "/auth/callback"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  // Non autenticato → solo le route public e la root sono accessibili
  if (!user && !isPublic && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Autenticato che visita /login → redirect alla home del proprio ruolo
  if (user && pathname === "/login") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();
    url.pathname = `/${profile?.role ?? "user"}`;
    return NextResponse.redirect(url);
  }

  // Route guard per ruoli
  if (user) {
    if (pathname.startsWith("/admin") || pathname.startsWith("/coach")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (pathname.startsWith("/admin") && profile?.role !== "admin") {
        return NextResponse.redirect(new URL(`/${profile?.role ?? "user"}`, request.url));
      }
      if (
        pathname.startsWith("/coach") &&
        profile?.role !== "coach" &&
        profile?.role !== "admin"
      ) {
        return NextResponse.redirect(new URL(`/${profile?.role ?? "user"}`, request.url));
      }
    }
  }

  return supabaseResponse;
}
