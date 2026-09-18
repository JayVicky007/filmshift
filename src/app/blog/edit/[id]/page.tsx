import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import WritePostForm from "@/components/WritePostForm";
import DeleteDraftButton from "@/components/DeleteDraftButton";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Protect the route: Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 2. Fetch the specific post to edit
  const { data: post } = await supabase
    .from("posts")
    .select("id, author_id, title, excerpt, body, content_type, media_type, tmdb_id, status, slug")
    .eq("id", id)
    .single();

  // 3. If post doesn't exist, or it doesn't belong to the logged-in user, throw a 404
  if (!post || post.author_id !== user.id) {
    notFound();
  }

  // 4. Safely render the workspace structure
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:py-16">
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-text-muted/15 bg-surface p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:p-8">
        <div className="flex items-center justify-between">
          <Link href="/profile" className="text-sm font-semibold text-text-muted transition-colors hover:text-accent">
            Cancel & Back to Profile
          </Link>
          
          {/* Only render delete button for unpublished drafts */}
          {post.status === "draft" && <DeleteDraftButton postId={post.id} />}
        </div>

        <h1 className="mt-6 text-4xl font-black tracking-tight">Revise your masterpiece</h1>
        <p className="mt-2 text-text-muted">Modify your formatting content or transition this draft into a live publication.</p>
        
        <WritePostForm 
          authorId={user.id} 
          initialPost={{
            ...post,
            content_type: post.content_type as "review" | "article"
          }} 
        />
      </section>
    </main>
  );
}
