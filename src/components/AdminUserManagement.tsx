"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { AdminManagedUser } from "@/types/admin";

const banOptions = [
  { value: "24h", label: "24 hours" },
  { value: "168h", label: "7 days" },
  { value: "720h", label: "30 days" },
  { value: "876000h", label: "Permanent" },
];

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getActiveBanExpiry(user: AdminManagedUser) {
  if (!user.bannedUntil) return null;
  const expiresAt = Date.parse(user.bannedUntil);
  return Number.isFinite(expiresAt) && expiresAt > Date.now() ? user.bannedUntil : null;
}

export default function AdminUserManagement({
  initialUsers,
}: {
  initialUsers: AdminManagedUser[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [durations, setDurations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [workingUserId, setWorkingUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const result = await response.json() as { users?: AdminManagedUser[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to load member accounts.");
      if (!Array.isArray(result.users)) throw new Error("The member response was not valid.");
      setErrorMessage("");
      setUsers(result.users);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load member accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      user.email?.toLocaleLowerCase().includes(query) ||
      user.username?.toLocaleLowerCase().includes(query) ||
      user.displayName?.toLocaleLowerCase().includes(query) ||
      user.posts.some((post) => post.title.toLocaleLowerCase().includes(query)),
    );
  }, [search, users]);

  async function updateBan(user: AdminManagedUser) {
    const selectedDuration = durations[user.id] ?? "24h";
    const isLiftingBan = Boolean(getActiveBanExpiry(user)) && selectedDuration === "none";
    const duration = isLiftingBan || selectedDuration !== "none" ? selectedDuration : "24h";
    const confirmation = isLiftingBan
      ? `Lift the active ban on ${user.email ?? user.username ?? "this account"}?`
      : `Ban ${user.email ?? user.username ?? "this account"} for ${banOptions.find((option) => option.value === duration)?.label.toLowerCase()}?`;
    if (!window.confirm(confirmation)) return;

    setWorkingUserId(user.id);
    setErrorMessage("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, duration }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to update the account ban.");
      setMessage(isLiftingBan ? "Ban lifted." : "Account ban updated.");
      setDurations((current) => {
        const next = { ...current };
        delete next[user.id];
        return next;
      });
      setLoading(true);
      await loadUsers();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update the account ban.");
    } finally {
      setWorkingUserId(null);
    }
  }

  async function deleteAccount(user: AdminManagedUser) {
    const accountName = user.email ?? user.username ?? "this account";
    if (!window.confirm(
      `Permanently delete ${accountName} and all their posts, comments, likes, and notifications? This cannot be undone.`,
    )) return;

    setWorkingUserId(user.id);
    setErrorMessage("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to delete the account.");
      setUsers((current) => current.filter(({ id }) => id !== user.id));
      setMessage("Account and associated content deleted.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete the account.");
    } finally {
      setWorkingUserId(null);
    }
  }

  return (
    <section className="mx-auto mt-8 max-w-5xl rounded-3xl border border-text-muted/15 bg-surface p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Member management</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-text-muted">
            Review member accounts and their posts, apply temporary or permanent bans, or permanently remove accounts and their community content. Admin accounts are protected from these actions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void loadUsers();
          }}
          disabled={loading}
          className="rounded-lg border border-text-muted/20 px-3 py-2 text-xs font-bold text-text-muted transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <label className="mt-5 block text-sm font-semibold">
        Find a member or post
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search email, username, display name, or post title"
          className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-sm text-foreground"
        />
      </label>

      {errorMessage && <p role="alert" className="mt-4 text-sm text-rose-600 dark:text-rose-400">{errorMessage}</p>}
      {message && <p role="status" className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
      {loading ? (
        <p role="status" className="mt-6 text-center text-sm text-text-muted">Loading member accounts...</p>
      ) : filteredUsers.length ? (
        <ul className="mt-5 space-y-4">
          {filteredUsers.map((user) => {
            const activeBanExpiry = getActiveBanExpiry(user);
            const isAdmin = user.role === "admin";
            const displayName = user.displayName || user.username || "Unnamed member";
            return (
              <li key={user.id} className="rounded-2xl border border-text-muted/15 bg-background/60 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words font-bold">{displayName}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isAdmin ? "bg-accent/15 text-trending-text" : "bg-text-muted/10 text-text-muted"
                      }`}>
                        {isAdmin ? "Admin" : "Member"}
                      </span>
                      {activeBanExpiry && (
                        <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                          Banned until {formatDate(activeBanExpiry)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 break-all text-sm text-text-muted">{user.email || "No email available"}</p>
                    {user.username && <p className="mt-1 text-xs text-text-muted">@{user.username}</p>}
                    <p className="mt-2 text-xs text-text-muted">
                      Joined {formatDate(user.createdAt)} · Last sign-in {formatDate(user.lastSignInAt)}
                    </p>
                  </div>
                  <details className="shrink-0">
                    <summary className="cursor-pointer rounded-lg border border-text-muted/20 px-3 py-2 text-xs font-semibold text-text-muted transition-colors hover:border-accent/50 hover:text-accent">
                      Posts ({user.posts.length})
                    </summary>
                    <ul className="mt-2 max-h-64 min-w-64 space-y-2 overflow-y-auto rounded-xl border border-text-muted/15 bg-surface p-3">
                      {user.posts.length ? user.posts.map((post) => (
                        <li key={post.id} className="border-b border-text-muted/10 pb-2 last:border-0 last:pb-0">
                          {post.status === "published" ? (
                                <Link className="text-sm font-semibold hover:text-accent" href={`/blog/${encodeURIComponent(post.slug)}`}>
                              {post.title}
                                </Link>
                          ) : (
                            <p className="text-sm font-semibold">{post.title}</p>
                          )}
                          <p className="mt-1 text-xs capitalize text-text-muted">
                            {post.status} · Updated {formatDate(post.updated_at)}
                          </p>
                        </li>
                      )) : <li className="text-xs text-text-muted">No posts.</li>}
                    </ul>
                  </details>
                </div>

                {!isAdmin && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-text-muted/10 pt-4">
                    <label className="sr-only" htmlFor={`ban-duration-${user.id}`}>Ban duration for {displayName}</label>
                    <select
                      id={`ban-duration-${user.id}`}
                      value={activeBanExpiry && durations[user.id] === "none"
                        ? "none"
                        : durations[user.id] === "none"
                          ? "24h"
                          : durations[user.id] ?? "24h"}
                      onChange={(event) => setDurations((current) => ({ ...current, [user.id]: event.target.value }))}
                      disabled={workingUserId !== null}
                      className="rounded-lg border border-text-muted/20 bg-surface px-3 py-2 text-xs text-foreground"
                    >
                      {activeBanExpiry && <option value="none">Lift active ban</option>}
                      {banOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => void updateBan(user)}
                      disabled={workingUserId !== null}
                      className="rounded-lg border border-amber-500/30 px-3 py-2 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-500/10 disabled:cursor-wait disabled:opacity-50 dark:text-amber-300"
                    >
                      {workingUserId === user.id ? "Working..." : durations[user.id] === "none" && activeBanExpiry ? "Lift ban" : "Apply ban"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteAccount(user)}
                      disabled={workingUserId !== null}
                      className="ml-auto rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-500/10 disabled:cursor-wait disabled:opacity-50 dark:text-rose-400"
                    >
                      Delete account
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-text-muted/20 p-5 text-center text-sm text-text-muted">
          {users.length ? "No members match your search." : "No member accounts found."}
        </p>
      )}
    </section>
  );
}
