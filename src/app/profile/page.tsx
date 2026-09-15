import Link from "next/link";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";
import { createClient } from "@/utils/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const user = userData.user;
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:py-16">
      <section className="mx-auto w-full max-w-2xl rounded-3xl border border-text-muted/15 bg-surface p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:p-8">
        <Link href="/" className="text-sm font-semibold text-text-muted transition-colors hover:text-accent">
          Back to FilmShift
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-trending-text">
          Your account
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Profile</h1>
        <p className="mt-3 text-text-muted">Manage the public details attached to your FilmShift account.</p>
        <ProfileForm
          userId={user.id}
          email={user.email ?? ""}
          initialUsername={profile?.username ?? ""}
          initialAvatarUrl={profile?.avatar_url ?? ""}
        />
      </section>
    </main>
  );
}