import Link from "next/link";
import { getPublishedPosts, type BlogPost } from "@/utils/blogService";

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export default async function BlogPage() {
  let posts: BlogPost[] = [];
  let errorMessage = "";

  try {
    posts = await getPublishedPosts();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unable to load posts.";
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:py-16">
      <header className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-trending-text">FilmShift community</p>
        <h1 className="mt-3 text-5xl font-black tracking-tight">The Journal</h1>
        <p className="mt-4 max-w-2xl text-lg text-text-muted">Reviews, recommendations, and thoughtful detours through cinema.</p>
      </header>

      <section className="mx-auto mt-12 max-w-7xl">
        {errorMessage ? (
          <p role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-700 dark:text-rose-200">{errorMessage}</p>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-text-muted/15 bg-surface p-8 text-text-muted">No published posts yet. Be the first to write one.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const authorName = post.author?.display_name || post.author?.username || "FilmShift member";
              return (
                <article 
                  key={post.id} 
                  className="group relative rounded-2xl border border-text-muted/15 bg-surface p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_10px_35px_rgba(234,179,8,0.08)] cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                    <span>{post.content_type}</span>
                    <span>{post.media_type}</span>
                  </div>
                  
                  <h2 className="mt-5 text-2xl font-black tracking-tight">
                    <Link href={`/blog/${post.slug}`} className="transition-colors group-hover:text-accent focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      {post.title}
                    </Link>
                  </h2>
                  
                  {post.excerpt && <p className="mt-3 line-clamp-3 text-text-muted relative z-10">{post.excerpt}</p>}
                  
                  <div className="mt-6 flex items-center gap-3 border-t border-text-muted/10 pt-4 text-sm text-text-muted relative z-10">
                    {post.author?.avatar_url ? (
                      <img src={post.author.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background font-bold">
                        {authorName[0]}
                      </span>
                    )}
                    <span>{authorName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDate(post.published_at)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
