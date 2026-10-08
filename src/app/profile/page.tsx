import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DeleteDraftButton from "@/components/DeleteDraftButton";
import ProfileIdentity from "@/components/ProfileIdentity";
import ProfileSettingsDrawer from "@/components/ProfileSettingsDrawer";

// 🚀 FORCE NEXT.JS TO RENDER THIS PROFILE WORKSPACE DYNAMICALLY ON EVERY VISIT
export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If not logged in, kick them back to login
  if (!user) {
    redirect("/login");
  }

  // Fetch the user's personal profile card details
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch ALL posts (both drafts and published) belonging to THIS user
  const { data: userPosts } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, status, content_type, published_at")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  const drafts = userPosts?.filter(post => post.status === "draft") || [];
  const published = userPosts?.filter(post => post.status === "published") || [];

  const displayName = profile?.display_name || profile?.username || "FilmShift Member";

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <ProfileIdentity
          displayName={displayName}
          username={profile?.username || "user"}
          bio={profile?.bio ?? null}
          avatarUrl={profile?.avatar_url ?? null}
          coverImageUrl={profile?.cover_image_url ?? null}
          userId={user.id}
        />

        <ProfileSettingsDrawer
          userId={user.id}
          email={user.email ?? ""}
          profile={profile}
        />

        <section aria-labelledby="profile-posts-heading">
          <h2 id="profile-posts-heading" className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-trending-text">
            Posts ({published.length})
          </h2>
          {published.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-text-muted/20 p-6 text-center text-sm text-text-muted">
              You haven&apos;t published any posts yet.
            </div>
          ) : (
            <div className="space-y-4">
              {published.map((post) => (
                <article key={post.id} className="rounded-2xl border border-text-muted/15 bg-surface p-5 transition-colors hover:border-text-muted/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{post.content_type}</span>
                  <h3 className="mt-1 font-bold">
                    <Link href={`/blog/${post.slug}`} className="hover:text-accent">{post.title}</Link>
                  </h3>
                  {post.excerpt && <p className="mt-2 line-clamp-2 text-sm text-text-muted">{post.excerpt}</p>}
                  <p className="mt-3 text-xs text-text-muted">Published: {formatDate(post.published_at)}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="profile-drafts-heading">
          <h2 id="profile-drafts-heading" className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Drafts ({drafts.length})
          </h2>
          {drafts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-text-muted/20 p-6 text-center text-sm text-text-muted">
              No drafts yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {drafts.map((draft) => (
                <article
                  key={draft.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-text-muted/15 bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_12px_30px_rgba(0,0,0,0.15)]"
                >
                  <Link href={`/blog/edit/${draft.id}`} className="absolute inset-0 rounded-2xl">
                    <span className="sr-only">Edit draft &quot;{draft.title}&quot;</span>
                  </Link>
                  <div className="pointer-events-none relative z-10">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-accent">
                      <span>{draft.content_type || "Article"}</span>
                      <span className="rounded bg-accent/10 px-2 py-0.5 text-[10px]">Draft</span>
                    </div>
                    <h3 className="mt-3 line-clamp-1 text-lg font-bold tracking-tight transition-colors group-hover:text-accent">
                      {draft.title || "Untitled Draft"}
                    </h3>
                    {draft.excerpt && <p className="mt-2 line-clamp-2 text-xs text-text-muted">{draft.excerpt}</p>}
                  </div>
                  <div className="relative z-20 mt-4 flex items-center justify-between border-t border-text-muted/10 pt-3">
                    <span className="text-[11px] text-text-muted">Private draft</span>
                    <DeleteDraftButton postId={draft.id} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
