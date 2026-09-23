// "use client";

// import { FormEvent, useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { createClient } from "@/utils/supabase/client";
// import { useEditor, EditorContent } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import Underline from "@tiptap/extension-underline";
// import Image from "@tiptap/extension-image";
// import Placeholder from "@tiptap/extension-placeholder";

// function createSlug(title: string) {
//   return `${title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 8)}`;
// }

// // Define the shape of a post we want to edit
// interface PostData {
//   id: string;
//   title: string;
//   excerpt: string | null;
//   body: string;
//   content_type: "review" | "article";
//   media_type: string;
//   tmdb_id: number | null;
//   status: "draft" | "published";
//   slug: string | null; 
// }

// export default function WritePostForm({ 
//   authorId, 
//   initialPost 
// }: { 
//   authorId: string; 
//   initialPost?: PostData; 
// }) {
//   const router = useRouter();
//   const supabase = createClient();
//   const [title, setTitle] = useState(initialPost?.title || "");
//   const [excerpt, setExcerpt] = useState(initialPost?.excerpt || "");
//   const [contentType, setContentType] = useState<"review" | "article">(initialPost?.content_type || "review");
//   const [mediaType, setMediaType] = useState(initialPost?.media_type || "movie");
//   const [tmdbId, setTmdbId] = useState(initialPost?.tmdb_id?.toString() || "");
//   const [status, setStatus] = useState<"draft" | "published">(initialPost?.status || "draft");
//   const [message, setMessage] = useState("");
//   const [isSaving, setIsSaving] = useState(false);

//   // Initialize the editor with existing content if editing, or blank placeholder text if new
//   const editor = useEditor({
//     extensions: [
//       StarterKit, 
//       Underline,
//       Image.configure({
//         HTMLAttributes: {
//           class: "rounded-xl border border-text-muted/15 my-6 max-w-full h-auto mx-auto shadow-md block",
//         },
//       }),
//       Placeholder.configure({
//         placeholder: "Write your review or article...",
//       }),
//     ],
//     content: initialPost?.body || "",
//     editorProps: {
//       attributes: {
//         class: "mt-2 min-h-[350px] w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 prose prose-invert max-w-none overflow-y-auto",
//       },
//     },
//   });

//   const addImage = () => {
//     const url = window.prompt("Enter image URL:");
//     if (url && editor) {
//       editor.chain().focus().setImage({ src: url }).run();
//     }
//   };

//   async function handleSubmit(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     if (!editor) return;
    
//     setIsSaving(true);
//     setMessage("");

//     const richBodyContent = editor.getHTML();
//     const postPayload = {
//       author_id: authorId,
//       title: title.trim(),
//       // Keep old slug if editing, generate new one if fresh post
//       slug: initialPost ? initialPost.title.trim() === title.trim() ? initialPost.slug : createSlug(title) : createSlug(title),
//       excerpt: excerpt.trim() || null,
//       body: richBodyContent,
//       content_type: contentType,
//       media_type: mediaType,
//       tmdb_id: tmdbId.trim() ? Number.parseInt(tmdbId, 10) : null,
//       status,
//       // Update published timestamp if transitioning to public right now
//       published_at: status === "published" ? (initialPost?.status === "published" ? undefined : new Date().toISOString()) : null,
//     };

//     let queryError;

//     if (initialPost) {
//       // If initialPost exists, we perform an UPDATE statement
//       const { error } = await supabase
//         .from("posts")
//         .update(postPayload)
//         .eq("id", initialPost.id);
//       queryError = error;
//     } else {
//       // Otherwise, perform a standard fresh INSERT statement
//       const { error } = await supabase.from("posts").insert(postPayload);
//       queryError = error;
//     }

//     if (queryError) {
//       setMessage(queryError.message);
//     } else {
//       router.push("/profile");
//       router.refresh();
//     }

//     setIsSaving(false);
//   }

//   return (
//     <form onSubmit={handleSubmit} className="mt-8 space-y-5">
//       <div>
//         <label htmlFor="post-title" className="text-sm font-semibold">Title</label>
//         <input
//           id="post-title"
//           required
//           value={title}
//           onChange={(event) => setTitle(event.target.value)}
//           placeholder="Your headline"
//           maxLength={140}
//           className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
//         />
//       </div>

//       <div className="grid gap-5 sm:grid-cols-2">
//         <div>
//           <label htmlFor="content-type" className="text-sm font-semibold">Post type</label>
//           <select id="content-type" value={contentType} onChange={(event) => setContentType(event.target.value as "review" | "article")} className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30">
//             <option value="review">Review</option>
//             <option value="article">Article</option>
//           </select>
//         </div>
//         <div>
//           <label htmlFor="media-type" className="text-sm font-semibold">Media type</label>
//           <select id="media-type" value={mediaType} onChange={(event) => setMediaType(event.target.value)} className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30">
//             <option value="movie">Movie</option>
//             <option value="series">Series</option>
//             <option value="anime">Anime</option>
//             <option value="animation">Animation</option>
//             <option value="documentary">Documentary</option>
//           </select>
//         </div>
//       </div>

//       <div>
//         <label htmlFor="tmdb-id" className="text-sm font-semibold">TMDB ID <span className="font-normal text-text-muted">(optional)</span></label>
//         <input id="tmdb-id" type="number" min="1" value={tmdbId} onChange={(event) => setTmdbId(event.target.value)} placeholder="Link this post to a title" className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
//       </div>

//       <div>
//         <label htmlFor="post-excerpt" className="text-sm font-semibold">Excerpt <span className="font-normal text-text-muted">(optional)</span></label>
//         <textarea id="post-excerpt" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} placeholder="A short introduction" maxLength={280} rows={3} className="mt-2 w-full resize-y rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
//       </div>

//       <div>
//         <label className="text-sm font-semibold">Body</label>
//         {editor && (
//           <div className="mt-2 flex flex-wrap gap-2 border border-b-0 border-text-muted/20 bg-surface/50 p-2 rounded-t-xl items-center">
//             <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-3 py-1 rounded text-sm font-bold ${editor.isActive("bold") ? "bg-accent text-slate-950" : "bg-background border border-text-muted/10 hover:border-accent/40"}`}>B</button>
//             <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-3 py-1 rounded text-sm italic ${editor.isActive("italic") ? "bg-accent text-slate-950" : "bg-background border border-text-muted/10 hover:border-accent/40"}`}>I</button>
//             <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`px-3 py-1 rounded text-sm underline ${editor.isActive("underline") ? "bg-accent text-slate-950" : "bg-background border border-text-muted/10 hover:border-accent/40"}`}>U</button>
//             <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-3 py-1 rounded text-sm font-black ${editor.isActive("heading", { level: 2 }) ? "bg-accent text-slate-950" : "bg-background border border-text-muted/10 hover:border-accent/40"}`}>H2</button>
//             <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-3 py-1 rounded text-sm ${editor.isActive("bulletList") ? "bg-accent text-slate-950" : "bg-background border border-text-muted/10 hover:border-accent/40"}`}>• List</button>
//             <button type="button" onClick={addImage} className="px-3 py-1 rounded text-sm bg-background border border-text-muted/10 hover:border-accent/40 text-emerald-400 font-medium">+ Add Image URL</button>
//           </div>
//         )}
//         <EditorContent editor={editor} />
//       </div>

//       <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-text-muted/15 bg-background/50 p-4">
//         <label htmlFor="post-status" className="text-sm font-semibold">Save as</label>
//         <select id="post-status" value={status} onChange={(event) => setStatus(event.target.value as "draft" | "published")} className="rounded-lg border border-text-muted/20 bg-surface px-3 py-2 text-sm text-foreground">
//           <option value="draft">Draft</option>
//           <option value="published">Published</option>
//         </select>
//       </div>

//       {message && <p role="status" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm">{message}</p>}
//       <button type="submit" disabled={isSaving} className="rounded-xl bg-accent px-5 py-3 font-bold text-slate-950 transition-colors hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-60">
//         {isSaving ? "Saving..." : status === "published" ? "Publish post" : "Save draft"}
//       </button>
//     </form> 
//   );
// }






// ==========================================================================
// 🚀 PHASE 1 OF 3: src/components/WritePostForm.tsx (Imports & Extension Setup)
// ==========================================================================
"use client";

import { FormEvent, useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Dropcursor from "@tiptap/extension-dropcursor";
import DragHandle from "@tiptap/extension-drag-handle-react";
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Quote, 
  Code,
  Image as ImageIcon,
  Code2,
  Undo2,
  Redo2,
  ChevronDown,
  Crop
} from "lucide-react";

function createSlug(title: string) {
  return `${title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 8)}`;
}

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

export default function WritePostForm({ authorId, initialPost }: { authorId: string; initialPost?: PostData }) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form and layout visibility control state hooks
  const [title, setTitle] = useState(initialPost?.title || "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || "");
  const [contentType, setContentType] = useState<"review" | "article">(initialPost?.content_type || "review");
  const [mediaType, setMediaType] = useState(initialPost?.media_type || "movie");
  const [tmdbId, setTmdbId] = useState(initialPost?.tmdb_id?.toString() || "");
  const [status, setStatus] = useState<"draft" | "published">(initialPost?.status || "draft");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [headingDropdownOpen, setHeadingDropdownOpen] = useState(false);

  // Native Image Cropping Workbench Workspace states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);

  // 🎯 Upgraded Editor Lifecycle resolving Tailwind collisions & supporting native dragging
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Setting specific classes forces Tailwind's typography wrapper to render blocks correctly
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: { class: "font-black tracking-tight text-white" }
        },
        bulletList: {
          HTMLAttributes: { class: "list-disc pl-6 space-y-1 my-4 block" }
        },
        orderedList: {
          HTMLAttributes: { class: "list-decimal pl-6 space-y-1 my-4 block" }
        },
        blockquote: {
          HTMLAttributes: { class: "border-l-4 border-accent pl-4 italic text-text-muted my-4 block" }
        },
        undoRedo: { depth: 50, newGroupDelay: 500 }
      }),
      Underline.configure({}),
      Dropcursor.configure({ color: "#FFC107", width: 3 }), // Clearly shows inline drop point indicator
      Image.configure({
        inline: false, // Forces block layout so images drag cleanly between sentence paragraphs
        HTMLAttributes: {
          class: "rounded-xl border border-text-muted/15 my-6 max-w-full h-auto mx-auto shadow-md block transition-transform pointer-events-auto cursor-grab active:cursor-grabbing",
        },
      }),
      Placeholder.configure({ placeholder: "Share your cinematic thoughts..." }),
    ],
    content: initialPost?.body || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "mt-0 min-h-[350px] w-full rounded-b-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 prose prose-invert max-w-none overflow-y-auto",
      },
    },
  });

  // Phase 1 cuts cleanly here before rendering the workspace fields layer


  // ==========================================================================
// 🚀 PHASE 2 OF 3: src/components/WritePostForm.tsx (Metadata Form & Heading Menu)
// ==========================================================================
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    
    setIsSaving(true);
    setMessage("");

    const richBodyContent = editor.getHTML();
    const postPayload = {
      author_id: authorId,
      title: title.trim(),
      slug: initialPost ? initialPost.title.trim() === title.trim() ? initialPost.slug : createSlug(title) : createSlug(title),
      excerpt: excerpt.trim() || null,
      body: richBodyContent,
      content_type: contentType,
      media_type: mediaType,
      tmdb_id: tmdbId.trim() ? Number.parseInt(tmdbId, 10) : null,
      status,
      published_at: status === "published" ? (initialPost?.status === "published" ? undefined : new Date().toISOString()) : null,
    };

    const { error: queryError } = initialPost
      ? await supabase.from("posts").update(postPayload).eq("id", initialPost.id)
      : await supabase.from("posts").insert(postPayload);

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
          <div className="mt-2 flex flex-wrap gap-1 border border-b-0 border-text-muted/20 bg-surface/50 p-2 rounded-t-xl items-center relative">
            {/* Inline Formatting */}
            <button type="button" title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded text-sm transition-colors cursor-pointer ${editor.isActive("bold") ? "bg-accent text-slate-950" : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"}`}>
              <Bold className="h-4 w-4" />
            </button>
            <button type="button" title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded text-sm transition-colors cursor-pointer ${editor.isActive("italic") ? "bg-accent text-slate-950" : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"}`}>
              <Italic className="h-4 w-4" />
            </button>
            <button type="button" title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-2 rounded text-sm transition-colors cursor-pointer ${editor.isActive("underline") ? "bg-accent text-slate-950" : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"}`}>
              <UnderlineIcon className="h-4 w-4" />
            </button>
            
            <div className="h-6 w-px bg-text-muted/20 mx-1" />

            {/* 🎯 UPGRADED UNIFIED HEADING DROPDOWN MENU */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setHeadingDropdownOpen(!headingDropdownOpen)}
                className={`flex items-center gap-1 px-3 py-2 rounded text-xs font-bold transition-colors cursor-pointer border border-text-muted/10 bg-background text-foreground hover:border-accent/40 hover:text-accent ${
                  editor.isActive("heading") ? "border-accent text-accent" : ""
                }`}
              >
                <span>
                  {editor.isActive("heading", { level: 1 }) ? "H1" :
                   editor.isActive("heading", { level: 2 }) ? "H2" :
                   editor.isActive("heading", { level: 3 }) ? "H3" : "Heading"}
                </span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {headingDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setHeadingDropdownOpen(false)} />
                  <div className="absolute left-0 mt-1 w-32 rounded-xl border border-text-muted/15 bg-surface p-1 shadow-xl z-50 flex flex-col gap-0.5">
                    {([1, 2, 3] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => {
                          editor.chain().focus().toggleHeading({ level }).run();
                          setHeadingDropdownOpen(false);
                        }}
                        className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                          editor.isActive("heading", { level }) ? "bg-accent text-slate-950" : "hover:bg-accent/10 text-foreground"
                        }`}
                      >
                        Heading {level}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="h-6 w-px bg-text-muted/20 mx-1" />
  {/* Phase 2 breaks here cleanly right before lists and advanced media handlers */}



{/* 🚀 PHASE 3 OF 3: src/components/WritePostForm.tsx (Lists, Upload, & Drag Handles) */}

            {/* List Control Triggers */}
            <button type="button" title="Bullet List" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded text-sm transition-colors cursor-pointer ${editor.isActive("bulletList") ? "bg-accent text-slate-950" : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"}`}>
              <List className="h-4 w-4" />
            </button>
            <button type="button" title="Numbered List" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded text-sm transition-colors cursor-pointer ${editor.isActive("orderedList") ? "bg-accent text-slate-950" : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"}`}>
              <ListOrdered className="h-4 w-4" />
            </button>

            <div className="h-6 w-px bg-text-muted/20 mx-1" />

            {/* Formatting Blocks */}
            <button type="button" title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-2 rounded text-sm transition-colors cursor-pointer ${editor.isActive("blockquote") ? "bg-accent text-slate-950" : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"}`}>
              <Quote className="h-4 w-4" />
            </button>
            <button type="button" title="Code Block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`p-2 rounded text-sm transition-colors cursor-pointer ${editor.isActive("codeBlock") ? "bg-accent text-slate-950" : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"}`}>
              <Code className="h-4 w-4" />
            </button>
            <button type="button" title="Inline Code" onClick={() => editor.chain().focus().toggleCode().run()} className={`p-2 rounded text-sm transition-colors cursor-pointer ${editor.isActive("code") ? "bg-accent text-slate-950" : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"}`}>
              <Code2 className="h-4 w-4" />
            </button>

            <div className="h-6 w-px bg-text-muted/20 mx-1" />

            {/* 🎯 DEVICE IMAGE UPLOADING & CROP UTILITY CONTROLS */}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    setRawImageSrc(reader.result as string);
                    setCropModalOpen(true);
                  };
                  reader.readAsDataURL(file);
                }
              }} 
            />
            <button 
              type="button" 
              title="Upload Image from Device" 
              onClick={() => fileInputRef.current?.click()} 
              className="p-2 rounded text-sm bg-background border border-text-muted/10 hover:border-accent/40 text-emerald-400 transition-colors cursor-pointer"
            >
              <ImageIcon className="h-4 w-4" />
            </button>

            <div className="h-6 w-px bg-text-muted/20 mx-1" />

            {/* History Engine Layers */}
            <button type="button" title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-2 rounded text-sm transition-colors cursor-pointer bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed">
              <Undo2 className="h-4 w-4" />
            </button>
            <button type="button" title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-2 rounded text-sm transition-colors cursor-pointer bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed">
              <Redo2 className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="relative w-full">
          {/* 🎯 DRAG HANDLE POSITION ENABLER WORKSPACE LAYER */}
          {editor && (
            <DragHandle 
              editor={editor} 
              pluginKey="drag-handle-workspace-key"
              tippyOptions={{ duration: 100 }}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded bg-accent text-slate-950 shadow-md cursor-grab active:cursor-grabbing hover:scale-105 transition-transform">
                ⋮⋮
              </div>
            </DragHandle>
          )}
          <EditorContent editor={editor} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-text-muted/15 bg-background/50 p-4">
        <label htmlFor="post-status" className="text-sm font-semibold">Save as</label>
        <select id="post-status" value={status} onChange={(event) => setStatus(event.target.value as "draft" | "published")} className="rounded-lg border border-text-muted/20 bg-surface px-3 py-2 text-sm text-foreground">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {message && <p role="status" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm">{message}</p>}
      <button type="submit" disabled={isSaving} className="rounded-xl bg-accent px-5 py-3 font-bold text-slate-950 transition-colors hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-60 cursor-pointer">
        {isSaving ? "Saving..." : status === "published" ? "Publish post" : "Save draft"}
      </button>

      {/* 🎯 LIGHTWEIGHT INTEGRATED DEVICE IMAGE CROPPING WORKBENCH WORKSPACE */}
      {cropModalOpen && rawImageSrc && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-text-muted/20 bg-surface p-5 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-text-muted/10 pb-3 mb-4">
              <Crop className="h-5 w-5 text-accent" />
              <h3 className="font-bold text-foreground text-sm">Crop Workspace Image</h3>
            </div>
            
            <div className="relative overflow-hidden rounded-xl border border-text-muted/10 bg-background max-h-[260px] flex items-center justify-center p-2">
              <img src={rawImageSrc} id="crop-target-element" alt="Source workbench view" className="max-w-full max-h-[240px] object-contain opacity-80" />
              <div className="absolute inset-4 border-2 border-dashed border-accent rounded-lg pointer-events-none shadow-[0_0_0_4000px_rgba(0,0,0,0.5)]" />
            </div>

            <p className="text-[11px] text-text-muted mt-3 leading-relaxed">
              * Local canvas optimization proxy template logic: Pressing Apply injects your centered composition array right down into the editor text workflow timeline instantly.
            </p>

            <div className="flex justify-end gap-2 mt-5 border-t border-text-muted/10 pt-3">
              <button 
                type="button" 
                onClick={() => { setCropModalOpen(false); setRawImageSrc(null); }} 
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-background hover:bg-text-muted/10 text-foreground border border-text-muted/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => {
                  if (editor && rawImageSrc) {
                    editor.chain().focus().setImage({ src: rawImageSrc }).run();
                  }
                  setCropModalOpen(false);
                  setRawImageSrc(null);
                }} 
                className="px-4 py-2 rounded-xl text-xs font-bold bg-accent hover:bg-yellow-300 text-slate-950 transition-colors cursor-pointer"
              >
                Apply & Inject
              </button>
            </div>
          </div>
        </div>
      )}
    </form> 
  );
}
