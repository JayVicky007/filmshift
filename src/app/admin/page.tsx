import Link from "next/link";

const adminSections = [
  {
    href: "/admin/users",
    title: "Member management",
    description: "Review member accounts and posts, apply time-limited or permanent bans, and delete accounts when necessary.",
    action: "Manage members",
  },
  {
    href: "/admin/posts",
    title: "Manage posts",
    description: "Review published posts and drafts, and remove content that should no longer be on FilmShift.",
    action: "Manage posts",
  },
  {
    href: "/admin/corrections",
    title: "Post metadata corrections",
    description: "Correct a post’s media type or linked TMDB title, with an audit trail and author notification.",
    action: "Open corrections",
  },
  {
    href: "/admin/pins",
    title: "Pinned Journal posts",
    description: "Choose which published posts appear first on The Journal.",
    action: "Manage pinned posts",
  },
  {
    href: "/admin/reports",
    title: "Comment reports",
    description: "Review member reports and dismiss them or remove comments that violate community rules.",
    action: "Review reports",
  },
];

export default function AdminPage() {
  return (
    <section aria-label="Admin workspaces">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminSections.map((section) => (
          <article
            key={section.href}
            className="flex flex-col rounded-2xl border border-text-muted/15 bg-surface p-5 sm:p-6"
          >
            <h2 className="text-lg font-bold">{section.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-text-muted">{section.description}</p>
            <Link
              href={section.href}
              className="mt-5 inline-flex w-fit items-center rounded-lg bg-accent px-3 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-yellow-300"
            >
              {section.action}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
