import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
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
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isPublicRoute = pathname === "/" || isAuthRoute;

  // Non autenticato → redirect a login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Autenticato che visita /login o /register → redirect a dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Route-guard sui ruoli
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, locked")
      .eq("id", user.id)
      .single();

    if (profile?.locked && !pathname.startsWith("/locked")) {
      const url = request.nextUrl.clone();
      url.pathname = "/locked";
      return NextResponse.redirect(url);
    }

    if (profile && !profile.locked) {
      if (pathname.startsWith("/admin") && profile.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (pathname.startsWith("/coach") && profile.role !== "coach" && profile.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return supabaseResponse;
}
