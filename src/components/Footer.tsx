import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full border-t border-text-muted/10 bg-surface/40 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8 md:flex md:items-center md:justify-between lg:px-12">
        
        {/* Brand Left Anchor */}
        <div className="flex justify-center md:order-2 gap-6 text-sm font-semibold text-text-muted">
          <Link href="/movies" className="hover:text-accent transition-colors">Movies</Link>
          <Link href="/tv" className="hover:text-accent transition-colors">Series</Link>
          <Link href="/blog" className="hover:text-accent transition-colors">Blog</Link>
          <a 
            href="https://themoviedb.org" 
            target="_blank" 
            rel="noreferrer" 
            className="hover:text-accent transition-colors text-xs opacity-75 font-normal"
          >
            TMDB API
          </a>
        </div>

        {/* Copyright Attribution Right Anchor */}
        <div className="mt-4 md:order-1 md:mt-0 text-center md:text-left">
          <p className="text-xs text-text-muted">
            &copy; {currentYear} <span className="font-black tracking-tight text-foreground">Film<span className="text-accent">Shift</span></span>. Developed as a modern cinema curation layout.
          </p>
          <p className="mt-1 text-[10px] text-text-muted/60">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>

      </div>
    </footer>
  );
}
