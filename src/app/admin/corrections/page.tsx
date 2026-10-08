import AdminPostCorrections from "@/components/AdminPostCorrections";
import { createClient } from "@/utils/supabase/server";

export default async function AdminCorrectionsPage() {
  const supabase = await createClient();
  const [{ data: posts, error: postsError }, { data: history, error: historyError }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, slug, status, media_type, tmdb_id, author_id, author:profiles!posts_author_id_fkey(username, display_name)")
      .order("updated_at", { ascending: false }),
    supabase
      .from("post_metadata_corrections")
      .select("id, post_id, post_title, actor_id, previous_media_type, new_media_type, previous_tmdb_id, new_tmdb_id, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  if (postsError) throw new Error(postsError.message);
  if (historyError) throw new Error(historyError.message);

  const actorIds = [...new Set((history ?? [])
    .map((entry) => entry.actor_id)
    .filter((actorId): actorId is string => Boolean(actorId)))];
  const { data: actors, error: actorsError } = actorIds.length
    ? await supabase
      .from("profiles")
      .select("id, username, display_name")
      .in("id", actorIds)
    : { data: [], error: null };
  if (actorsError) throw new Error(actorsError.message);

  const actorNameById = new Map((actors ?? []).map((actor) => [
    actor.id,
    actor.display_name || actor.username || "FilmShift admin",
  ]));

  return (
    <AdminPostCorrections
      initialPosts={posts ?? []}
      initialHistory={(history ?? []).map((entry) => ({
        ...entry,
        actor_name: entry.actor_id
          ? actorNameById.get(entry.actor_id) ?? "Former admin"
          : "Former admin",
      }))}
    />
  );
}
