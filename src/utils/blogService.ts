import { createClient } from "@/utils/supabase/server";

export type BlogPost = {
  id: string;
  comment_count?: number;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  is_pinned: boolean;
  pinned_at: string | null;
  body: string;
  status: "draft" | "published";
  content_type: "review" | "article";
  media_type: string | null;
  tmdb_id: number | null;
  published_at: string | null;
  created_at: string;
  author: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export type BlogComment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  mention_usernames?: string[];
};

export type CommentReport = {
  id: string;
  comment_id: string | null;
  post_id: string;
  reporter_id: string;
  reason: "spam" | "harassment" | "inappropriate" | "other";
  details: string;
  reported_comment_body: string;
  created_at: string;
  post: { title: string; slug: string } | null;
  reporter: { username: string | null; display_name: string | null } | null;
};

export type PublicProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

export function formatBlogMediaType(mediaType: string | null) {
  const labels: Record<string, string> = {
    movie: "Movie",
    tv: "TV Show",
    series: "TV Show",
    anime: "Anime",
    animation: "Animation",
    documentary: "Documentary",
    docuseries: "Docuseries",
    show: "TV Show",
    general: "General / Other",
  };

  return mediaType ? labels[mediaType] ?? mediaType : "";
}

const postFields = `
  id,
  title,
  slug,
  excerpt,
  cover_image_url,
  is_pinned,
  pinned_at,
  body,
  status,
  content_type,
  media_type,
  tmdb_id,
  published_at,
  created_at,
  author:profiles!posts_author_id_fkey(username, display_name, avatar_url)
`;

export async function getPublishedPosts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(`${postFields}, comments(count)`)
    .eq("status", "published")
    .eq("comments.is_removed", false)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((post) => ({
    ...post,
    comment_count: post.comments?.[0]?.count ?? 0,
  })) as unknown as BlogPost[];
}

export async function getPublishedPostsByAuthor(authorId: string): Promise<BlogPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(`${postFields}, comments(count)`)
    .eq("author_id", authorId)
    .eq("status", "published")
    .eq("comments.is_removed", false)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((post) => ({
    ...post,
    comment_count: post.comments?.[0]?.count ?? 0,
  })) as unknown as BlogPost[];
}

export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as PublicProfile | null;
}

export async function getPublishedPost(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(postFields)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as BlogPost | null;
}

export async function getPublishedPostComments(postId: string): Promise<BlogComment[]> {
  const supabase = await createClient();
  const { data: comments, error } = await supabase
    .from("comments")
    .select("id, post_id, author_id, body, created_at, updated_at")
    .eq("post_id", postId)
    .eq("is_removed", false)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  if (!comments?.length) return [];

  const authorIds = [...new Set(comments.map((comment) => comment.author_id))];
  const mentionedUsernames = [...new Set(comments.flatMap((comment) =>
    [...comment.body.matchAll(/(^|[^a-zA-Z0-9_-])@([a-z0-9_-]{3,30})(?=$|[^a-z0-9_-])/gi)]
      .map((match) => match[2].toLowerCase()),
  ))];
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", authorIds);

  if (profileError) throw new Error(profileError.message);

  const mentionedProfileQuery = mentionedUsernames.length
    ? await supabase
      .from("profiles")
      .select("username")
      .in("username", mentionedUsernames)
    : { data: [], error: null };
  if (mentionedProfileQuery.error) throw new Error(mentionedProfileQuery.error.message);
  const knownUsernames = new Set(
    (mentionedProfileQuery.data ?? [])
      .map((profile) => profile.username)
      .filter((username): username is string => Boolean(username))
      .map((username) => username.toLowerCase()),
  );

  const profilesById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  return comments.map((comment) => ({
    ...comment,
    author: profilesById.get(comment.author_id) ?? null,
    mention_usernames: [...new Set(
      [...comment.body.matchAll(/(^|[^a-zA-Z0-9_-])@([a-z0-9_-]{3,30})(?=$|[^a-z0-9_-])/gi)]
        .map((match) => match[2].toLowerCase())
        .filter((username) => knownUsernames.has(username)),
    )],
  })) as BlogComment[];
}

export async function getOpenCommentReports(): Promise<CommentReport[]> {
  const supabase = await createClient();
  const { data: reports, error } = await supabase
    .from("comment_reports")
    .select(`
      id,
      comment_id,
      post_id,
      reporter_id,
      reason,
      details,
      reported_comment_body,
      created_at,
      post:posts!comment_reports_post_id_fkey(title, slug)
    `)
    .is("resolved_at", null)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  if (!reports?.length) return [];

  const reporterIds = [...new Set(reports.map((report) => report.reporter_id))];
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", reporterIds);

  if (profileError) throw new Error(profileError.message);

  const profilesById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  return reports.map((report) => ({
    ...report,
    reporter: profilesById.get(report.reporter_id) ?? null,
  })) as unknown as CommentReport[];
}
