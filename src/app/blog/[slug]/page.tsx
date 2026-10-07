import Link from "next/link";
import { notFound } from "next/navigation";
import { formatBlogMediaType, getPublishedPost, getPublishedPostComments } from "@/utils/blogService";
import { sanitizePostHtml } from "@/utils/sanitizePostHtml";
import { createClient } from "@/utils/supabase/server";
import BlogComments from "@/components/BlogComments";

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(value));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let post = null;

  try {
    post = await getPublishedPost(slug);
  } catch {
    post = null;
  }

  if (!post) notFound();

  const [comments, supabase] = await Promise.all([
    getPublishedPostComments(post.id),
    createClient(),
  ]);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError && authError.name !== "AuthSessionMissingError") {
    throw new Error(authError.message);
  }

  let profile: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    role: string | null;
  } | null = null;
  if (user) {
    const { data, error } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url, role")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    profile = data;
  }

  const authorName = post.author?.display_name || post.author?.username || "FilmShift member";
  const currentAuthor = {
    username: profile?.username ?? null,
    display_name: profile?.display_name ?? user?.user_metadata?.display_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
  };

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:py-16">
      <article className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-sm font-semibold text-text-muted transition-colors hover:text-accent">Back to The Journal</Link>
        <div className="mt-10 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-trending-text">
          <span>{post.content_type}</span>
          {post.media_type && <><span aria-hidden="true">·</span><span>{formatBlogMediaType(post.media_type)}</span></>}
        </div>
        <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight sm:text-6xl">{post.title}</h1>
        <div className="mt-6 flex items-center gap-3 text-sm text-text-muted">
          {post.author?.username ? (
            <Link href={`/users/${post.author.username}`} className="flex items-center gap-3 hover:text-accent">
              {post.author.avatar_url ? (
                <img src={post.author.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface font-bold">{authorName[0]}</span>
              )}
              <span>
                <span className="block font-semibold">{authorName}</span>
                <span className="block text-xs text-text-muted">@{post.author.username}</span>
              </span>
            </Link>
          ) : (
            <>
              {post.author?.avatar_url ? <img src={post.author.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface font-bold">{authorName[0]}</span>}
              <span>{authorName}</span>
            </>
          )}
          <span aria-hidden="true">·</span><span>{formatDate(post.published_at)}</span>
        </div>
        <div 
          className="prose prose-invert max-w-none text-foreground/90 mt-8"
          dangerouslySetInnerHTML={{ __html: sanitizePostHtml(post.body) }}
        />
{post.tmdb_id && post.media_type !== "general" && (
  <Link href={
      post.media_type === "tv" || 
      post.media_type === "show" || 
      post.media_type === "anime" || 
      post.media_type === "docuseries"
        ? `/tv/${post.tmdb_id}`
        : `/movie/${post.tmdb_id}`
    } 
    className="mt-12 inline-flex rounded-xl border border-accent/50 bg-accent/10 px-4 py-3 font-semibold text-trending-text transition-colors hover:border-accent hover:text-accent"
  >
    View linked title
  </Link>
)}
      </article>
      <BlogComments
        key={comments.map(({ id, updated_at }) => `${id}:${updated_at}`).join(",")}
        postId={post.id}
        initialComments={comments}
        currentUserId={user?.id ?? null}
        currentAuthor={currentAuthor}
        isAdmin={profile?.role === "admin"}
      />
    </main>
  );
}
