"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { BlogComment } from "@/utils/blogService";

const MAX_COMMENT_LENGTH = 2000;

function formatCommentDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getAuthorName(comment: BlogComment) {
  return comment.author?.display_name || comment.author?.username || "FilmShift member";
}

function renderCommentBody(body: string, mentionUsernames: string[]) {
  const mentionPattern = /(^|[^a-zA-Z0-9_-])@([a-z0-9_-]{3,30})(?=$|[^a-z0-9_-])/gi;
  const parts: ReactNode[] = [];
  const knownUsernames = new Set(mentionUsernames);
  let cursor = 0;

  for (const match of body.matchAll(mentionPattern)) {
    const fullMatch = match[0];
    const prefix = match[1];
    const username = match[2];
    const matchIndex = match.index ?? 0;
    const mentionStart = matchIndex + prefix.length;
    if (!knownUsernames.has(username.toLowerCase())) continue;

    parts.push(body.slice(cursor, mentionStart));
    parts.push(
      <Link
        key={`${mentionStart}-${username}`}
        href={`/users/${username.toLowerCase()}`}
        className="font-semibold text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
      >
        @{username}
      </Link>,
    );
    cursor = matchIndex + fullMatch.length;
  }

  parts.push(body.slice(cursor));
  return parts;
}

export default function BlogComments({
  postId,
  initialComments,
  currentUserId,
  currentAuthor,
  isAdmin,
}: {
  postId: string;
  initialComments: BlogComment[];
  currentUserId: string | null;
  currentAuthor: NonNullable<BlogComment["author"]>;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = newComment.trim();
    if (!currentUserId || !body || body.length > MAX_COMMENT_LENGTH) return;

    setIsSubmitting(true);
    setStatusMessage("");
    setErrorMessage("");
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, author_id: currentUserId, body })
      .select("id, post_id, author_id, body, created_at, updated_at")
      .single();

    if (error) {
      setErrorMessage(error.message);
    } else {
      setComments((existing) => [...existing, { ...data, author: currentAuthor }]);
      setNewComment("");
      router.refresh();
    }
    setIsSubmitting(false);
  }

  async function saveEdit(commentId: string) {
    const body = editingBody.trim();
    if (!body || body.length > MAX_COMMENT_LENGTH) return;

    setIsSubmitting(true);
    setErrorMessage("");
    const { data, error } = await supabase
      .from("comments")
      .update({ body })
      .eq("id", commentId)
      .select("updated_at")
      .single();

    if (error) {
      setErrorMessage(error.message);
    } else {
      setComments((existing) =>
        existing.map((comment) =>
          comment.id === commentId
            ? { ...comment, body, updated_at: data.updated_at }
            : comment,
        ),
      );
      setEditingId(null);
      setStatusMessage("Comment updated.");
    }
    setIsSubmitting(false);
  }

  async function deleteComment(commentId: string) {
    const comment = comments.find((item) => item.id === commentId);
    const isModeratingOtherUser = isAdmin && comment?.author_id !== currentUserId;
    if (!window.confirm(isModeratingOtherUser
      ? "Remove this comment from public view?"
      : "Delete this comment? This cannot be undone.")) return;

    setIsSubmitting(true);
    setErrorMessage("");
    const result = isModeratingOtherUser
      ? await supabase.from("comments").update({ is_removed: true }).eq("id", commentId)
      : await supabase.from("comments").delete().eq("id", commentId);
    const { error } = result;
    if (error) {
      setErrorMessage(error.message);
    } else {
      setComments((existing) => existing.filter((comment) => comment.id !== commentId));
      setStatusMessage(isModeratingOtherUser ? "Comment removed from public view." : "Comment deleted.");
      router.refresh();
    }
    setIsSubmitting(false);
  }

  async function submitReport(event: FormEvent<HTMLFormElement>, comment: BlogComment) {
    event.preventDefault();
    if (!currentUserId) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setStatusMessage("");
    const { error } = await supabase.from("comment_reports").insert({
      comment_id: comment.id,
      post_id: postId,
      reporter_id: currentUserId,
      reason: reportReason,
      details: reportDetails.trim(),
    });

    if (error) {
      setErrorMessage(error.code === "23505"
        ? "You’ve already reported this comment."
        : error.message);
    } else {
      setReportingId(null);
      setReportDetails("");
      setStatusMessage("Report sent to the moderation team.");
    }
    setIsSubmitting(false);
  }

  return (
    <section aria-labelledby="comments-heading" className="mt-16 border-t border-text-muted/15 pt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="comments-heading" className="text-2xl font-black tracking-tight sm:text-3xl">
          Discussion <span className="text-base font-semibold text-text-muted">({comments.length})</span>
        </h2>
        <p className="text-sm text-text-muted">Keep it thoughtful and respectful.</p>
      </div>

      {statusMessage && <p role="status" className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">{statusMessage}</p>}
      {errorMessage && <p role="alert" className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">{errorMessage}</p>}

      {currentUserId ? (
        <form onSubmit={submitComment} className="mt-6 rounded-2xl border border-text-muted/15 bg-surface p-4 sm:p-5">
          <label htmlFor="new-comment" className="text-sm font-bold">Add your comment</label>
          <textarea
            id="new-comment"
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            maxLength={MAX_COMMENT_LENGTH}
            rows={4}
            required
            placeholder="Share a considered thought..."
            className="mt-3 w-full resize-y rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-text-muted">{newComment.length}/{MAX_COMMENT_LENGTH}</span>
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Posting..." : "Post comment"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-6 rounded-2xl border border-text-muted/15 bg-surface p-5 text-sm text-text-muted">
          <Link href="/login" className="font-bold text-accent hover:underline">Sign in</Link> to join the conversation.
        </div>
      )}

      {comments.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-text-muted/20 p-8 text-center text-sm text-text-muted">
          No comments yet. Start the discussion.
        </p>
      ) : (
        <ol className="mt-8 space-y-5">
          {comments.map((comment) => {
            const authorName = getAuthorName(comment);
            const canManage = currentUserId === comment.author_id || isAdmin;
            const isModeratingOtherUser = isAdmin && currentUserId !== comment.author_id;
            return (
              <li id={`comment-${comment.id}`} key={comment.id} className="rounded-2xl border border-text-muted/15 bg-surface p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {comment.author?.avatar_url ? (
                      <img src={comment.author.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-sm font-bold">
                        {authorName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{authorName}</span>
                      {comment.author?.username && (
                        <Link
                          href={`/users/${comment.author.username}`}
                          className="block w-fit text-xs text-text-muted hover:text-accent hover:underline"
                          aria-label={`View @${comment.author.username}'s profile`}
                        >
                          @{comment.author.username}
                        </Link>
                      )}
                      <span className="block text-xs text-text-muted">
                        {formatCommentDate(comment.created_at)}
                        {comment.updated_at !== comment.created_at && " · edited"}
                      </span>
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs font-semibold">
                    {canManage && (
                      <>
                        {currentUserId === comment.author_id && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(comment.id);
                              setEditingBody(comment.body);
                              setErrorMessage("");
                            }}
                            className="text-text-muted hover:text-accent"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void deleteComment(comment.id)}
                          disabled={isSubmitting}
                          className="text-rose-600 hover:text-rose-500"
                        >
                          {isModeratingOtherUser ? "Moderate" : "Delete"}
                        </button>
                      </>
                    )}
                    {currentUserId && currentUserId !== comment.author_id && !isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setReportingId(reportingId === comment.id ? null : comment.id);
                          setErrorMessage("");
                        }}
                        className="text-text-muted hover:text-accent"
                      >
                        Report
                      </button>
                    )}
                  </div>
                </div>

                {editingId === comment.id ? (
                  <div className="mt-4">
                    <label className="sr-only" htmlFor={`edit-comment-${comment.id}`}>Edit comment</label>
                    <textarea
                      id={`edit-comment-${comment.id}`}
                      value={editingBody}
                      onChange={(event) => setEditingBody(event.target.value)}
                      maxLength={MAX_COMMENT_LENGTH}
                      rows={4}
                      className="w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button type="button" onClick={() => setEditingId(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-text-muted hover:text-foreground">Cancel</button>
                      <button type="button" disabled={isSubmitting || !editingBody.trim()} onClick={() => void saveEdit(comment.id)} className="rounded-lg bg-accent px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">Save edit</button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90">
                    {renderCommentBody(comment.body, comment.mention_usernames ?? [])}
                  </p>
                )}

                {reportingId === comment.id && (
                  <form onSubmit={(event) => void submitReport(event, comment)} className="mt-4 space-y-3 rounded-xl border border-text-muted/15 bg-background p-4">
                    <label className="block text-xs font-bold" htmlFor={`report-reason-${comment.id}`}>Why are you reporting this?</label>
                    <select
                      id={`report-reason-${comment.id}`}
                      value={reportReason}
                      onChange={(event) => setReportReason(event.target.value)}
                      className="w-full rounded-lg border border-text-muted/20 bg-surface px-3 py-2 text-sm"
                    >
                      <option value="spam">Spam</option>
                      <option value="harassment">Harassment</option>
                      <option value="inappropriate">Inappropriate content</option>
                      <option value="other">Other</option>
                    </select>
                    <label className="sr-only" htmlFor={`report-details-${comment.id}`}>Additional report details</label>
                    <textarea
                      id={`report-details-${comment.id}`}
                      value={reportDetails}
                      onChange={(event) => setReportDetails(event.target.value)}
                      maxLength={500}
                      rows={2}
                      placeholder="Additional context (optional)"
                      className="w-full resize-y rounded-lg border border-text-muted/20 bg-surface px-3 py-2 text-sm"
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setReportingId(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-text-muted">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="rounded-lg bg-accent px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">{isSubmitting ? "Sending..." : "Send report"}</button>
                    </div>
                  </form>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
