# FilmShift

**FilmShift is a home for people who love movies and TV.**
Discover what to watch, explore films and series, and share thoughtful reviews and articles with a community of fellow fans.

## What you can do

- **Explore movies and TV** with trending, popular, top-rated, and coming-soon collections.
- **Search for titles** and browse curated collections by genre and region.
- **Dive into details** including trailers and official videos, cast and crew, ratings, recommendations, and related titles from prominent creators or leading cast members.
- **Write and publish** reviews or general articles with a rich-text editor.
- **Save drafts as you write.** The editor shows whether your draft is saving, has unsaved changes, or when it was last saved. You can also save manually and keep editing.
- **Make posts your own** with headline images, uploaded or linked images, image resizing and cropping, text formatting, and horizontal separators.
- **Join the conversation** with paginated journal posts, post and comment likes, threaded comment replies, mentions, notifications, and comment reporting.
- **Personalize your profile** with a cover image and avatar. Change either directly from your profile by uploading an image or providing an image link; public profiles display your images, name, username, and bio. Your profile workspace keeps published posts and private drafts organized separately.
- **Manage the community** with an administrator account: use separate, admin-only sections to correct post media metadata with an audit trail and author notification, pin important posts, and review comment reports.
- **Use light or dark theme** across the site.

## Built with

- [Next.js](https://nextjs.org/) App Router and [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) for authentication, PostgreSQL, Row Level Security, and image storage
- [TMDB](https://www.themoviedb.org/) for movie and TV information
- [Tiptap](https://tiptap.dev/) for the post editor

## Get started

### Requirements

- Node.js **20.9 or later**
- npm
- A Supabase project
- A TMDB API key

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
NEXT_PUBLIC_TMDB_API_KEY=your-tmdb-api-key

# Optional: OMDb adds IMDb ratings to supported title pages
NEXT_PUBLIC_OMDB_API_KEY=

# Optional API base URLs (the app has defaults)
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
NEXT_PUBLIC_OMDB_BASE_URL=https://www.omdbapi.com
```

Use the Supabase project URL and **publishable/anon key**, never a service-role key in the browser app. Variables prefixed with `NEXT_PUBLIC_` are included in client-side code; only put values there that are meant to be public. Keep `.env.local` out of Git.

### 3. Set up the database

The versioned Supabase SQL migrations are in [`supabase/migrations`](./supabase/migrations). They create the blog schema, security policies, storage buckets, comments and comment/post likes, threaded replies, notifications, post cover images, profile cover images, post pinning, and audited admin metadata corrections.

To apply migrations to a **new Supabase project**, install or run the Supabase CLI, authenticate, link the project, and push the migrations:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

For the existing FilmShift Supabase project, the migration history has already been reconciled. Check it with `npx supabase migration list` before pushing; do not manually rerun migration SQL in the SQL Editor. Configure Supabase Auth’s site URL and redirect URLs for your local and deployed app as well.

To grant administrator access, promote the intended user’s profile role to `admin` from the Supabase dashboard or SQL Editor. Do this only for trusted accounts.

### 4. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Useful commands

```bash
npm run dev     # Start the development server
npm run lint    # Run ESLint
npx tsc --noEmit # Check TypeScript types
npm run build   # Create a production build
npm run start   # Serve the production build
```

## Project layout

```text
src/
  app/          Pages, layouts, and API routes
  components/   Shared interface and feature components
  utils/        Supabase clients, movie data, blog services, and helpers
supabase/
  migrations/   Versioned database schema and policy changes
public/         Static assets
```

## Deployment

FilmShift uses server-rendered routes and Supabase-backed features, so deploy it to a platform that supports a Node.js Next.js application. Set the required environment variables in the hosting provider, configure the Supabase Auth URLs for the production domain, and run the production build:

```bash
npm run build
npm run start
```

Before deploying database changes, review the migration status and apply pending migrations to the intended Supabase project.

## Data and attribution

Movie and television metadata is provided by [TMDB](https://www.themoviedb.org/). FilmShift is not endorsed or certified by TMDB. Some pages can also display IMDb ratings sourced through OMDb when an OMDb API key is configured.

## Contributing

Bug reports, ideas, and improvements are welcome. Please open an issue or pull request with a clear description of the change.
