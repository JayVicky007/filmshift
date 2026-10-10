"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type ManagedPost = {
  id: string;
  title: string;
  status: "draft" | "published";
  updated_at: string;
  author:
    | { username: string | null; display_name: string | null }
    | Array<{ username: string | null; display_name: string | null }>
    | null;
};

function getAuthor(post: ManagedPost) {
  return Array.isArray(post.author) ? post.author[0] : post.author;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminPostManagement({
  initialPosts,
}: {
  initialPosts: ManagedPost[];
}) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [search, setSearch] = useState("");
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return posts;
    return posts.filter((post) => {
      const author = getAuthor(post);
      return post.title.toLocaleLowerCase().includes(query) ||
        author?.username?.toLocaleLowerCase().includes(query) ||
        author?.display_name?.toLocaleLowerCase().includes(query);
    });
  }, [posts, search]);

  async function deletePost(post: ManagedPost) {
    if (deletingPostId) return;
    const confirmed = window.confirm(
      `Permanently delete "${post.title}"? Its comments, likes, reports, and notifications will also be deleted. This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingPostId(post.id);
    setErrorMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("admin_delete_post", {
        p_post_id: post.id,
      });
      if (error) throw new Error(error.message);

      setPosts((current) => current.filter(({ id }) => id !== post.id));
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error
        ? `Unable to delete "${post.title}": ${error.message}`
        : `Unable to delete "${post.title}" due to an unexpected error.`);
    } finally {
      setDeletingPostId(null);
    }
  }

  return (
    <section className="mx-auto mt-8 max-w-4xl rounded-3xl border border-text-muted/15 bg-surface p-6 sm:p-8">
      <div>
        <h2 className="text-2xl font-black">Manage posts</h2>
        <p className="mt-1 text-sm text-text-muted">
          Search drafts and publications. Deleting a post permanently removes its comments, likes, reports, and notifications.
        </p>
      </div>

      <label className="mt-5 block text-sm font-semibold">
        Find a post
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title or author"
          className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-sm text-foreground"
        />
      </label>

      {errorMessage && <p role="alert" className="mt-4 text-sm text-rose-600 dark:text-rose-400">{errorMessage}</p>}

      {filteredPosts.length ? (
        <ul className="mt-5 space-y-3">
          {filteredPosts.map((post) => {
            const author = getAuthor(post);
            const authorName = author?.display_name || author?.username || "Unknown author";
            return (
              <li
                key={post.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-text-muted/15 bg-background/60 p-4"
              >
                <div className="min-w-0">
                  <h3 className="break-words font-bold">{post.title}</h3>
                  <p className="mt-1 text-xs text-text-muted">
                    By {authorName} · {post.status === "published" ? "Published" : "Draft"} · Updated {formatDate(post.updated_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void deletePost(post)}
                  disabled={deletingPostId !== null}
                  className="rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-500/10 disabled:cursor-wait disabled:opacity-50 dark:text-rose-400"
                >
                  {deletingPostId === post.id ? "Deleting..." : "Delete post"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-text-muted/20 p-5 text-center text-sm text-text-muted">
          {posts.length ? "No posts match your search." : "There are no posts to manage yet."}
        </p>
      )}
    </section>
  );
}
