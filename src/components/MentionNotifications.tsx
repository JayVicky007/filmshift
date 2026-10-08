"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { BlogComment } from "@/utils/blogService";

export type MentionNotification = {
  id: string;
  comment_id: string | null;
  type: "comment_mention" | "comment_reply" | "admin_post_correction";
  message: string | null;
  created_at: string;
  read_at: string | null;
  actor: Pick<NonNullable<BlogComment["author"]>, "username" | "display_name"> | null;
  post: { id: string; title: string; slug: string; status: "draft" | "published" } | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function MentionNotifications({
  initialNotifications,
}: {
  initialNotifications: MentionNotification[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function markAsRead(id: string) {
    const notification = notifications.find((item) => item.id === id);
    if (!notification || notification.read_at) return true;

    setUpdatingId(id);
    setErrorMessage("");
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .is("read_at", null);

    if (error) {
      setErrorMessage(error.message);
      setUpdatingId(null);
      return false;
    }

    setNotifications((items) =>
      items.map((item) => item.id === id
        ? { ...item, read_at: new Date().toISOString() }
        : item),
    );
    setUpdatingId(null);
    window.dispatchEvent(new Event("filmshift-notifications-updated"));
    return true;
  }

  async function openNotification(notification: MentionNotification) {
    if (notification.read_at || await markAsRead(notification.id)) {
      if (notification.post) {
        router.push(notification.type === "admin_post_correction" && notification.post.status === "draft"
          ? `/blog/edit/${notification.post.id}`
          : notification.type === "admin_post_correction"
            ? `/blog/${notification.post.slug}`
            : `/blog/${notification.post.slug}#comment-${notification.comment_id}`);
      }
    }
  }

  return (
    <section aria-label="Your notifications" className="mt-8 space-y-3">
      {errorMessage && (
        <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">
          Unable to update notification: {errorMessage}
        </p>
      )}
      {notifications.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-text-muted/20 p-8 text-center text-sm text-text-muted">
          You don&apos;t have any notifications yet.
        </p>
      ) : notifications.map((notification) => {
        const actorName = notification.actor?.display_name || notification.actor?.username || "A FilmShift member";
        return (
          <article
            key={notification.id}
            className={`rounded-2xl border p-4 sm:p-5 ${
              notification.read_at
                ? "border-text-muted/15 bg-surface"
                : "border-accent/40 bg-accent/5"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                {notification.type === "admin_post_correction" ? (
                  <p className="text-sm">
                    An administrator corrected the metadata on{" "}
                    {notification.post ? (
                      <Link
                        href={notification.post.status === "draft"
                          ? `/blog/edit/${notification.post.id}`
                          : `/blog/${notification.post.slug}`}
                        onClick={(event) => {
                          event.preventDefault();
                          void openNotification(notification);
                        }}
                        className="font-semibold text-accent hover:underline"
                      >
                        {notification.post.title}
                      </Link>
                    ) : (
                      <span className="font-semibold">your post</span>
                    )}
                    .
                    {notification.message && (
                      <span className="mt-1 block text-text-muted">
                        Reason: {notification.message}
                      </span>
                    )}
                  </p>
                ) : (
                <p className="text-sm">
                  {notification.actor?.username ? (
                    <>
                      <Link href={`/users/${notification.actor.username}`} className="font-bold hover:text-accent">
                        {actorName}
                      </Link>{" "}
                      <Link href={`/users/${notification.actor.username}`} className="text-xs text-text-muted hover:text-accent">
                        @{notification.actor.username}
                      </Link>
                    </>
                  ) : (
                    <span className="font-bold">{actorName}</span>
                  )}{" "}
                  {notification.type === "comment_reply" ? "replied to your comment on " : "mentioned you in a comment on "}
                  {notification.post ? (
                    <Link
                      href={`/blog/${notification.post.slug}#comment-${notification.comment_id ?? ""}`}
                      onClick={(event) => {
                        event.preventDefault();
                        void openNotification(notification);
                      }}
                      className="font-semibold text-accent hover:underline"
                    >
                      {notification.post.title}
                    </Link>
                  ) : (
                    <span className="font-semibold">a blog post</span>
                  )}
                </p>
                )}
                <p className="mt-1 text-xs text-text-muted">{formatDate(notification.created_at)}</p>
              </div>
              {!notification.read_at && (
                <button
                  type="button"
                  onClick={() => void markAsRead(notification.id)}
                  disabled={updatingId === notification.id}
                  className="shrink-0 text-xs font-semibold text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingId === notification.id ? "Updating..." : "Mark read"}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
