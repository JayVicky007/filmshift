"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

type PinnedPost = {
  id: string;
  title: string;
  published_at: string | null;
  is_pinned: boolean;
};

export default function AdminPostPins({
  initialPosts,
}: {
  initialPosts: PinnedPost[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [posts, setPosts] = useState(initialPosts);
  const [busyPostId, setBusyPostId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function togglePin(post: PinnedPost) {
    setBusyPostId(post.id);
    setErrorMessage("");

    const { error } = await supabase
      .from("posts")
      .update({ is_pinned: !post.is_pinned })
      .eq("id", post.id);

    if (error) {
      setErrorMessage(`Unable to ${post.is_pinned ? "unpin" : "pin"} post: ${error.message}`);
    } else {
      setPosts((current) => current.map((item) =>
        item.id === post.id ? { ...item, is_pinned: !item.is_pinned } : item,
      ));
      router.refresh();
    }
    setBusyPostId(null);
  }

  return (
    <section className="mx-auto mt-8 max-w-2xl rounded-3xl border border-text-muted/15 bg-surface p-6 sm:p-8">
      <div>
        <h2 className="text-2xl font-black">Pinned blog posts</h2>
        <p className="mt-1 text-sm text-text-muted">
          Pinned posts appear before other posts on The Journal. Among pinned posts, newest publications appear first.
        </p>
      </div>

      {errorMessage && (
        <p role="alert" className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">
          {errorMessage}
        </p>
      )}

      {posts.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-text-muted/20 p-5 text-center text-sm text-text-muted">
          There are no published posts to pin.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-text-muted/10">
          {posts.map((post) => (
            <li key={post.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{post.title}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {post.published_at
                    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(post.published_at))
                    : "Publication date unavailable"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void togglePin(post)}
                disabled={busyPostId === post.id}
                aria-pressed={post.is_pinned}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors disabled:cursor-wait disabled:opacity-50 ${
                  post.is_pinned
                    ? "bg-accent/15 text-accent hover:bg-accent/25"
                    : "border border-text-muted/20 text-text-muted hover:border-accent/50 hover:text-accent"
                }`}
              >
                {busyPostId === post.id ? "Saving..." : post.is_pinned ? "Unpin post" : "Pin post"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
