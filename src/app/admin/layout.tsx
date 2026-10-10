import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/utils/supabase/server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError && authError.name !== "AuthSessionMissingError") {
    throw new Error(authError.message);
  }
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "admin") redirect("/unauthorized");

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-3xl border border-accent/25 bg-surface p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">FilmShift · Secure Portal</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Admin dashboard</h1>
              <p className="mt-1 text-sm text-text-muted">Choose a workspace to manage one task at a time.</p>
            </div>
            <Link href="/" className="text-sm font-semibold text-text-muted transition-colors hover:text-accent">
              Back to FilmShift
            </Link>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
