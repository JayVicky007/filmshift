import CommentReportsQueue from "@/components/CommentReportsQueue";
import { getOpenCommentReports } from "@/utils/blogService";
import { createClient } from "@/utils/supabase/server";

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const [{ data: { user }, error: authError }, reports] = await Promise.all([
    supabase.auth.getUser(),
    getOpenCommentReports(),
  ]);

  if (authError) throw new Error(authError.message);
  if (!user) throw new Error("An authenticated admin session is required.");

  return <CommentReportsQueue initialReports={reports} adminId={user.id} />;
}
