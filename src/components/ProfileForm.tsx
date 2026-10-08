"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ProfileForm({
  userId,
  email,
  initialUsername,
  initialDisplayName,
  initialBio,
}: {
  userId: string;
  email: string;
  initialUsername: string;
  initialDisplayName: string;
  initialBio: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        username: username.trim() || null,
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
      })
      .eq("id", userId);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Profile details saved.");
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
        <label htmlFor="display-name" className="text-sm font-semibold">Display Name</label>
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
          onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
          placeholder="choose_a_username"
          minLength={3}
          maxLength={30}
          required
          pattern="^[a-z0-9_-]+$"
          title="Usernames can only contain lowercase letters, numbers, underscores, and dashes."
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
      {message && <p role="status" className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm">{message}</p>}
      <button
        type="submit"
        disabled={isSaving}
        className="rounded-xl bg-accent px-5 py-3 font-bold text-slate-950 transition-colors hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save profile details"}
      </button>
    </form>
  );
}
