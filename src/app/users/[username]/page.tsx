import Link from "next/link";
import { notFound } from "next/navigation";
import ProfileIdentity from "@/components/ProfileIdentity";
import { getPublicProfile, getPublishedPostsByAuthor } from "@/utils/blogService";

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export default async function PublicUserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getPublicProfile(username);

  if (!profile) notFound();

  const posts = await getPublishedPostsByAuthor(profile.id);
  const displayName = profile.display_name || profile.username;

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:py-16">
      <div className="mx-auto max-w-4xl">
        <Link href="/blog" className="text-sm font-semibold text-text-muted transition-colors hover:text-accent">
          Back to The Journal
        </Link>

        <div className="mt-8">
          <ProfileIdentity
            displayName={displayName}
            username={profile.username}
            bio={profile.bio}
            avatarUrl={profile.avatar_url}
            coverImageUrl={profile.cover_image_url}
          />
        </div>

        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-trending-text">
            Published contributions ({posts.length})
          </h2>
          {posts.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-text-muted/20 p-6 text-center text-sm text-text-muted">
              No published posts yet.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {posts.map((post) => (
                <article key={post.id} className="rounded-2xl border border-text-muted/15 bg-surface p-5 transition-colors hover:border-accent/50">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{post.content_type}</p>
                  <h3 className="mt-2 text-lg font-bold tracking-tight">
                    <Link href={`/blog/${post.slug}`} className="hover:text-accent">{post.title}</Link>
                  </h3>
                  {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-text-muted">{post.excerpt}</p>}
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-text-muted/10 pt-3 text-xs text-text-muted">
                    <span>{formatDate(post.published_at)}</span>
                    <Link href={`/blog/${post.slug}#comments-heading`} className="whitespace-nowrap hover:text-accent">
                      {post.comment_count ?? 0} {post.comment_count === 1 ? "comment" : "comments"}
                    </Link>
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
