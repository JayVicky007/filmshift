import AdminPostPins from "@/components/AdminPostPins";
import { createClient } from "@/utils/supabase/server";

export default async function AdminPinsPage() {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, published_at, is_pinned")
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false });

  if (error) throw new Error(error.message);

  return <AdminPostPins initialPosts={posts ?? []} />;
}
