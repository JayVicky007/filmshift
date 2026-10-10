import AdminPostManagement from "@/components/AdminPostManagement";
import { createClient } from "@/utils/supabase/server";

export default async function AdminPostsPage() {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, status, updated_at, author:profiles!posts_author_id_fkey(username, display_name)")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  return <AdminPostManagement initialPosts={posts ?? []} />;
}
