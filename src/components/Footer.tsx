import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full border-t border-text-muted/15 bg-surface/70">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-14 lg:px-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link href="/" className="text-2xl font-black tracking-tight text-foreground transition-colors hover:text-accent">
              Film<span className="text-accent">Shift</span>
            </Link>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              Discover your next favorite. Explore films and series, then share what you think with the community.
            </p>
          </div>

          <nav aria-label="Explore FilmShift">
            <h2 className="text-sm font-bold text-foreground">Explore</h2>
            <ul className="mt-4 space-y-3 text-sm text-text-muted">
              <li><Link href="/movies" className="transition-colors hover:text-accent">Movies</Link></li>
              <li><Link href="/tv" className="transition-colors hover:text-accent">TV series</Link></li>
              <li><Link href="/search" className="transition-colors hover:text-accent">Search</Link></li>
            </ul>
          </nav>

          <nav aria-label="FilmShift community">
            <h2 className="text-sm font-bold text-foreground">Community</h2>
            <ul className="mt-4 space-y-3 text-sm text-text-muted">
              <li><Link href="/blog" className="transition-colors hover:text-accent">Reviews & articles</Link></li>
              <li>
                <a
                  href="https://www.themoviedb.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-accent"
                >
                  The Movie Database
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-text-muted/15 pt-5 text-xs leading-5 text-text-muted">
          <p>&copy; {currentYear} FilmShift. All rights reserved.</p>
          <p className="mt-1 text-text-muted/75">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}
