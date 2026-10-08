import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatBlogMediaType, getPublishedPostsPage, type BlogPost } from "@/utils/blogService";

const POSTS_PER_PAGE = 9;

function getPageLinks(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const visiblePages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((first, second) => first - second);

  return visiblePages.flatMap((page, index) => {
    const previousPage = visiblePages[index - 1];
    return [
      ...(previousPage && page - previousPage > 1 ? ["ellipsis" as const] : []),
      page,
    ];
  });
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const requestedPage = Number.parseInt(pageParam ?? "1", 10);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  let posts: BlogPost[] = [];
  let errorMessage = "";
  let currentPage = 1;
  let totalPages = 0;
  let totalPosts = 0;

  try {
    const result = await getPublishedPostsPage(page, POSTS_PER_PAGE);
    posts = result.posts;
    currentPage = result.currentPage;
    totalPages = result.totalPages;
    totalPosts = result.total;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unable to load posts.";
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:py-16">
      <header className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-trending-text">FilmShift community</p>
        <h1 className="mt-3 text-5xl font-black tracking-tight">The Journal</h1>
        <p className="mt-4 max-w-2xl text-lg text-text-muted">
          Reviews, recommendations, and thoughtful detours through cinema.
          {totalPosts > 0 && <span className="mt-2 block text-sm">{totalPosts} published {totalPosts === 1 ? "post" : "posts"}</span>}
        </p>
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
                  {post.cover_image_url && (
                    <img
                      src={post.cover_image_url}
                      alt=""
                      className="-mx-6 -mt-6 mb-5 aspect-video w-[calc(100%+3rem)] rounded-t-2xl object-cover"
                    />
                  )}
                  <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                    <span className="flex items-center gap-2">
                      {post.content_type}
                      {post.is_pinned && (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] text-accent">
                          Pinned
                        </span>
                      )}
                    </span>
                    <span>{formatBlogMediaType(post.media_type)}</span>
                  </div>
                  
                  <h2 className="mt-5 text-2xl font-black tracking-tight">
                    <Link href={`/blog/${post.slug}`} className="transition-colors group-hover:text-accent focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      {post.title}
                    </Link>
                  </h2>
                  
                  {post.excerpt && <p className="mt-3 line-clamp-3 text-text-muted">{post.excerpt}</p>}
                  
                  <div className="mt-6 flex items-center gap-3 border-t border-text-muted/10 pt-4 text-sm text-text-muted">
                    {post.author?.avatar_url ? (
                      <img src={post.author.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background font-bold">
                        {authorName[0]}
                      </span>
                    )}
                    {post.author?.username ? (
                      <Link
                        href={`/users/${post.author.username}`}
                        className="relative z-20 min-w-0 hover:text-accent"
                        aria-label={`View ${authorName}'s profile`}
                      >
                        <span className="block truncate">{authorName}</span>
                        <span className="block text-xs font-normal normal-case tracking-normal">@{post.author.username}</span>
                      </Link>
                    ) : (
                      <span>{authorName}</span>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{formatDate(post.published_at)}</span>
                    <Link
                      href={`/blog/${post.slug}#comments-heading`}
                      className="relative z-20 ml-auto whitespace-nowrap hover:text-accent"
                      aria-label={`${post.comment_count ?? 0} comments on ${post.title}`}
                    >
                      {post.comment_count ?? 0} {post.comment_count === 1 ? "comment" : "comments"}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {!errorMessage && totalPages > 1 && (
          <nav aria-label="Journal pages" className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-text-muted/15 bg-surface/70 px-4 py-4 sm:flex-row sm:px-5">
            <p className="text-sm text-text-muted">
              Page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
              <span className="font-semibold text-foreground">{totalPages}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <Link
                href={currentPage === 2 ? "/blog" : `/blog?page=${currentPage - 1}`}
                aria-label="Previous page"
                aria-disabled={currentPage === 1}
                tabIndex={currentPage === 1 ? -1 : undefined}
                className={`flex h-10 items-center gap-1 rounded-xl border border-text-muted/15 px-3 text-sm font-semibold transition-colors ${
                  currentPage === 1
                    ? "pointer-events-none opacity-40"
                    : "hover:border-accent/50 hover:bg-accent/10"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Link>
              {getPageLinks(currentPage, totalPages).map((pageLink, index) => pageLink === "ellipsis" ? (
                <span key={`ellipsis-${index}`} aria-hidden="true" className="px-1 text-text-muted">…</span>
              ) : (
                <Link
                  key={pageLink}
                  href={pageLink === 1 ? "/blog" : `/blog?page=${pageLink}`}
                  aria-label={`Page ${pageLink}`}
                  aria-current={pageLink === currentPage ? "page" : undefined}
                  className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors ${
                    pageLink === currentPage
                      ? "border-accent bg-accent text-slate-950 shadow-sm"
                      : "border-text-muted/15 hover:border-accent/50 hover:bg-accent/10"
                  }`}
                >
                  {pageLink}
                </Link>
              ))}
              <Link
                href={`/blog?page=${currentPage + 1}`}
                aria-label="Next page"
                aria-disabled={currentPage === totalPages}
                tabIndex={currentPage === totalPages ? -1 : undefined}
                className={`flex h-10 items-center gap-1 rounded-xl border border-text-muted/15 px-3 text-sm font-semibold transition-colors ${
                  currentPage === totalPages
                    ? "pointer-events-none opacity-40"
                    : "hover:border-accent/50 hover:bg-accent/10"
                }`}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </nav>
        )}
      </section>
    </main>
  );
}
