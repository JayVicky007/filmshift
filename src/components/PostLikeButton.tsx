"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function PostLikeButton({
  postId,
  initialCount,
  initialLiked,
  currentUserId,
  compact = false,
}: {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
  currentUserId: string | null;
  compact?: boolean;
}) {
  const supabase = createClient();
  const [likeCount, setLikeCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function toggleLike() {
    if (!currentUserId || isSaving) return;

    setIsSaving(true);
    setErrorMessage("");
    const result = liked
      ? await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", currentUserId)
      : await supabase.from("post_likes").insert({ post_id: postId, user_id: currentUserId });

    if (result.error) {
      setErrorMessage(result.error.message);
    } else {
      setLiked(!liked);
      setLikeCount((count) => Math.max(0, count + (liked ? -1 : 1)));
    }
    setIsSaving(false);
  }

  const buttonClassName = compact
    ? `relative z-20 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors ${
        liked ? "text-rose-500" : "text-text-muted hover:text-rose-500"
      }`
    : `inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
        liked
          ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
          : "border-text-muted/20 text-text-muted hover:border-rose-500/40 hover:text-rose-500"
      }`;

  return (
    <span className="inline-flex flex-col items-start">
      {currentUserId ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void toggleLike();
          }}
          disabled={isSaving}
          aria-pressed={liked}
          aria-label={`${liked ? "Unlike" : "Like"} post (${likeCount} likes)`}
          className={buttonClassName}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          <span>{likeCount}</span>
          {!compact && <span>{likeCount === 1 ? "like" : "likes"}</span>}
        </button>
      ) : (
        <Link
          href="/login"
          onClick={(event) => event.stopPropagation()}
          aria-label={`${likeCount} likes. Sign in to like this post.`}
          className={buttonClassName}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          <span>{likeCount}</span>
          {!compact && <span>{likeCount === 1 ? "like" : "likes"}</span>}
        </Link>
      )}
      {errorMessage && <span role="alert" className="relative z-20 mt-1 max-w-40 text-[10px] text-rose-500">{errorMessage}</span>}
    </span>
  );
}
