// ==========================================================================
// 🚀 PHASE 1 OF 3: src/components/WritePostForm.tsx (Imports & Configuration)
// ==========================================================================
"use client";

import { FormEvent, useState, useRef, ChangeEvent, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import type { Mark, Node as ProseMirrorNode } from "@tiptap/pm/model";
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
  SeparatorHorizontal,
} from "lucide-react";
import TextAlign from "@tiptap/extension-text-align";


function createSlug(title: string) {
  return `${title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 8)}`;
}

type TextCase = "uppercase" | "capitalize" | "lowercase";

const legacyMediaTypeLabels: Record<string, string> = {
  series: "Series",
  show: "Series",
  anime: "Anime",
  animation: "Animation",
  documentary: "Documentary",
  docuseries: "Docuseries",
};

function transformEditorSelection(editor: Editor, textCase: TextCase) {
  const { state } = editor;
  const { from, to, empty, $from } = state.selection;
  if (empty) return;

  const textNodes: Array<{
    from: number;
    to: number;
    text: string;
    marks: readonly Mark[];
    parent: ProseMirrorNode;
  }> = [];

  state.doc.nodesBetween(from, to, (node, position, parent) => {
    if (!node.isText || !node.text || !parent) return;
    const start = Math.max(from, position);
    const end = Math.min(to, position + node.nodeSize);
    textNodes.push({
      from: start,
      to: end,
      text: node.text.slice(start - position, end - position),
      marks: node.marks,
      parent,
    });
  });

  if (!textNodes.length) return;

  const wordCharacter = /^[\p{L}\p{N}]$/u;
  let previousWasWord = false;
  let currentParent = textNodes[0].parent;
  const firstTextOffset = textNodes[0].from - from;
  if (textCase === "capitalize" && firstTextOffset === 0 && $from.parentOffset > 0) {
    const precedingText = $from.parent.textBetween(0, $from.parentOffset);
    const precedingCharacter = Array.from(precedingText).at(-1);
    previousWasWord = precedingCharacter ? wordCharacter.test(precedingCharacter) : false;
  }

  const transformedNodes = textNodes.map((textNode) => {
    if (textNode.parent !== currentParent) {
      currentParent = textNode.parent;
      previousWasWord = false;
    }
    const transformedText = Array.from(textNode.text).map((character) => {
      let transformedCharacter = character;
      if (textCase === "uppercase") transformedCharacter = character.toUpperCase();
      if (textCase === "lowercase") transformedCharacter = character.toLowerCase();
      if (textCase === "capitalize" && /^\p{L}$/u.test(character)) {
        transformedCharacter = previousWasWord
          ? character.toLowerCase()
          : character.toUpperCase();
      }
      previousWasWord = wordCharacter.test(character);
      return transformedCharacter;
    }).join("");
    return { ...textNode, transformedText };
  });

  let transaction = state.tr;
  for (const textNode of transformedNodes.reverse()) {
    transaction = transaction.replaceWith(
      textNode.from,
      textNode.to,
      state.schema.text(textNode.transformedText, textNode.marks),
    );
  }

  transaction.setSelection(state.selection.map(transaction.doc, transaction.mapping));
  editor.view.dispatch(transaction);
  editor.view.focus();
}

interface PostData {
  id: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  body: string;
  content_type: "review" | "article";
  media_type: string;
  tmdb_id: number | null;
  status: "draft" | "published";
  slug: string | null; 
  updated_at?: string;
}

type SelectedImage = {
  src: string;
  width: number | null;
  height: number | null;
  objectFit: "contain" | "cover";
  objectPosition: string;
};

const cropPositions = [
  ["left top", "center top", "right top"],
  ["left center", "center", "right center"],
  ["left bottom", "center bottom", "right bottom"],
];

export default function WritePostForm({ authorId, initialPost }: { authorId: string; initialPost?: PostData }) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const savedPostIdRef = useRef(initialPost?.id ?? null);
  const savedSlugRef = useRef(initialPost?.slug ?? null);
  const savedTitleRef = useRef(initialPost?.title.trim() ?? "");
  const pendingSlugRef = useRef<{ title: string; slug: string } | null>(null);
  const saveInFlightRef = useRef(false);
  const draftRevisionRef = useRef(0);
  const blockedAutosaveRevisionRef = useRef<number | null>(null);
  const editorSectionRef = useRef<HTMLDivElement>(null);
  const toolbarSlotRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  
  const [title, setTitle] = useState(initialPost?.title || "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || "");
  const [coverImageUrl, setCoverImageUrl] = useState(initialPost?.cover_image_url || "");
  const [coverImageUrlInput, setCoverImageUrlInput] = useState(initialPost?.cover_image_url || "");
  const [contentType, setContentType] = useState<"review" | "article">(initialPost?.content_type || "review");
  const [mediaType, setMediaType] = useState(initialPost?.media_type || "movie");
  const [tmdbId, setTmdbId] = useState(initialPost?.tmdb_id?.toString() || "");
  const [status, setStatus] = useState<"draft" | "published">(initialPost?.status || "draft");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(() => {
    if (!initialPost?.updated_at) return null;
    const savedDate = new Date(initialPost.updated_at);
    return Number.isNaN(savedDate.getTime()) ? null : savedDate;
  });
  const [editorRevision, setEditorRevision] = useState(0);
  const [toolbarPosition, setToolbarPosition] = useState<{ left: number; width: number } | null>(null);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const [hasTextSelection, setHasTextSelection] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);

  function markDraftDirty() {
    draftRevisionRef.current += 1;
    blockedAutosaveRevisionRef.current = null;
    setIsDirty(true);
    setSaveStatus("");
  }

  useEffect(() => {
    const topOffset = 72;
    let animationFrame = 0;

    function updateToolbarPosition() {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const section = editorSectionRef.current;
        const slot = toolbarSlotRef.current;
        const toolbar = toolbarRef.current;
        if (!section || !slot || !toolbar) return;

        const sectionRect = section.getBoundingClientRect();
        const slotRect = slot.getBoundingClientRect();
        const toolbarRect = toolbar.getBoundingClientRect();
        const height = toolbarRect.height;
        const shouldPin = slotRect.top < topOffset && sectionRect.bottom > topOffset + height;

        setToolbarHeight((current) => Math.abs(current - height) > 1 ? height : current);
        setToolbarPosition((current) => {
          if (!shouldPin) return null;
          if (
            current &&
            Math.abs(current.left - slotRect.left) < 1 &&
            Math.abs(current.width - slotRect.width) < 1
          ) {
            return current;
          }
          return { left: slotRect.left, width: slotRect.width };
        });
      });
    }

    updateToolbarPosition();
    const resizeObserver = new ResizeObserver(updateToolbarPosition);
    if (editorSectionRef.current) resizeObserver.observe(editorSectionRef.current);
    if (toolbarSlotRef.current) resizeObserver.observe(toolbarSlotRef.current);
    if (toolbarRef.current) resizeObserver.observe(toolbarRef.current);
    window.addEventListener("scroll", updateToolbarPosition, true);
    window.addEventListener("resize", updateToolbarPosition);
    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", updateToolbarPosition, true);
      window.removeEventListener("resize", updateToolbarPosition);
    };
  }, []);

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
      types: ['heading', 'paragraph', 'blockquote', 'image'],
    }),
    
    Image.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          objectFit: {
            default: "contain",
            parseHTML: (element) => element.style.objectFit || "contain",
            renderHTML: ({ objectFit }) => ({
              style: `object-fit: ${objectFit === "cover" ? "cover" : "contain"}`,
            }),
          },
          objectPosition: {
            default: "center",
            parseHTML: (element) => element.style.objectPosition || "center",
            renderHTML: ({ objectPosition }) => ({
              style: `object-position: ${cropPositions.flat().includes(objectPosition) ? objectPosition : "center"}`,
            }),
          },
        };
      },
    }).configure({
      resize: {
        enabled: true,
        minWidth: 100,
        minHeight: 60,
        alwaysPreserveAspectRatio: true,
      },
      HTMLAttributes: {
        class: "rounded-xl border border-text-muted/15 my-6 max-w-full mx-auto shadow-md block transition-transform pointer-events-auto cursor-grab active:cursor-grabbing",
      },
    }),
    
    Placeholder.configure({ placeholder: "Share your cinematic thoughts..." }),
  ],
    content: initialPost?.body || "",
    immediatelyRender: false,
    onUpdate: () => {
      markDraftDirty();
      setEditorRevision((revision) => revision + 1);
    },
    editorProps: {
      attributes: {
        class: "mt-0 min-h-[350px] w-full rounded-b-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 prose prose-invert max-w-none overflow-y-auto",
      },
    },
  });

  useEffect(() => {
    const activeEditor = editor;
    if (!activeEditor) return;

    function updateSelectedImage(currentEditor: NonNullable<typeof editor>) {
      const selection = currentEditor.state.selection;
      let containsText = false;
      if (!selection.empty) {
        currentEditor.state.doc.nodesBetween(selection.from, selection.to, (node) => {
          if (node.isText) containsText = true;
        });
      }
      setHasTextSelection(containsText);

      if (!(selection instanceof NodeSelection) || selection.node.type.name !== "image") {
        setSelectedImage((current) => current === null ? current : null);
        return;
      }

      const attributes = selection.node.attrs;
      const nextImage = {
        src: attributes.src,
        width: attributes.width ? Number(attributes.width) : null,
        height: attributes.height ? Number(attributes.height) : null,
        objectFit: attributes.objectFit === "cover" ? "cover" : "contain",
        objectPosition: cropPositions.flat().includes(attributes.objectPosition)
          ? attributes.objectPosition
          : "center",
      } satisfies SelectedImage;
      setSelectedImage((current) =>
        current &&
        current.src === nextImage.src &&
        current.width === nextImage.width &&
        current.height === nextImage.height &&
        current.objectFit === nextImage.objectFit &&
        current.objectPosition === nextImage.objectPosition
          ? current
          : nextImage,
      );
    }

    const handleSelectionUpdate = () => updateSelectedImage(activeEditor);
    activeEditor.on("selectionUpdate", handleSelectionUpdate);
    activeEditor.on("transaction", handleSelectionUpdate);
    handleSelectionUpdate();
    return () => {
      activeEditor.off("selectionUpdate", handleSelectionUpdate);
      activeEditor.off("transaction", handleSelectionUpdate);
    };
  }, [editor]);

  function updateSelectedImageLayout(changes: Partial<SelectedImage>) {
    if (!editor || !selectedImage) return;
    const nextImage = { ...selectedImage, ...changes };
    setSelectedImage(nextImage);
    editor.chain().focus().updateAttributes("image", {
      width: nextImage.width,
      height: nextImage.height,
      objectFit: nextImage.objectFit,
      objectPosition: nextImage.objectPosition,
    }).run();
  }

  // Phase 1 cuts cleanly here

// ==========================================================================
// 🚀 PHASE 2 OF 3: src/components/WritePostForm.tsx (Form Fields & Alignment Toolbar)
// ==========================================================================
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || isSaving || isUploadingImage || saveInFlightRef.current) return;
    
    const submittedRevision = draftRevisionRef.current;
    saveInFlightRef.current = true;
    setIsSaving(true);
    setMessage("");

    try {
      const postPayload = buildPostPayload(status);
      const result = savedPostIdRef.current
        ? await supabase
          .from("posts")
          .update(postPayload)
          .eq("id", savedPostIdRef.current)
          .select("id, slug")
          .single()
        : await supabase
          .from("posts")
          .insert(postPayload)
          .select("id, slug")
          .single();

      if (result.error) {
        setMessage(result.error.message);
        setSaveStatus("");
        return;
      }

      rememberSavedPost(result.data, postPayload.title);
      setSavedAt(new Date());
      const changesRemain = draftRevisionRef.current !== submittedRevision;
      setIsDirty(changesRemain);
      if (changesRemain) {
        setSaveStatus(status === "published"
          ? "Some changes were made during publishing. Save or publish again to include them."
          : "Newer changes will be saved automatically.");
        return;
      } else {
        setSaveStatus(status === "published" ? "Published successfully." : "");
      }
      if (status === "published") {
        router.push("/profile");
        router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save this post.");
      setSaveStatus("");
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  }

  const buildPostPayload = useCallback((nextStatus: "draft" | "published") => {
    if (!editor) throw new Error("The post editor is not ready.");
    const currentTitle = title.trim();
    let slug = savedSlugRef.current;
    if (currentTitle !== savedTitleRef.current) {
      if (pendingSlugRef.current?.title === currentTitle) {
        slug = pendingSlugRef.current.slug;
      } else {
        slug = createSlug(currentTitle);
        pendingSlugRef.current = { title: currentTitle, slug };
      }
    }
    return {
      author_id: authorId,
      title: currentTitle,
      slug: slug ?? createSlug(currentTitle),
      excerpt: excerpt.trim() || null,
      cover_image_url: coverImageUrl || null,
      body: editor.getHTML(),
      content_type: contentType,
      media_type: mediaType,
      tmdb_id: mediaType === "general" || !tmdbId.trim()
        ? null
        : Number.parseInt(tmdbId, 10),
      status: nextStatus,
      published_at: nextStatus === "published"
        ? (initialPost?.status === "published" ? undefined : new Date().toISOString())
        : null,
    };
  }, [authorId, contentType, coverImageUrl, editor, excerpt, initialPost?.status, mediaType, title, tmdbId]);

  const rememberSavedPost = useCallback((post: { id: string; slug: string }, savedTitle: string) => {
    savedPostIdRef.current = post.id;
    savedSlugRef.current = post.slug;
    savedTitleRef.current = savedTitle;
    pendingSlugRef.current = null;
  }, []);

  const autosaveDraft = useCallback(async () => {
    if (
      !editor ||
      !title.trim() ||
      status !== "draft" ||
      isUploadingImage ||
      saveInFlightRef.current
    ) return;

    const savingRevision = draftRevisionRef.current;
    saveInFlightRef.current = true;
    setIsSaving(true);
    setSaveStatus("Saving draft...");
    setMessage("");

    try {
      const payload = buildPostPayload("draft");
      const result = savedPostIdRef.current
        ? await supabase
          .from("posts")
          .update(payload)
          .eq("id", savedPostIdRef.current)
          .select("id, slug")
          .single()
        : await supabase
          .from("posts")
          .insert(payload)
          .select("id, slug")
          .single();

      if (result.error) {
        blockedAutosaveRevisionRef.current = savingRevision;
        setSaveStatus("Could not auto-save. Your changes are still here; edit again or save manually.");
        setMessage(result.error.message);
        return;
      }

      rememberSavedPost(result.data, payload.title);
      setSavedAt(new Date());
      const changesRemain = draftRevisionRef.current !== savingRevision;
      setIsDirty(changesRemain);
      if (!changesRemain) {
        setSaveStatus("");
      } else {
        setSaveStatus(status === "draft"
          ? "Saving your latest changes..."
          : "Draft saved. Click Publish to publish these changes.");
      }
    } catch (error) {
      blockedAutosaveRevisionRef.current = savingRevision;
      setSaveStatus("Could not auto-save. Your changes are still here; edit again or save manually.");
      setMessage(error instanceof Error ? error.message : "Unexpected autosave error.");
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  }, [buildPostPayload, editor, isUploadingImage, rememberSavedPost, status, supabase, title]);

  useEffect(() => {
    if (
      !isDirty ||
      !editor ||
      !title.trim() ||
      status !== "draft" ||
      isUploadingImage ||
      isSaving ||
      blockedAutosaveRevisionRef.current === draftRevisionRef.current
    ) return;

      const timeoutId = window.setTimeout(() => void autosaveDraft(), 1200);
      return () => window.clearTimeout(timeoutId);
    }, [autosaveDraft, editor, editorRevision, isDirty, isSaving, isUploadingImage, status, title]);

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !editor) {
      return;
    }

    const allowedImageTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ]);

    if (!allowedImageTypes.has(file.type)) {
      setMessage("Choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Choose an image smaller than 5 MB.");
      return;
    }

    setIsUploadingImage(true);
    setMessage("");

    const fileExtension = file.type.split("/")[1].replace("jpeg", "jpg");
    const filePath = `${authorId}/${crypto.randomUUID()}.${fileExtension}`;
    try {
      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(filePath, file, {
          cacheControl: "31536000",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        setMessage(`Unable to upload image: ${uploadError.message}`);
        return;
      }

      const imageUrl = supabase.storage
        .from("post-images")
        .getPublicUrl(filePath)
        .data.publicUrl;
      editor.chain().focus().setImage({ src: imageUrl }).run();
    } catch (error) {
      setMessage(
        `Unable to upload image: ${
          error instanceof Error ? error.message : "Unexpected upload error."
        }`,
      );
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleCoverImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    if (!allowedImageTypes.has(file.type)) {
      setMessage("Choose a JPEG, PNG, WebP, or GIF cover image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Choose a cover image smaller than 5 MB.");
      return;
    }

    setIsUploadingImage(true);
    setMessage("");
    const fileExtension = file.type.split("/")[1].replace("jpeg", "jpg");
    const filePath = `${authorId}/${crypto.randomUUID()}.${fileExtension}`;

    try {
      const { error } = await supabase.storage
        .from("post-images")
        .upload(filePath, file, {
          cacheControl: "31536000",
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        setMessage(`Unable to upload cover image: ${error.message}`);
        return;
      }

      const imageUrl = supabase.storage.from("post-images").getPublicUrl(filePath).data.publicUrl;
      setCoverImageUrl(imageUrl);
      setCoverImageUrlInput(imageUrl);
      markDraftDirty();
    } catch (error) {
      setMessage(`Unable to upload cover image: ${error instanceof Error ? error.message : "Unexpected upload error."}`);
    } finally {
      setIsUploadingImage(false);
    }
  }

  function applyCoverImageUrl() {
    const value = coverImageUrlInput.trim();
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(value);
    } catch {
      setMessage("Enter a valid image URL beginning with https:// or http://.");
      return;
    }

    if (
      !["https:", "http:"].includes(parsedUrl.protocol) ||
      !parsedUrl.hostname ||
      parsedUrl.username ||
      parsedUrl.password
    ) {
      setMessage("Enter a valid image URL beginning with https:// or http://.");
      return;
    }

    setCoverImageUrl(parsedUrl.href);
    setCoverImageUrlInput(parsedUrl.href);
    setMessage("");
    markDraftDirty();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="post-title" className="text-sm font-semibold">Title</label>
        <input
          id="post-title"
          required
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            markDraftDirty();
          }}
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
            onChange={(event) => {
              setMediaType(event.target.value);
              if (event.target.value === "general") setTmdbId("");
              markDraftDirty();
            }}
            className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          >
            <option value="movie">Movie</option>
            <option value="tv">TV Show</option>
            <option value="general">General / Other</option>
            {initialPost?.media_type &&
              !["movie", "tv", "general"].includes(initialPost.media_type) && (
                <option value={initialPost.media_type}>
                  {legacyMediaTypeLabels[initialPost.media_type] ?? initialPost.media_type} (existing post)
                </option>
              )}
          </select>
        </div>
      </div>

      {mediaType !== "general" && (
        <div>
          <label htmlFor="tmdb-id" className="text-sm font-semibold">TMDB ID <span className="font-normal text-text-muted">(optional)</span></label>
          <input id="tmdb-id" type="number" min="1" value={tmdbId} onChange={(event) => {
            setTmdbId(event.target.value);
            markDraftDirty();
          }} placeholder="Link this post to a title" className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
        </div>
      )}

      <div>
        <label htmlFor="post-excerpt" className="text-sm font-semibold">Excerpt <span className="font-normal text-text-muted">(optional)</span></label>
        <textarea id="post-excerpt" value={excerpt} onChange={(event) => {
          setExcerpt(event.target.value);
          markDraftDirty();
        }} placeholder="A short introduction" maxLength={280} rows={3} className="mt-2 w-full resize-y rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
      </div>

      <div>
        <label className="text-sm font-semibold" htmlFor="cover-image">Headline image <span className="font-normal text-text-muted">(optional)</span></label>
        <p className="mt-1 text-xs text-text-muted">Shown on the blog card. Upload an image up to 5 MB, or use an image URL.</p>
        <input
          ref={coverImageInputRef}
          id="cover-image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleCoverImageUpload}
          className="sr-only"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => coverImageInputRef.current?.click()}
            disabled={isUploadingImage}
            className="rounded-xl border border-text-muted/20 bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-50"
          >
            {isUploadingImage ? "Uploading image..." : coverImageUrl ? "Replace headline image" : "Choose headline image"}
          </button>
          {coverImageUrl && (
            <button
              type="button"
              onClick={() => {
                setCoverImageUrl("");
                setCoverImageUrlInput("");
                markDraftDirty();
              }}
              className="text-sm font-semibold text-rose-500 hover:underline"
            >
              Remove image
            </button>
          )}
        </div>
        <div className="mt-4 max-w-xl">
          <label htmlFor="cover-image-url" className="text-sm font-medium">Or use an image URL</label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="cover-image-url"
              type="text"
              inputMode="url"
              autoComplete="url"
              value={coverImageUrlInput}
              onChange={(event) => setCoverImageUrlInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyCoverImageUrl();
                }
              }}
              placeholder="https://example.com/image.jpg"
              className="min-w-0 flex-1 rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
            <button
              type="button"
              onClick={applyCoverImageUrl}
              disabled={!coverImageUrlInput.trim()}
              className="rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-sm font-semibold transition-colors hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use URL
            </button>
          </div>
          <p className="mt-2 text-xs text-text-muted">
            Use a direct image link. External images may stop working if their host removes or blocks them.
          </p>
        </div>
        {coverImageUrl && (
          <img
            src={coverImageUrl}
            alt="Headline image preview"
            className="mt-4 aspect-video w-full max-w-xl rounded-xl border border-text-muted/15 object-cover"
          />
        )}
      </div>

      <div ref={editorSectionRef}>
        <label className="text-sm font-semibold">Body</label>
        {editor && (
          <>
          <div
            ref={toolbarSlotRef}
            className="mt-2"
            style={toolbarPosition ? { height: toolbarHeight } : undefined}
          >
          <div
            ref={toolbarRef}
            className={`flex flex-wrap items-center gap-1 rounded-t-xl border border-b-0 border-text-muted/20 bg-surface/95 p-2 shadow-sm backdrop-blur-sm ${
              toolbarPosition ? "fixed z-[60]" : "relative"
            }`}
            style={toolbarPosition
              ? { top: 72, left: toolbarPosition.left, width: toolbarPosition.width }
              : undefined}
          >
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

            <div role="group" aria-label="Heading level" className="flex shrink-0 items-center gap-1">
              {([1, 2, 3] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  title={`Heading ${level}`}
                  aria-label={`Heading ${level}`}
                  aria-pressed={editor.isActive("heading", { level })}
                  onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
                  className={`min-w-9 rounded border px-2 py-2 text-xs font-bold transition-colors cursor-pointer ${
                    editor.isActive("heading", { level })
                      ? "border-accent bg-accent text-slate-950"
                      : "border-text-muted/10 bg-background text-foreground hover:border-accent/40 hover:text-accent"
                  }`}
                >
                  H{level}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-text-muted/20 mx-1" />

            {/* 🚀 INTEGRATED NATIVE TEXT ALIGNMENT BUTTON CONTROLS */}
            <div role="group" aria-label="Text alignment" className="flex shrink-0 items-center">
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
            </div>

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
            <button
              type="button"
              title="Insert horizontal separator"
              aria-label="Insert horizontal separator"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="rounded border border-text-muted/10 bg-background p-2 text-foreground transition-colors hover:border-accent/40 hover:text-accent"
            >
              <SeparatorHorizontal className="h-4 w-4" />
            </button>

            <div className="h-6 w-px bg-text-muted/20 mx-1" />

            <div role="group" aria-label="Text case" className="flex shrink-0 items-center gap-1">
              {([
                ["uppercase", "AA", "Uppercase"],
                ["capitalize", "Aa", "Capitalize"],
                ["lowercase", "aa", "Lowercase"],
              ] as const).map(([textCase, label, title]) => (
                <button
                  key={textCase}
                  type="button"
                  title={`${title} selected text`}
                  aria-label={`${title} selected text`}
                  disabled={!hasTextSelection}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => transformEditorSelection(editor, textCase)}
                  className="rounded border border-text-muted/10 bg-background px-2 py-2 text-xs font-bold text-foreground transition-colors hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-text-muted/20 mx-1" />

            <div role="group" aria-label="Undo and redo" className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                title="Undo"
                aria-label="Undo"
                disabled={!editor.can().undo()}
                onClick={() => editor.chain().focus().undo().run()}
                className="rounded border border-text-muted/10 bg-background p-2 text-foreground transition-colors hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Redo"
                aria-label="Redo"
                disabled={!editor.can().redo()}
                onClick={() => editor.chain().focus().redo().run()}
                className="rounded border border-text-muted/10 bg-background p-2 text-foreground transition-colors hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </div>

            <div className="h-6 w-px bg-text-muted/20 mx-1" />

{/* 🚀 DEVICE IMAGE UPLOADING UTILITY WITH 5MB PLATFORM LIMIT FILTER */}
<div role="group" aria-label="Insert image" className="flex shrink-0 items-center gap-1">
<input 
  type="file" 
  ref={fileInputRef} 
  accept="image/jpeg,image/png,image/webp,image/gif"
  className="hidden" 
  onChange={handleImageUpload}
/>

{/* Button to trigger the device file browser */}
<button 
  type="button" 
  title={isUploadingImage ? "Uploading image..." : "Upload Image from Device (Max 5MB)"}
  disabled={isUploadingImage}
  onClick={() => fileInputRef.current?.click()} 
  className="p-2 rounded text-sm bg-background border border-text-muted/10 hover:border-accent/40 text-emerald-400 transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-60"
>
  {isUploadingImage ? <span className="text-xs">Uploading...</span> : <ImageIcon className="h-4 w-4" />}
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
            {status === "draft" && (
              <div
                role="status"
                aria-live="polite"
                className={`ml-auto flex shrink-0 items-center gap-2 px-2 text-xs font-medium ${
                  isSaving
                    ? "text-accent"
                    : isDirty
                      ? "text-text-muted"
                      : "text-emerald-500"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${
                    isSaving
                      ? "animate-pulse bg-accent"
                      : isDirty
                        ? "bg-text-muted"
                        : "bg-emerald-500"
                  }`}
                />
                {isSaving
                  ? "Saving…"
                  : isDirty
                    ? "Unsaved changes"
                    : savedAt
                      ? `Saved at ${new Intl.DateTimeFormat(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        }).format(savedAt)}`
                      : "Draft not saved yet"}
              </div>
            )}
              </div>
          </div>

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
        {selectedImage && (
          <section aria-label="Selected image layout" className="mt-4 grid gap-5 rounded-2xl border border-text-muted/15 bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:p-5">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold">Image size and crop</h3>
                <p className="mt-1 text-xs text-text-muted">Drag the image handles to resize it, or adjust its layout here.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold">
                  Display width ({selectedImage.width ?? 640}px)
                  <input
                    type="range"
                    min="100"
                    max="1200"
                    step="10"
                    value={selectedImage.width ?? 640}
                    onChange={(event) => {
                      const width = Number(event.target.value);
                      const oldWidth = selectedImage.width ?? 640;
                      const oldHeight = selectedImage.height ?? 360;
                      updateSelectedImageLayout({
                        width,
                        ...(selectedImage.objectFit === "cover"
                          ? { height: Math.round(oldHeight * width / oldWidth) }
                          : {}),
                      });
                    }}
                    className="mt-2 block w-full accent-accent"
                  />
                </label>
                <label className="text-xs font-semibold">
                  Image fit
                  <select
                    value={selectedImage.objectFit}
                    onChange={(event) => {
                      const objectFit = event.target.value === "cover" ? "cover" : "contain";
                      updateSelectedImageLayout({
                        objectFit,
                        width: selectedImage.width ?? 640,
                        height: selectedImage.height ?? 360,
                      });
                    }}
                    className="mt-2 block w-full rounded-lg border border-text-muted/20 bg-background px-3 py-2 text-sm"
                  >
                    <option value="contain">Fit whole image</option>
                    <option value="cover">Crop to frame</option>
                  </select>
                </label>
              </div>
              {selectedImage.objectFit === "cover" && (
                <div>
                  <p className="text-xs font-semibold">Crop focus</p>
                  <div className="mt-2 grid w-fit grid-cols-3 gap-1" role="group" aria-label="Crop focus">
                    {cropPositions.flat().map((position) => (
                      <button
                        key={position}
                        type="button"
                        aria-label={`Focus ${position}`}
                        aria-pressed={selectedImage.objectPosition === position}
                        onClick={() => updateSelectedImageLayout({ objectPosition: position })}
                        className={`h-8 w-8 rounded border text-xs ${
                          selectedImage.objectPosition === position
                            ? "border-accent bg-accent text-slate-950"
                            : "border-text-muted/20 bg-background hover:border-accent/50"
                        }`}
                      >
                        {position === "center" ? "•" : "·"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-text-muted">Preview</p>
              <div className="flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-text-muted/15 bg-background">
                <img
                  src={selectedImage.src}
                  alt="Selected image crop preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: selectedImage.objectFit,
                    objectPosition: selectedImage.objectPosition,
                  }}
                />
              </div>
            </div>
          </section>
        )}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-text-muted/15 bg-background/50 p-4">
        <label htmlFor="post-status" className="text-sm font-semibold">Save as</label>
        <select id="post-status" value={status} onChange={(event) => {
          const nextStatus = event.target.value as "draft" | "published";
          setStatus(nextStatus);
          markDraftDirty();
          if (nextStatus === "published") {
            setSaveStatus("Publishing requires clicking the Publish post button.");
          }
        }} className="rounded-lg border border-text-muted/20 bg-surface px-3 py-2 text-sm text-foreground">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {saveStatus && <p role="status" className="text-sm text-text-muted">{saveStatus}</p>}
      {message && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm">{message}</p>}
      <button type="submit" disabled={isSaving || isUploadingImage} className="rounded-xl bg-accent px-5 py-3 font-bold text-slate-950 transition-colors hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-60 cursor-pointer">
        {isUploadingImage ? "Uploading image..." : isSaving ? "Saving..." : status === "published" ? "Publish post" : "Save draft"}
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
