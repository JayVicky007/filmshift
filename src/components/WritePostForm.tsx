// ==========================================================================
// 🚀 PHASE 1 OF 3: src/components/WritePostForm.tsx (Imports & Configuration)
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
  ChevronDown
} from "lucide-react";
import TextAlign from "@tiptap/extension-text-align";


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
  
  const [title, setTitle] = useState(initialPost?.title || "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || "");
  const [contentType, setContentType] = useState<"review" | "article">(initialPost?.content_type || "review");
  const [mediaType, setMediaType] = useState(initialPost?.media_type || "movie");
  const [tmdbId, setTmdbId] = useState(initialPost?.tmdb_id?.toString() || "");
  const [status, setStatus] = useState<"draft" | "published">(initialPost?.status || "draft");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [headingDropdownOpen, setHeadingDropdownOpen] = useState(false);

  // 🎯 Upgraded Editor Lifecycle—FIXED levels syntax, removed cropping dependencies entirely
  const editor = useEditor({
// 🚀 Clean configuration array inside src/components/WritePostForm.tsx
// 🚀 Clean, warning-free extensions configuration in src/components/WritePostForm.tsx
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1,2,3],
        HTMLAttributes: { class: "font-black tracking-tight text-white heading-node" }
      },
      bulletList: { HTMLAttributes: { class: "list-disc pl-6 space-y-1 my-4 block text-foreground/90" } },
      orderedList: { HTMLAttributes: { class: "list-decimal pl-6 space-y-1 my-4 block text-foreground/90" } },
      blockquote: { HTMLAttributes: { class: "border-l-4 border-accent bg-surface/30 px-4 py-2 italic text-text-muted my-4 block rounded-r-lg" } },
      dropcursor: { color: "#FFC107", width: 3 },
      undoRedo: { depth: 50, newGroupDelay: 500 }
    }),
    
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    
    Image.configure({
      HTMLAttributes: {
        class: "rounded-xl border border-text-muted/15 my-6 max-w-full max-h-[500px] object-contain mx-auto shadow-md block transition-transform pointer-events-auto cursor-grab active:cursor-grabbing",
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

  // Phase 1 cuts cleanly here

// ==========================================================================
// 🚀 PHASE 2 OF 3: src/components/WritePostForm.tsx (Form Fields & Alignment Toolbar)
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
        {/* 🚀 Updated Select values to output "tv" for series, ensuring alignment with dynamic routes */}
        <div>
          <label htmlFor="media-type" className="text-sm font-semibold">Media type</label>
          <select 
            id="media-type" 
            value={mediaType} 
            onChange={(event) => setMediaType(event.target.value)} 
            className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          >
            <option value="movie">Movie</option>
            <option value="tv">Series (TV)</option>
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
          <div className="mt-2 flex flex-wrap gap-1 border border-b-0 border-text-muted/20 bg-surface/50 p-2 rounded-t-xl items-center relative z-30">
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

            {/* Heading Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setHeadingDropdownOpen(!headingDropdownOpen)}
                className={`flex items-center gap-1 px-3 py-2 rounded text-xs font-bold transition-colors cursor-pointer border border-text-muted/10 bg-background text-foreground hover:border-accent/40 hover:text-accent ${
                  editor.isActive("heading") ? "border-accent text-accent" : ""
                }`}
              >
                <span>
                  {editor.isActive("heading", { level: 1 }) ? "Heading 1" :
                   editor.isActive("heading", { level: 2 }) ? "Heading 2" :
                   editor.isActive("heading", { level: 3 }) ? "Heading 3" : "Heading"}
                </span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {headingDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setHeadingDropdownOpen(false)} />
                  <div className="absolute left-0 mt-1 w-36 rounded-xl border border-text-muted/15 bg-surface p-1 shadow-xl z-50 flex flex-col gap-0.5">
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

            {/* 🚀 INTEGRATED NATIVE TEXT ALIGNMENT BUTTON CONTROLS */}
            <button
              type="button"
              title="Align Left"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={`p-2 rounded text-sm transition-colors cursor-pointer ${
                editor.isActive({ textAlign: 'left' }) 
                  ? "bg-accent text-slate-950" 
                  : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h16" />
              </svg>
            </button>

            <button
              type="button"
              title="Align Center"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={`p-2 rounded text-sm transition-colors cursor-pointer ${
                editor.isActive({ textAlign: 'center' }) 
                  ? "bg-accent text-slate-950" 
                  : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M6 18h12" />
              </svg>
            </button>

<button
  type="button"
  title="Align Right"
  onClick={() => editor.chain().focus().setTextAlign('right').run()}
  className={`p-2 rounded text-sm transition-colors cursor-pointer ${
    editor.isActive({ textAlign: 'right' }) 
      ? "bg-accent text-slate-950" 
      : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"
  }`}
>
  {/* 🚀 FIXED: Added the balanced right-alignment SVG lines inside the button tags */}
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M8 12h12M4 18h16" />
  </svg>
</button>

            <div className="h-6 w-px bg-text-muted/20 mx-1" />

{/* 🚀 PHASE 3 OF 3: src/components/WritePostForm.tsx (Direct Injection & Right Handle) */}
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

{/* 🚀 DEVICE IMAGE UPLOADING UTILITY WITH 5MB PLATFORM LIMIT FILTER */}
<input 
  type="file" 
  ref={fileInputRef} 
  accept="image/*" 
  className="hidden" 
  onChange={(e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("❌ Upload blocked: Image file size exceeds the 5 MB platform limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageSrc = reader.result as string;
      if (editor && imageSrc) {
        editor.chain().focus().setImage({ src: imageSrc }).run();
      }
    };
    reader.readAsDataURL(file);
  }} 
/>

{/* Button to trigger the device file browser */}
<button 
  type="button" 
  title="Upload Image from Device (Max 5MB)" 
  onClick={() => fileInputRef.current?.click()} 
  className="p-2 rounded text-sm bg-background border border-text-muted/10 hover:border-accent/40 text-emerald-400 transition-colors cursor-pointer"
>
  <ImageIcon className="h-4 w-4" />
</button>

{/* 🚀 RE-ADDED: ADD IMAGE BY URL BUTTON */}
<button
  type="button"
  title="Insert Image by URL"
  onClick={() => {
    const url = window.prompt("Enter external image URL:");
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }}
  className="p-2 rounded text-sm bg-background border border-text-muted/10 hover:border-accent/40 text-accent transition-colors cursor-pointer"
>
  {/* Link style variant icon indicating an external URL fetch query */}
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
</button>
              </div>
        )}

        <div className="relative w-full">
          {/* 🎯 DRAG HANDLE ANCHORED GRACEFULLY TO THE RIGHT SIDE MARGIN */}
          {editor && (
            <DragHandle 
              editor={editor} 
              pluginKey="drag-handle-workspace-key"
              // 🚀 FIXED: Replaced legacy tippy attributes with the correct floating-ui config object
              computePositionConfig={{ 
                placement: "right-start", // Anchors handle off to the right gutter margins cleanly
                strategy: "absolute"
              }}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded bg-accent text-slate-950 shadow-md cursor-grab active:cursor-grabbing hover:scale-105 transition-transform font-bold text-xs select-none">
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
    </form> 
  );
}






//   // ==========================================================================
//   // 🚀 PHASE 3 - PART A: RENDERING FORM SETTINGS & METADATA CONTROLS
//   // ==========================================================================
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
//           <select 
//             id="content-type" 
//             value={contentType} 
//             onChange={(event) => setContentType(event.target.value as "review" | "article")} 
//             className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
//           >
//             <option value="review">Review</option>
//             <option value="article">Article</option>
//           </select>
//         </div>
//         <div>
//           <label htmlFor="media-type" className="text-sm font-semibold">Media type</label>
//           <select 
//             id="media-type" 
//             value={mediaType} 
//             onChange={(event) => setMediaType(event.target.value)} 
//             className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
//           >
//             <option value="movie">Movie</option>
//             <option value="series">Series</option>
//             <option value="anime">Anime</option>
//             <option value="animation">Animation</option>
//             <option value="documentary">Documentary</option>
//           </select>
//         </div>
//       </div>

//       <div>
//         <label htmlFor="tmdb-id" className="text-sm font-semibold">
//           TMDB ID <span className="font-normal text-text-muted">(optional)</span>
//         </label>
//         <input 
//           id="tmdb-id" 
//           type="number" 
//           min="1" 
//           value={tmdbId} 
//           onChange={(event) => setTmdbId(event.target.value)} 
//           placeholder="Link this post to a title" 
//           className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" 
//         />
//       </div>

//       <div>
//         <label htmlFor="post-excerpt" className="text-sm font-semibold">
//           Excerpt <span className="font-normal text-text-muted">(optional)</span>
//         </label>
//         <textarea 
//           id="post-excerpt" 
//           value={excerpt} 
//           onChange={(event) => setExcerpt(event.target.value)} 
//           placeholder="A short introduction" 
//           maxLength={280} 
//           rows={3} 
//           className="mt-2 w-full resize-y rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" 
//         />
//       </div>


//       {/* ==========================================================================
//           🚀 PHASE 3 - PART B (SUB-PHASE 1): TOOLBAR SETUP & TEXT ACTIONS
//           ========================================================================== */}
//       <div>
//         <label className="text-sm font-semibold">Body</label>
//         {editor && (
//           <div className="mt-2 flex flex-wrap gap-1 border border-b-0 border-text-muted/20 bg-surface/50 p-2 rounded-t-xl items-center relative z-30">
//             <button type="button" title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded text-sm transition-colors cursor-pointer ${editor.isActive("bold") ? "bg-accent text-slate-950" : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"}`}>
//               <Bold className="h-4 w-4" />
//             </button>
//             <button type="button" title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded text-sm transition-colors cursor-pointer ${editor.isActive("italic") ? "bg-accent text-slate-950" : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"}`}>
//               <Italic className="h-4 w-4" />
//             </button>
//             <button type="button" title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-2 rounded text-sm transition-colors cursor-pointer ${editor.isActive("underline") ? "bg-accent text-slate-950" : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"}`}>
//               <UnderlineIcon className="h-4 w-4" />
//             </button>
            
//             <div className="h-6 w-px bg-text-muted/20 mx-1" />

//             <div className="relative">
//               <button type="button" onClick={() => setHeadingDropdownOpen(!headingDropdownOpen)} className={`flex items-center gap-1 px-3 py-2 rounded text-xs font-bold transition-colors cursor-pointer border border-text-muted/10 bg-background text-foreground hover:border-accent/40 hover:text-accent ${editor.isActive("heading") ? "border-accent text-accent" : ""}`}>
//                 <span>
//                   {editor.isActive("heading", { level: 1 }) ? "Heading 1" :
//                    editor.isActive("heading", { level: 2 }) ? "Heading 2" :
//                    editor.isActive("heading", { level: 3 }) ? "Heading 3" : "Heading"}
//                 </span>
//                 <ChevronDown className="h-3 w-3" />
//               </button>

//               {headingDropdownOpen && (
//                 <>
//                   <div className="fixed inset-0 z-40" onClick={() => setHeadingDropdownOpen(false)} />
//                   <div className="absolute left-0 mt-1 w-36 rounded-xl border border-text-muted/15 bg-surface p-1 shadow-xl z-50 flex flex-col gap-0.5">
//                     {([1, 2, 3] as const).map((level) => (
//                       <button key={level} type="button" onClick={() => { editor.chain().focus().toggleHeading({ level }).run(); setHeadingDropdownOpen(false); }} className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${editor.isActive("heading", { level }) ? "bg-accent text-slate-950" : "hover:bg-accent/10 text-foreground"}`}>
//                         Heading {level}
//                       </button>
//                     ))}
//                   </div>
//                 </>
//               )}
//             </div>

//             <div className="h-6 w-px bg-text-muted/20 mx-1" />

//             <button type="button" title="Align Left" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-2 rounded text-sm transition-colors cursor-pointer ${editor.isActive({ textAlign: 'left' }) ? "bg-accent text-slate-950" : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"}`}>
//               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h16" /></svg>
//             </button>
//             <button type="button" title="Align Center" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-2 rounded text-sm transition-colors cursor-pointer ${editor.isActive({ textAlign: 'center' }) ? "bg-accent text-slate-950" : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"}`}>
//               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M6 18h12" /></svg>
//             </button>
//             <button type="button" title="Align Right" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`p-2 rounded text-sm transition-colors cursor-pointer ${editor.isActive({ textAlign: 'right' }) ? "bg-accent text-slate-950" : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"}`}>
//               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M8 12h12M4 18h16" /></svg>
//             </button>
//           </div>
//         )}


//           {/* ==========================================================================
//               🚀 PHASE 3 - PART B (SUB-PHASE 2): MEDIA UPLOADS, CANVAS & STATUS
//               ========================================================================== */}
//           <div className="mt-2 flex flex-wrap gap-1 border border-b-0 border-text-muted/20 bg-surface/50 p-2 items-center relative z-20">
//             <button type="button" title="Bullet List" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded text-sm transition-colors cursor-pointer ${editor.isActive("bulletList") ? "bg-accent text-slate-950" : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"}`}>
//               <List className="h-4 w-4" />
//             </button>
//             <button type="button" title="Numbered List" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded text-sm transition-colors cursor-pointer ${editor.isActive("orderedList") ? "bg-accent text-slate-950" : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"}`}>
//               <ListOrdered className="h-4 w-4" />
//             </button>

//             <div className="h-6 w-px bg-text-muted/20 mx-1" />

//             <button type="button" title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-2 rounded text-sm transition-colors cursor-pointer ${editor.isActive("blockquote") ? "bg-accent text-slate-950" : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"}`}>
//               <Quote className="h-4 w-4" />
//             </button>
//             <button type="button" title="Code Block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`p-2 rounded text-sm transition-colors cursor-pointer ${editor.isActive("codeBlock") ? "bg-accent text-slate-950" : "bg-background text-foreground border border-text-muted/10 hover:border-accent/40 hover:text-accent"}`}>
//               <Code className="h-4 w-4" />
//             </button>

//             <div className="h-6 w-px bg-text-muted/20 mx-1" />

//             <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => {
//               const file = e.target.files?.[0]; if (!file) return;
//               if (file.size > 5 * 1024 * 1024) { alert("❌ Upload blocked: Image file size exceeds the 5 MB platform limit."); return; }
//               const reader = new FileReader(); reader.onload = () => { const imageSrc = reader.result as string; if (editor && imageSrc) { editor.chain().focus().setImage({ src: imageSrc }).run(); } }; reader.readAsDataURL(file);
//             }} />

//             <button type="button" title="Upload Image (Max 5MB)" onClick={() => fileInputRef.current?.click()} className="p-2 rounded text-sm bg-background border border-text-muted/10 hover:border-accent/40 text-emerald-400 transition-colors cursor-pointer">
//               <ImageIcon className="h-4 w-4" />
//             </button>

//             <button type="button" title="Insert Image by URL" onClick={() => { const url = window.prompt("Enter external image URL:"); if (url && editor) { editor.chain().focus().setImage({ src: url }).run(); } }} className="p-2 rounded text-sm bg-background border border-text-muted/10 hover:border-accent/40 text-accent transition-colors cursor-pointer">
//               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
//             </button>
//           </div>
//         )}

//         <div className="relative w-full">
//           {editor && (
//             <DragHandle editor={editor} pluginKey="drag-handle-workspace-key" computePositionConfig={{ placement: "right-start", strategy: "absolute" }}>
//               <div className="flex h-6 w-6 items-center justify-center rounded bg-accent text-slate-950 shadow-md cursor-grab active:cursor-grabbing hover:scale-105 transition-transform font-bold text-xs select-none">⋮⋮</div>
//             </DragHandle>
//           )}
//           <EditorContent editor={editor} />
//         </div>
//       </div>

//       <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-text-muted/15 bg-background/50 p-4">
//         <div className="flex items-center gap-3">
//           <label htmlFor="post-status" className="text-sm font-semibold">Save as</label>
//           <select id="post-status" value={status} onChange={(event) => setStatus(event.target.value as "draft" | "published")} className="rounded-lg border border-text-muted/20 bg-surface px-3 py-2 text-sm text-foreground">
//             <option value="draft">Draft</option>
//             <option value="published">Published</option>
//           </select>
//         </div>
        
//         <div className="text-xs font-mono text-text-muted transition-all">
//           {isAutosaving ? (
//             <span className="flex items-center gap-1.5 text-accent animate-pulse">✨ Background syncing...</span>
//           ) : autosaveTime ? (
//             <span>Saved automatically at {autosaveTime}</span>
//           ) : (
//             status === "draft" && <span>Ready for background save</span>
//           )}
//         </div>
//       </div>

//       {message && <p role="status" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm">{message}</p>}
//       <button type="submit" disabled={isSaving} className="rounded-xl bg-accent px-5 py-3 font-bold text-slate-950 transition-colors hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-60 cursor-pointer">
//         {isSaving ? "Saving..." : status === "published" ? "Publish post" : "Save draft"}
//       </button>
//     </form> 
//   );
// }
