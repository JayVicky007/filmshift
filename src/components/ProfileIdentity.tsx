"use client";

import Image from "next/image";
import { ChangeEvent, useRef, useState } from "react";
import { Camera, ImagePlus, Link2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type ImageField = "avatar_url" | "cover_image_url";
type ImageKind = "avatar" | "cover";

interface ProfileIdentityProps {
  displayName: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  userId?: string;
}

function getOwnedImagePath(imageUrl: string, userId: string, bucket: string): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  try {
    const image = new URL(imageUrl);
    const prefix = `/storage/v1/object/public/${bucket}/${userId}/`;
    if (image.origin !== new URL(supabaseUrl).origin || !image.pathname.startsWith(prefix)) return null;
    const fileName = decodeURIComponent(image.pathname.slice(prefix.length));
    return fileName && !fileName.includes("/") ? `${userId}/${fileName}` : null;
  } catch {
    return null;
  }
}

export default function ProfileIdentity({
  displayName,
  username,
  bio,
  avatarUrl,
  coverImageUrl,
  userId,
}: ProfileIdentityProps) {
  const router = useRouter();
  const supabase = createClient();
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  const [currentCoverUrl, setCurrentCoverUrl] = useState(coverImageUrl);
  const [editing, setEditing] = useState<ImageKind | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function startEditing(kind: ImageKind) {
    setEditing(kind);
    setImageUrlInput(kind === "avatar" ? currentAvatarUrl ?? "" : currentCoverUrl ?? "");
    setMessage("");
  }

  async function saveImage(kind: ImageKind, value: string | null, file?: File) {
    if (!userId) return;
    setIsSaving(true);
    setMessage("");

    const bucket = kind === "avatar" ? "avatars" : "profile-covers";
    const field: ImageField = kind === "avatar" ? "avatar_url" : "cover_image_url";
    const previousUrl = kind === "avatar" ? currentAvatarUrl : currentCoverUrl;
    let nextUrl = value;
    let uploadedPath: string | null = null;

    if (file) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      uploadedPath = `${userId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(uploadedPath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) {
        setMessage(uploadError.message);
        setIsSaving(false);
        return;
      }
      nextUrl = supabase.storage.from(bucket).getPublicUrl(uploadedPath).data.publicUrl;
    }

    const { error } = await supabase.from("profiles").update({ [field]: nextUrl }).eq("id", userId);
    if (error) {
      let errorMessage = error.message;
      if (uploadedPath) {
        const { error: cleanupError } = await supabase.storage.from(bucket).remove([uploadedPath]);
        if (cleanupError) errorMessage += ` The new image could not be cleaned up: ${cleanupError.message}`;
      }
      setMessage(errorMessage);
      setIsSaving(false);
      return;
    }

    const previousPath = previousUrl ? getOwnedImagePath(previousUrl, userId, bucket) : null;
    const nextPath = nextUrl ? getOwnedImagePath(nextUrl, userId, bucket) : null;
    let successMessage = "Image updated.";
    if (previousPath && previousPath !== nextPath) {
      const { error: cleanupError } = await supabase.storage.from(bucket).remove([previousPath]);
      if (cleanupError) successMessage += ` The previous image could not be deleted: ${cleanupError.message}`;
    }

    if (kind === "avatar") setCurrentAvatarUrl(nextUrl);
    else setCurrentCoverUrl(nextUrl);
    setEditing(null);
    setMessage(successMessage);
    setIsSaving(false);
    router.refresh();
  }

  function handleFileChange(kind: ImageKind, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setMessage("Choose a JPEG, PNG, WebP, or GIF image.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Choose an image smaller than 5 MB.");
      event.target.value = "";
      return;
    }
    void saveImage(kind, null, file);
    event.target.value = "";
  }

  function handleUrlSave() {
    if (!editing) return;

    const value = imageUrlInput.trim();
    if (value) {
      try {
        const parsed = new URL(value);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error();
      } catch {
        setMessage("Enter a valid image URL beginning with http:// or https://.");
        return;
      }
    }
    void saveImage(editing, value || null);
  }

  const editorTitle = editing === "avatar" ? "Profile photo" : "Cover image";

  return (
    <>
      <header className="relative overflow-hidden rounded-3xl border border-text-muted/15 bg-surface">
        <div className="relative z-0 h-36 bg-gradient-to-r from-accent/30 via-accent/10 to-background sm:h-52">
          {currentCoverUrl && (
            <Image
              src={currentCoverUrl}
              alt=""
              fill
              sizes="100vw"
              loading="eager"
              unoptimized
              className="pointer-events-none object-cover"
            />
          )}
        </div>
        {userId && (
          <>
            <button
              type="button"
              onClick={() => startEditing("cover")}
              aria-label="Change cover image"
              className="absolute right-3 top-3 z-30 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/70 text-white shadow transition-colors hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
            <input
              ref={coverFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(event) => handleFileChange("cover", event)}
              aria-label="Upload cover image"
            />
          </>
        )}
        <div className="relative z-10 px-5 pb-6 sm:px-8">
          <div className="relative z-10 -mt-12 flex h-24 w-24 items-center justify-center overflow-visible rounded-full border-4 border-surface bg-accent/20 text-3xl font-bold text-accent sm:-mt-16 sm:h-32 sm:w-32 sm:text-4xl">
            <div className="h-full w-full overflow-hidden rounded-full">
              {currentAvatarUrl ? (
                <Image src={currentAvatarUrl} alt="" width={128} height={128} unoptimized className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">{displayName.charAt(0).toUpperCase()}</div>
              )}
            </div>
            {userId && (
              <>
                <button
                  type="button"
                  onClick={() => startEditing("avatar")}
                  aria-label="Change profile photo"
                  className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-surface bg-accent text-slate-950 shadow transition-colors hover:bg-yellow-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={avatarFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(event) => handleFileChange("avatar", event)}
                  aria-label="Upload profile photo"
                />
              </>
            )}
          </div>
          <div className="mt-3 min-w-0">
            <h1 className="break-words text-2xl font-black tracking-tight sm:text-3xl">{displayName}</h1>
            <p className="mt-1 break-all text-sm text-text-muted">@{username}</p>
            {bio && <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{bio}</p>}
          </div>
          {!editing && message && <p role="status" className="mt-3 text-sm text-text-muted">{message}</p>}
        </div>
      </header>
      {editing && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSaving) {
              setEditing(null);
              setMessage("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-image-dialog-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-text-muted/20 bg-surface p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="profile-image-dialog-title" className="text-lg font-bold">{editorTitle}</h2>
              <button
                type="button"
                onClick={() => { setEditing(null); setMessage(""); }}
                disabled={isSaving}
                aria-label="Close image editor"
                className="rounded-full p-2 text-text-muted transition-colors hover:bg-background hover:text-foreground disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => (editing === "avatar" ? avatarFileRef : coverFileRef).current?.click()}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-yellow-300 disabled:opacity-60"
              >
                <ImagePlus className="h-4 w-4" />
                Upload from device
              </button>
              <span className="text-xs text-text-muted">JPEG, PNG, WebP, or GIF · up to 5 MB</span>
            </div>
            <div className="mt-5">
              <label htmlFor={`profile-image-url-${editing}`} className="text-sm font-medium">Or use an image link</label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    id={`profile-image-url-${editing}`}
                    type="url"
                    value={imageUrlInput}
                    onChange={(event) => setImageUrlInput(event.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full rounded-lg border border-text-muted/20 bg-background py-2.5 pl-10 pr-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUrlSave}
                  disabled={isSaving}
                  className="rounded-lg border border-text-muted/20 px-4 py-2.5 text-sm font-semibold hover:border-accent disabled:opacity-60"
                >
                  Save link
                </button>
              </div>
            </div>
            {(editing === "avatar" ? currentAvatarUrl : currentCoverUrl) && (
              <button
                type="button"
                onClick={() => void saveImage(editing, null)}
                disabled={isSaving}
                className="mt-4 rounded-lg px-1 py-2 text-sm font-semibold text-rose-500 hover:text-rose-400 disabled:opacity-60"
              >
                Remove {editing === "avatar" ? "profile photo" : "cover image"}
              </button>
            )}
            {message && <p role="status" className="mt-4 text-sm text-rose-500">{message}</p>}
            {isSaving && <p role="status" className="mt-4 text-sm text-text-muted">Saving image…</p>}
          </section>
        </div>
      )}
    </>
  );
}
