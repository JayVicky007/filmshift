import { createClient } from "@/utils/supabase/server";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
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

const postFields = `
  id,
  title,
  slug,
  excerpt,
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
    .select(postFields)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as BlogPost[];
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
