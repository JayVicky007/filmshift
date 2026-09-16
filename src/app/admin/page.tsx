import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  
  // 1. Get the authenticated user session from Supabase Auth
  const { data: { user } } = await supabase.auth.getUser();

  // If not logged in at all, kick them to the login page
  if (!user) {
    redirect("/login");
  }

  // 2. Query your public.profiles table to look up this specific user's role
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single(); // .single() ensures we get one object back, not an array

  // 3. The underlying factor: If the database value isn't 'admin', block access!
  if (error || !profile || profile.role !== "admin") {
    redirect("/unauthorized"); // Or back to home page "/"
  }

  // 4. If they passed the check, render the secure Admin Dashboard
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-2xl rounded-3xl border border-yellow-400/30 bg-surface p-8">
        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
          Secure Portal
        </span>
        <h1 className="mt-4 text-3xl font-black">Welcome to the Admin Dashboard</h1>
        <p className="mt-2 text-text-muted">
          This text is completely hidden from normal users. If you can see this, your database role check works!
        </p>
      </div>
    </main>
  );
}
