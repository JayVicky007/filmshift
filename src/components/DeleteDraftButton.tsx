"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface DeleteDraftButtonProps {
  postId: string;
}

export default function DeleteDraftButton({ postId }: DeleteDraftButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this draft?")) {
      return;
    }

    setIsDeleting(true);

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (error) {
      alert(`Error deleting draft: ${error.message}`);
      setIsDeleting(false);
    } else {
      // Refresh the current layout and bounce back to profile workspace
      router.refresh();
      router.push("/profile");
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-4 py-2 text-xs font-semibold text-red-400 transition-colors border border-red-500/20 rounded-xl hover:bg-red-500/10 disabled:opacity-50"
    >
      {isDeleting ? "Deleting..." : "Delete Draft"}
    </button>
  );
}
