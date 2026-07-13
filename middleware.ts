import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/profile", "/favorites", "/messages"];
const OWNER_ONLY = ["/dashboard/owner"];
const PROVIDER_ONLY = ["/dashboard/provider"];
const ADMIN_ONLY = ["/dashboard/admin"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));

  if (isProtected && !user) {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (isProtected && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_suspended")
      .eq("id", user.id)
      .single();

    if (profile?.is_suspended) {
      await supabase.auth.signOut();
      const redirectUrl = new URL("/auth/login", request.url);
      redirectUrl.searchParams.set("suspended", "true");
      return NextResponse.redirect(redirectUrl);
    }

    const role = profile?.role;
    if (OWNER_ONLY.some((p) => path.startsWith(p)) && role !== "owner" && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (PROVIDER_ONLY.some((p) => path.startsWith(p)) && role !== "service_provider" && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (ADMIN_ONLY.some((p) => path.startsWith(p)) && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
