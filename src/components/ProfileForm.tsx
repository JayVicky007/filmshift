"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ProfileForm({
  userId,
  email,
  initialUsername,
  initialDisplayName,
  initialAvatarUrl,
  initialBio,
}: {
  userId: string;
  email: string;
  initialUsername: string;
  initialDisplayName: string;
  initialAvatarUrl: string;
  initialBio: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [bio, setBio] = useState(initialBio);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(initialAvatarUrl);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Please choose an image smaller than 5 MB.");
      return;
    }

    setMessage("");
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    let nextAvatarUrl = avatarUrl.trim() || null;

    if (avatarFile) {
      const fileExtension = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${userId}/${crypto.randomUUID()}.${fileExtension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, {
          cacheControl: "3600",
          contentType: avatarFile.type,
          upsert: false,
        });

      if (uploadError) {
        setMessage(uploadError.message);
        setIsSaving(false);
        return;
      }

      nextAvatarUrl = supabase.storage.from("avatars").getPublicUrl(filePath).data.publicUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        username: username.trim() || null,
        display_name: displayName.trim() || null,
        avatar_url: nextAvatarUrl,
        bio: bio.trim() || null,
      })
      .eq("id", userId);

    if (error) {
      setMessage(error.message);
    } else {
      setAvatarUrl(nextAvatarUrl ?? "");
      setAvatarFile(null);
      setMessage("Profile saved.");
      router.refresh();
    }

    setIsSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="profile-email" className="text-sm font-semibold">Email</label>
        <input
          id="profile-email"
          value={email}
          readOnly
          className="mt-2 w-full rounded-xl border border-text-muted/15 bg-background/60 px-4 py-3 text-text-muted"
        />
      </div>
      <div>
        <label htmlFor="display-name" className="text-sm font-semibold">Display name</label>
        <input
          id="display-name"
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="How should people see you?"
          maxLength={60}
          className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>
      <div>
        <label htmlFor="username" className="text-sm font-semibold">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Choose a username"
          maxLength={30}
          className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>
      <div>
        <label htmlFor="bio" className="text-sm font-semibold">Bio</label>
        <textarea
          id="bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="Tell the FilmShift community a little about yourself."
          maxLength={280}
          rows={4}
          className="mt-2 w-full resize-y rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>
      <div>
        <label htmlFor="avatar-file" className="text-sm font-semibold">Profile image</label>
        <div className="mt-2 flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-text-muted/20 bg-background text-sm text-text-muted">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile preview" className="h-full w-full object-cover" />
            ) : (
              "No image"
            )}
          </div>
          <input
            id="avatar-file"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="min-w-0 flex-1 text-sm text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:font-semibold file:text-slate-950 hover:file:bg-yellow-300"
          />
        </div>
      </div>
      <div>
        <label htmlFor="avatar-url" className="text-sm font-semibold">Avatar URL</label>
        <input
          id="avatar-url"
          type="url"
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          placeholder="https://..."
          className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>
      {message && (
        <p role="status" className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={isSaving}
        className="rounded-xl bg-accent px-5 py-3 font-bold text-slate-950 transition-colors hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
