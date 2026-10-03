import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const redirectTo = next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
    ? new URL(next, url.origin)
    : new URL("/", url.origin);

  return NextResponse.redirect(
    redirectTo.origin === url.origin ? redirectTo : new URL("/", url.origin),
  );
}
