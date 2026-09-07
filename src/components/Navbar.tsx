"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearchChange(value: string) {
    setQuery(value);

    if (value.trim()) {
      router.push(`/search?q=${encodeURIComponent(value.trim())}`);
    } else {
      router.push("/");
    }
  }

  return (
    <header className="w-full sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold tracking-tight">
        FilmShift
      </Link>

      <div className="ml-6">
        <input
          type="text"
          value={query}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Search movies"
          aria-label="Search movies"
          className="bg-neutral-100 dark:bg-neutral-900 text-foreground border border-neutral-200 dark:border-neutral-800 rounded-full px-4 py-2 w-64 md:w-80 focus:outline-none focus:ring-2 focus:ring-neutral-500"
        />
      </div>
    </header>
  );
}
