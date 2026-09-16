import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

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
    <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:py-16">
      <div className="mx-auto max-w-4xl space-y-12">
        
        {/* Profile Info Slate Header */}
        <header className="flex items-center gap-5 rounded-3xl border border-text-muted/15 bg-surface p-6 sm:p-8">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent bg-accent/20 text-xl font-bold text-accent">
              {displayName[0].toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black tracking-tight">{displayName}</h1>
            <p className="text-sm text-text-muted">@{profile?.username || "user"}</p>
            {profile?.bio && <p className="mt-2 text-sm text-foreground/80">{profile.bio}</p>}
          </div>
        </header>

        {/* Dynamic Drafts Workspace Section (Only visible to the owner) */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4">
            My Private Drafts ({drafts.length})
          </h2>
          {drafts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-text-muted/20 p-6 text-sm text-text-muted text-center">
              No active drafts. Everything is published!
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {drafts.map((draft) => (
                <article key={draft.id} className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5 relative group hover:border-accent transition-colors">
                  <div className="flex justify-between items-center text-xs text-yellow-400 font-semibold uppercase tracking-wider">
                    <span>{draft.content_type}</span>
                    <span className="bg-yellow-500/10 px-2 py-0.5 rounded text-[10px]">Draft</span>
                  </div>
                  {/* Note: We will hook up the edit/preview page next */}
                  <h3 className="mt-3 text-lg font-bold tracking-tight">
                      <Link href={`/blog/edit/${draft.id}`} className="hover:underline">
                      {draft.title || "Untitled Draft"}
                    </Link>
                  </h3>
                  {draft.excerpt && <p className="mt-2 text-xs text-text-muted line-clamp-2">{draft.excerpt}</p>}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* User's Live Published Posts Section */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-trending-text mb-4">
            Live Contributions ({published.length})
          </h2>
          {published.length === 0 ? (
            <div className="rounded-2xl border border-text-muted/15 bg-surface p-6 text-sm text-text-muted text-center">
              You haven't shared any public reviews yet.
            </div>
          ) : (
            <div className="space-y-4">
              {published.map((post) => (
                <div key={post.id} className="flex justify-between items-center rounded-xl border border-text-muted/15 bg-surface p-4 hover:border-text-muted/30 transition-colors">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{post.content_type}</span>
                    <h3 className="font-bold"><Link href={`/blog/${post.slug}`} className="hover:text-accent">{post.title}</Link></h3>
                    <p className="text-xs text-text-muted mt-1">Published: {formatDate(post.published_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
