"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

function createSlug(title: string) {
  return `${title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 8)}`;
}

// Define the shape of a post we want to edit
interface PostData {
  id: string;
  title: string;
  excerpt: string | null;
  body: string;
  content_type: "review" | "article";
  media_type: string;
  tmdb_id: number | null;
  status: "draft" | "published";
  slug: string | null; 
}

export default function WritePostForm({ 
  authorId, 
  initialPost 
}: { 
  authorId: string; 
  initialPost?: PostData; 
}) {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState(initialPost?.title || "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || "");
  const [contentType, setContentType] = useState<"review" | "article">(initialPost?.content_type || "review");
  const [mediaType, setMediaType] = useState(initialPost?.media_type || "movie");
  const [tmdbId, setTmdbId] = useState(initialPost?.tmdb_id?.toString() || "");
  const [status, setStatus] = useState<"draft" | "published">(initialPost?.status || "draft");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize the editor with existing content if editing, or blank placeholder text if new
  const editor = useEditor({
    extensions: [
      StarterKit, 
      Underline,
      Image.configure({
        HTMLAttributes: {
          class: "rounded-xl border border-text-muted/15 my-6 max-w-full h-auto mx-auto shadow-md block",
        },
      }),
      Placeholder.configure({
        placeholder: "Write your review or article...",
      }),
    ],
    content: initialPost?.body || "",
    editorProps: {
      attributes: {
        class: "mt-2 min-h-[350px] w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 prose prose-invert max-w-none overflow-y-auto",
      },
    },
  });

  const addImage = () => {
    const url = window.prompt("Enter image URL:");
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    
    setIsSaving(true);
    setMessage("");

    const richBodyContent = editor.getHTML();
    const postPayload = {
      author_id: authorId,
      title: title.trim(),
      // Keep old slug if editing, generate new one if fresh post
      slug: initialPost ? initialPost.title.trim() === title.trim() ? initialPost.slug : createSlug(title) : createSlug(title),
      excerpt: excerpt.trim() || null,
      body: richBodyContent,
      content_type: contentType,
      media_type: mediaType,
      tmdb_id: tmdbId.trim() ? Number.parseInt(tmdbId, 10) : null,
      status,
      // Update published timestamp if transitioning to public right now
      published_at: status === "published" ? (initialPost?.status === "published" ? undefined : new Date().toISOString()) : null,
    };

    let queryError;

    if (initialPost) {
      // If initialPost exists, we perform an UPDATE statement
      const { error } = await supabase
        .from("posts")
        .update(postPayload)
        .eq("id", initialPost.id);
      queryError = error;
    } else {
      // Otherwise, perform a standard fresh INSERT statement
      const { error } = await supabase.from("posts").insert(postPayload);
      queryError = error;
    }

    if (queryError) {
      setMessage(queryError.message);
    } else {
      router.push("/profile");
      router.refresh();
    }

    setIsSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="post-title" className="text-sm font-semibold">Title</label>
        <input
          id="post-title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Your headline"
          maxLength={140}
          className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="content-type" className="text-sm font-semibold">Post type</label>
          <select id="content-type" value={contentType} onChange={(event) => setContentType(event.target.value as "review" | "article")} className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30">
            <option value="review">Review</option>
            <option value="article">Article</option>
          </select>
        </div>
        <div>
          <label htmlFor="media-type" className="text-sm font-semibold">Media type</label>
          <select id="media-type" value={mediaType} onChange={(event) => setMediaType(event.target.value)} className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30">
            <option value="movie">Movie</option>
            <option value="series">Series</option>
            <option value="anime">Anime</option>
            <option value="animation">Animation</option>
            <option value="documentary">Documentary</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="tmdb-id" className="text-sm font-semibold">TMDB ID <span className="font-normal text-text-muted">(optional)</span></label>
        <input id="tmdb-id" type="number" min="1" value={tmdbId} onChange={(event) => setTmdbId(event.target.value)} placeholder="Link this post to a title" className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
      </div>

      <div>
        <label htmlFor="post-excerpt" className="text-sm font-semibold">Excerpt <span className="font-normal text-text-muted">(optional)</span></label>
        <textarea id="post-excerpt" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} placeholder="A short introduction" maxLength={280} rows={3} className="mt-2 w-full resize-y rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
      </div>

      <div>
        <label className="text-sm font-semibold">Body</label>
        {editor && (
          <div className="mt-2 flex flex-wrap gap-2 border border-b-0 border-text-muted/20 bg-surface/50 p-2 rounded-t-xl items-center">
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-3 py-1 rounded text-sm font-bold ${editor.isActive("bold") ? "bg-accent text-slate-950" : "bg-background border border-text-muted/10 hover:border-accent/40"}`}>B</button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-3 py-1 rounded text-sm italic ${editor.isActive("italic") ? "bg-accent text-slate-950" : "bg-background border border-text-muted/10 hover:border-accent/40"}`}>I</button>
            <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`px-3 py-1 rounded text-sm underline ${editor.isActive("underline") ? "bg-accent text-slate-950" : "bg-background border border-text-muted/10 hover:border-accent/40"}`}>U</button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-3 py-1 rounded text-sm font-black ${editor.isActive("heading", { level: 2 }) ? "bg-accent text-slate-950" : "bg-background border border-text-muted/10 hover:border-accent/40"}`}>H2</button>
            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-3 py-1 rounded text-sm ${editor.isActive("bulletList") ? "bg-accent text-slate-950" : "bg-background border border-text-muted/10 hover:border-accent/40"}`}>• List</button>
            <button type="button" onClick={addImage} className="px-3 py-1 rounded text-sm bg-background border border-text-muted/10 hover:border-accent/40 text-emerald-400 font-medium">+ Add Image URL</button>
          </div>
        )}
        <EditorContent editor={editor} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-text-muted/15 bg-background/50 p-4">
        <label htmlFor="post-status" className="text-sm font-semibold">Save as</label>
        <select id="post-status" value={status} onChange={(event) => setStatus(event.target.value as "draft" | "published")} className="rounded-lg border border-text-muted/20 bg-surface px-3 py-2 text-sm text-foreground">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {message && <p role="status" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm">{message}</p>}
      <button type="submit" disabled={isSaving} className="rounded-xl bg-accent px-5 py-3 font-bold text-slate-950 transition-colors hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-60">
        {isSaving ? "Saving..." : status === "published" ? "Publish post" : "Save draft"}
      </button>
    </form> 
  );
}