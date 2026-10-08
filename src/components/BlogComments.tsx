"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
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
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [likingId, setLikingId] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createComment(newComment, null);
  }

  async function submitReply(event: FormEvent<HTMLFormElement>, parentId: string) {
    event.preventDefault();
    await createComment(replyBody, parentId);
  }

  async function createComment(value: string, parentId: string | null) {
    const body = value.trim();
    if (!currentUserId || !body || body.length > MAX_COMMENT_LENGTH) return;

    setIsSubmitting(true);
    setStatusMessage("");
    setErrorMessage("");
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, author_id: currentUserId, parent_id: parentId, body })
      .select("id, post_id, author_id, parent_id, body, created_at, updated_at")
      .single();

    if (error) {
      setErrorMessage(error.message);
    } else {
      setComments((existing) => [...existing, {
        ...data,
        author: currentAuthor,
        mention_usernames: [],
        like_count: 0,
        liked_by_me: false,
      }]);
      if (parentId) {
        setReplyBody("");
        setReplyingId(null);
      } else {
        setNewComment("");
      }
      router.refresh();
    }
    setIsSubmitting(false);
  }

  async function toggleLike(comment: BlogComment) {
    if (!currentUserId || likingId) return;
    setLikingId(comment.id);
    setErrorMessage("");
    const result = comment.liked_by_me
      ? await supabase.from("comment_likes").delete().eq("comment_id", comment.id).eq("user_id", currentUserId)
      : await supabase.from("comment_likes").insert({ comment_id: comment.id, user_id: currentUserId });

    if (result.error) {
      setErrorMessage(result.error.message);
    } else {
      setComments((existing) => existing.map((item) => item.id === comment.id
        ? {
            ...item,
            like_count: Math.max(0, item.like_count + (comment.liked_by_me ? -1 : 1)),
            liked_by_me: !comment.liked_by_me,
          }
        : item));
    }
    setLikingId(null);
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
      setComments((existing) => existing.filter(
        (comment) => comment.id !== commentId && comment.parent_id !== commentId,
      ));
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
          {comments.filter((comment) => !comment.parent_id).map((comment) => {
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

                <div className="mt-4 flex items-center gap-4 border-t border-text-muted/10 pt-3">
                  {currentUserId ? (
                    <button
                      type="button"
                      onClick={() => void toggleLike(comment)}
                      disabled={likingId !== null}
                      aria-pressed={comment.liked_by_me}
                      aria-label={`${comment.liked_by_me ? "Unlike" : "Like"} comment (${comment.like_count} likes)`}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                        comment.liked_by_me ? "text-rose-500" : "text-text-muted hover:text-rose-500"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${comment.liked_by_me ? "fill-current" : ""}`} />
                      <span>{comment.like_count}</span>
                    </button>
                  ) : (
                    <Link href="/login" className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-text-muted hover:text-rose-500">
                      <Heart className="h-4 w-4" />
                      <span>{comment.like_count}</span>
                    </Link>
                  )}
                  {currentUserId && (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingId(replyingId === comment.id ? null : comment.id);
                        setReplyBody("");
                        setErrorMessage("");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-text-muted transition-colors hover:text-accent"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Reply
                    </button>
                  )}
                </div>

                {replyingId === comment.id && currentUserId && (
                  <form onSubmit={(event) => void submitReply(event, comment.id)} className="mt-3 rounded-xl border border-text-muted/15 bg-background/60 p-3">
                    <label htmlFor={`reply-${comment.id}`} className="text-xs font-bold">Reply to {authorName}</label>
                    <textarea
                      id={`reply-${comment.id}`}
                      value={replyBody}
                      onChange={(event) => setReplyBody(event.target.value)}
                      maxLength={MAX_COMMENT_LENGTH}
                      rows={3}
                      required
                      placeholder="Write a thoughtful reply..."
                      className="mt-2 w-full resize-y rounded-lg border border-text-muted/20 bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button type="button" onClick={() => setReplyingId(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-text-muted">Cancel</button>
                      <button type="submit" disabled={isSubmitting || !replyBody.trim()} className="rounded-lg bg-accent px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">
                        {isSubmitting ? "Replying..." : "Post reply"}
                      </button>
                    </div>
                  </form>
                )}

                {comments.some((reply) => reply.parent_id === comment.id) && (
                  <ol aria-label={`Replies to ${authorName}`} className="mt-4 space-y-3 border-l-2 border-accent/20 pl-3 sm:pl-5">
                    {comments.filter((reply) => reply.parent_id === comment.id).map((reply) => {
                      const replyAuthorName = getAuthorName(reply);
                      const canManageReply = currentUserId === reply.author_id || isAdmin;
                      const moderatingReply = isAdmin && currentUserId !== reply.author_id;
                      return (
                        <li id={`comment-${reply.id}`} key={reply.id} className="rounded-xl border border-text-muted/10 bg-background/50 p-3 sm:p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                              {reply.author?.avatar_url ? (
                                <img src={reply.author.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                              ) : (
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold">{replyAuthorName.charAt(0).toUpperCase()}</span>
                              )}
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-bold">{replyAuthorName}</span>
                                {reply.author?.username && <Link href={`/users/${reply.author.username}`} className="block w-fit text-xs text-text-muted hover:text-accent">@{reply.author.username}</Link>}
                                <span className="block text-xs text-text-muted">{formatCommentDate(reply.created_at)}{reply.updated_at !== reply.created_at && " · edited"}</span>
                              </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-3 text-xs font-semibold">
                              {currentUserId === reply.author_id && (
                                <button type="button" onClick={() => { setEditingId(reply.id); setEditingBody(reply.body); }} className="text-text-muted hover:text-accent">Edit</button>
                              )}
                              {canManageReply && (
                                <button type="button" onClick={() => void deleteComment(reply.id)} disabled={isSubmitting} className="text-rose-600 hover:text-rose-500">
                                  {moderatingReply ? "Moderate" : "Delete"}
                                </button>
                              )}
                              {currentUserId && currentUserId !== reply.author_id && !isAdmin && (
                                <button type="button" onClick={() => { setReportingId(reportingId === reply.id ? null : reply.id); setErrorMessage(""); }} className="text-text-muted hover:text-accent">Report</button>
                              )}
                            </div>
                          </div>
                          {editingId === reply.id ? (
                            <div className="mt-3">
                              <label className="sr-only" htmlFor={`edit-comment-${reply.id}`}>Edit reply</label>
                              <textarea id={`edit-comment-${reply.id}`} value={editingBody} onChange={(event) => setEditingBody(event.target.value)} maxLength={MAX_COMMENT_LENGTH} rows={3} className="w-full rounded-lg border border-text-muted/20 bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
                              <div className="mt-2 flex justify-end gap-2">
                                <button type="button" onClick={() => setEditingId(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-text-muted">Cancel</button>
                                <button type="button" disabled={isSubmitting || !editingBody.trim()} onClick={() => void saveEdit(reply.id)} className="rounded-lg bg-accent px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">Save edit</button>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90">{renderCommentBody(reply.body, reply.mention_usernames ?? [])}</p>
                          )}
                          <div className="mt-3 border-t border-text-muted/10 pt-2">
                            {currentUserId ? (
                              <button type="button" onClick={() => void toggleLike(reply)} disabled={likingId !== null} aria-pressed={reply.liked_by_me} aria-label={`${reply.liked_by_me ? "Unlike" : "Like"} reply (${reply.like_count} likes)`} className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold ${reply.liked_by_me ? "text-rose-500" : "text-text-muted hover:text-rose-500"}`}>
                                <Heart className={`h-4 w-4 ${reply.liked_by_me ? "fill-current" : ""}`} /><span>{reply.like_count}</span>
                              </button>
                            ) : (
                              <Link href="/login" className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-text-muted hover:text-rose-500"><Heart className="h-4 w-4" /><span>{reply.like_count}</span></Link>
                            )}
                          </div>
                          {reportingId === reply.id && (
                            <form onSubmit={(event) => void submitReport(event, reply)} className="mt-3 space-y-3 rounded-xl border border-text-muted/15 bg-surface p-3">
                              <label className="block text-xs font-bold" htmlFor={`report-reason-${reply.id}`}>Why are you reporting this?</label>
                              <select id={`report-reason-${reply.id}`} value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="w-full rounded-lg border border-text-muted/20 bg-background px-3 py-2 text-sm">
                                <option value="spam">Spam</option><option value="harassment">Harassment</option><option value="inappropriate">Inappropriate content</option><option value="other">Other</option>
                              </select>
                              <label className="sr-only" htmlFor={`report-details-${reply.id}`}>Additional report details</label>
                              <textarea id={`report-details-${reply.id}`} value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} maxLength={500} rows={2} placeholder="Additional context (optional)" className="w-full resize-y rounded-lg border border-text-muted/20 bg-background px-3 py-2 text-sm" />
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
