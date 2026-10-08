import { redirect } from "next/navigation";
import MentionNotifications, { type MentionNotification } from "@/components/MentionNotifications";
import { createClient } from "@/utils/supabase/server";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError && authError.name !== "AuthSessionMissingError") {
    throw new Error(authError.message);
  }
  if (!user) redirect("/login");

  const [{ data: rows, error }, { count: unreadCount, error: unreadCountError }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, actor_id, comment_id, post_id, type, message, created_at, read_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null),
  ]);

  if (error) throw new Error(error.message);
  if (unreadCountError) throw new Error(unreadCountError.message);

  const actorIds = [...new Set((rows ?? []).map((row) => row.actor_id).filter(Boolean))];
  const postIds = [...new Set((rows ?? []).map((row) => row.post_id))];
  const [profilesResult, postsResult] = await Promise.all([
    actorIds.length
      ? supabase.from("profiles").select("id, username, display_name").in("id", actorIds)
      : Promise.resolve({ data: [], error: null }),
    postIds.length
      ? supabase.from("posts").select("id, title, slug, status").in("id", postIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (profilesResult.error) throw new Error(profilesResult.error.message);
  if (postsResult.error) throw new Error(postsResult.error.message);

  const profilesById = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));
  const postsById = new Map((postsResult.data ?? []).map((post) => [post.id, post]));
  const notifications: MentionNotification[] = (rows ?? []).map((row) => ({
    id: row.id,
    comment_id: row.comment_id,
    type: row.type,
    message: row.message,
    created_at: row.created_at,
    read_at: row.read_at,
    actor: row.actor_id ? profilesById.get(row.actor_id) ?? null : null,
    post: postsById.get(row.post_id) ?? null,
  }));

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-trending-text">FilmShift community</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Notifications</h1>
        <p className="mt-3 text-sm text-text-muted">
          {unreadCount === 0
            ? "You’re all caught up."
            : `You have ${unreadCount} unread ${unreadCount === 1 ? "notification" : "notifications"}.`}
        </p>
        <MentionNotifications initialNotifications={notifications} />
      </div>
    </main>
  );
}
