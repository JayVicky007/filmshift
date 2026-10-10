import "server-only";

import type { AdminManagedUser } from "@/types/admin";
import type { createAdminClient } from "@/utils/supabase/admin";

const pageSize = 1000;

export async function getAdminUserOverview(
  admin: ReturnType<typeof createAdminClient>,
): Promise<AdminManagedUser[]> {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: pageSize });
    if (error) throw new Error(error.message);
    users.push(...data.users);
    if (data.users.length < pageSize) break;
  }

  const profiles = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from("profiles")
      .select("id, username, display_name, role")
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    profiles.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }

  const posts = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from("posts")
      .select("id, author_id, title, slug, status, updated_at")
      .order("updated_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    posts.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const postsByAuthorId = new Map<string, AdminManagedUser["posts"]>();
  for (const post of posts) {
    const authorPosts = postsByAuthorId.get(post.author_id) ?? [];
    authorPosts.push(post);
    postsByAuthorId.set(post.author_id, authorPosts);
  }

  return users.map((user) => {
    const profile = profileById.get(user.id);
    return {
      id: user.id,
      email: user.email ?? null,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      bannedUntil: user.banned_until ?? null,
      username: profile?.username ?? null,
      displayName: profile?.display_name ?? null,
      role: profile?.role ?? "user",
      posts: postsByAuthorId.get(user.id) ?? [],
    };
  });
}
