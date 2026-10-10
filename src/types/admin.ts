export type AdminManagedPost = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  updated_at: string;
};

export type AdminManagedUser = {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  bannedUntil: string | null;
  username: string | null;
  displayName: string | null;
  role: string;
  posts: AdminManagedPost[];
};
