"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type MediaType = "movie" | "tv" | "general";

type AdminPost = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  media_type: string | null;
  tmdb_id: number | null;
  author_id: string;
  author:
    | { username: string | null; display_name: string | null }
    | Array<{ username: string | null; display_name: string | null }>
    | null;
};

type CorrectionHistoryEntry = {
  id: string;
  post_id: string;
  post_title: string;
  actor_id: string | null;
  previous_media_type: string | null;
  new_media_type: string;
  previous_tmdb_id: number | null;
  new_tmdb_id: number | null;
  reason: string;
  created_at: string;
  actor_name: string;
};

type CorrectionResult = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  media_type: MediaType;
  tmdb_id: number | null;
  author_id: string;
  previous_media_type: string | null;
  previous_tmdb_id: number | null;
  reason: string;
  corrected_at: string;
};

function isCorrectionResult(value: unknown): value is CorrectionResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return typeof result.id === "string" &&
    typeof result.title === "string" &&
    typeof result.slug === "string" &&
    (result.status === "draft" || result.status === "published") &&
    (result.media_type === "movie" || result.media_type === "tv" || result.media_type === "general") &&
    (result.tmdb_id === null || typeof result.tmdb_id === "number") &&
    typeof result.author_id === "string" &&
    (result.previous_media_type === null || typeof result.previous_media_type === "string") &&
    (result.previous_tmdb_id === null || typeof result.previous_tmdb_id === "number") &&
    typeof result.reason === "string" &&
    typeof result.corrected_at === "string";
}

const legacyMediaTypeLabels: Record<string, string> = {
  series: "Series",
  show: "Series",
  anime: "Anime",
  animation: "Animation",
  documentary: "Documentary",
  docuseries: "Docuseries",
};

function formatMediaType(value: string | null) {
  if (!value) return "Not set";
  if (value === "movie") return "Movie";
  if (value === "tv" || value === "series" || value === "show" || value === "docuseries") {
    return "TV Show";
  }
  if (value === "general") return "General / Other";
  return legacyMediaTypeLabels[value] ?? value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function PostCorrectionCard({
  post,
  onCorrected,
}: {
  post: AdminPost;
  onCorrected: (correction: CorrectionResult) => void;
}) {
  const supabase = createClient();
  const [mediaType, setMediaType] = useState<MediaType | "">(
    post.media_type === "movie" || post.media_type === "tv" || post.media_type === "general"
      ? post.media_type
      : "",
  );
  const [tmdbId, setTmdbId] = useState(post.tmdb_id?.toString() ?? "");
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isDirty =
    (mediaType !== "" && mediaType !== post.media_type) ||
    (mediaType === "" && post.media_type !== "movie" && post.media_type !== "tv" && post.media_type !== "general") ||
    (mediaType === "general" ? null : (tmdbId.trim() ? Number(tmdbId) : null)) !== post.tmdb_id;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isDirty || isSaving || !mediaType) return;

    const normalizedTmdbId = mediaType === "general" || !tmdbId.trim()
      ? null
      : Number(tmdbId);
    if (normalizedTmdbId !== null && (!Number.isSafeInteger(normalizedTmdbId) || normalizedTmdbId <= 0)) {
      setErrorMessage("Enter a positive whole-number TMDB ID.");
      return;
    }
    if (reason.trim().length < 10 || reason.trim().length > 500) {
      setErrorMessage("Explain the correction in 10 to 500 characters.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setMessage("");

    try {
      const { data, error } = await supabase.rpc("admin_correct_post_metadata", {
        p_post_id: post.id,
        p_media_type: mediaType,
        p_tmdb_id: normalizedTmdbId,
        p_reason: reason.trim(),
      });

      if (error) {
        setErrorMessage(`Unable to correct this post: ${error.message}`);
      } else {
        const result = Array.isArray(data) ? data[0] : data;
        if (!isCorrectionResult(result)) {
          setErrorMessage("The correction completed without returning valid post details.");
        } else {
          onCorrected(result);
          setTmdbId(normalizedTmdbId?.toString() ?? "");
          setReason("");
          setMessage("Metadata corrected. The author has been notified.");
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error
        ? `Unable to correct this post: ${error.message}`
        : "Unable to correct this post due to an unexpected error.");
    } finally {
      setIsSaving(false);
    }
  }

  const author = Array.isArray(post.author) ? post.author[0] : post.author;
  const authorName = author?.display_name || author?.username || "Unknown author";

  return (
    <article className="rounded-2xl border border-text-muted/15 bg-background/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold">{post.title}</h3>
          <p className="mt-1 text-xs text-text-muted">
            By {authorName} · {post.status === "published" ? "Published" : "Draft"}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
          post.status === "published"
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-text-muted/10 text-text-muted"
        }`}>
          {post.status}
        </span>
      </div>
      <p className="mt-3 text-xs text-text-muted">
        Current metadata: {formatMediaType(post.media_type)}
        {post.tmdb_id ? ` · TMDB #${post.tmdb_id}` : " · No linked TMDB title"}
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold">
            Correct media type
            <select
              value={mediaType}
              onChange={(event) => {
                const nextType = event.target.value as MediaType | "";
                setMediaType(nextType);
                if (nextType === "general") setTmdbId("");
                setMessage("");
                setErrorMessage("");
              }}
              className="mt-1.5 w-full rounded-lg border border-text-muted/20 bg-surface px-3 py-2 text-sm text-foreground"
            >
              <option value="" disabled>Select a corrected type</option>
              <option value="movie">Movie</option>
              <option value="tv">TV Show</option>
              <option value="general">General / Other</option>
            </select>
          </label>
          <label className="text-xs font-semibold">
            Linked TMDB ID <span className="font-normal text-text-muted">(optional)</span>
            <input
              type="number"
              min="1"
              step="1"
              value={mediaType === "general" ? "" : tmdbId}
              disabled={mediaType === "general"}
              onChange={(event) => {
                setTmdbId(event.target.value);
                setMessage("");
                setErrorMessage("");
              }}
              placeholder="TMDB title ID"
              className="mt-1.5 w-full rounded-lg border border-text-muted/20 bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-50"
            />
          </label>
        </div>
        <label className="block text-xs font-semibold">
          Reason for correction <span className="font-normal text-text-muted">(shown to the author)</span>
          <textarea
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setMessage("");
              setErrorMessage("");
            }}
            minLength={10}
            maxLength={500}
            rows={2}
            required
            placeholder="Explain why this metadata needs correcting."
            className="mt-1.5 w-full resize-y rounded-lg border border-text-muted/20 bg-surface px-3 py-2 text-sm text-foreground"
          />
          <span className="mt-1 block text-right font-normal text-text-muted">{reason.length}/500</span>
        </label>
        {errorMessage && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{errorMessage}</p>}
        {message && <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
        <button
          type="submit"
          disabled={!isDirty || isSaving}
          className="rounded-lg bg-accent px-3 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving correction..." : "Save metadata correction"}
        </button>
      </form>
    </article>
  );
}

export default function AdminPostCorrections({
  initialPosts,
  initialHistory,
}: {
  initialPosts: AdminPost[];
  initialHistory: CorrectionHistoryEntry[];
}) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [history, setHistory] = useState(initialHistory);
  const [search, setSearch] = useState("");

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return posts;
    return posts.filter((post) =>
      post.title.toLocaleLowerCase().includes(query) ||
      (Array.isArray(post.author) ? post.author[0] : post.author)?.username?.toLocaleLowerCase().includes(query) ||
      (Array.isArray(post.author) ? post.author[0] : post.author)?.display_name?.toLocaleLowerCase().includes(query),
    );
  }, [posts, search]);

  function handleCorrected(correction: CorrectionResult) {
    setPosts((current) => current.map((post) => post.id === correction.id
      ? { ...post, media_type: correction.media_type, tmdb_id: correction.tmdb_id }
      : post));
    setHistory((current) => [{
      id: `${correction.id}-${correction.corrected_at}`,
      post_id: correction.id,
      post_title: correction.title,
      actor_id: null,
      previous_media_type: correction.previous_media_type,
      new_media_type: correction.media_type,
      previous_tmdb_id: correction.previous_tmdb_id,
      new_tmdb_id: correction.tmdb_id,
      reason: correction.reason ?? "",
      created_at: correction.corrected_at,
      actor_name: "You",
    }, ...current].slice(0, 20));
    router.refresh();
  }

  return (
    <section className="mx-auto mt-8 max-w-4xl rounded-3xl border border-text-muted/15 bg-surface p-6 sm:p-8">
      <div>
        <h2 className="text-2xl font-black">Post metadata corrections</h2>
        <p className="mt-1 text-sm text-text-muted">
          Correct a post&apos;s media type or TMDB link. Each change is recorded and its author is notified with your reason.
          This tool does not edit the author&apos;s writing.
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

      {filteredPosts.length ? (
        <div className="mt-5 space-y-4">
          {filteredPosts.map((post) => (
            <PostCorrectionCard key={post.id} post={post} onCorrected={handleCorrected} />
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-text-muted/20 p-5 text-center text-sm text-text-muted">
          {posts.length ? "No posts match your search." : "There are no posts to correct yet."}
        </p>
      )}

      <div className="mt-8 border-t border-text-muted/15 pt-6">
        <h3 className="text-lg font-bold">Recent correction history</h3>
        {history.length ? (
          <ol className="mt-3 space-y-3">
            {history.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-text-muted/10 bg-background/60 p-3 text-sm">
                <p className="font-semibold">{entry.post_title}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {formatMediaType(entry.previous_media_type)}
                  {entry.previous_tmdb_id ? ` · TMDB #${entry.previous_tmdb_id}` : ""}
                  {" → "}
                  {formatMediaType(entry.new_media_type)}
                  {entry.new_tmdb_id ? ` · TMDB #${entry.new_tmdb_id}` : ""}
                </p>
                <p className="mt-1">{entry.reason}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {entry.actor_name} · {formatDate(entry.created_at)}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-text-muted">No metadata corrections have been made.</p>
        )}
      </div>
    </section>
  );
}
