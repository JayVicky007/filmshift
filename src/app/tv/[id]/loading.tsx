import React from "react";

export default function DetailsLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-background text-foreground animate-pulse">
      {/* Hero Header Frame Backdrop Silhouette */}
      <section className="relative h-[65vh] w-full border-b border-text-muted/15 bg-surface/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 pt-8 sm:px-8 md:flex-row md:items-start md:gap-10 md:px-10 md:pt-14 lg:gap-12 lg:px-12">
          
          {/* Poster placeholder block */}
          <div className="aspect-[2/3] w-full max-w-[350px] shrink-0 rounded-[28px] bg-text-muted/10" />

          {/* Core titles placeholders */}
          <div className="flex-1 space-y-4 pt-4">
            <div className="h-4 w-44 rounded bg-text-muted/20" />
            <div className="h-12 w-3/4 rounded-xl bg-text-muted/10" />
            <div className="h-5 w-1/2 rounded bg-text-muted/10" />
            <div className="h-14 w-64 rounded-2xl bg-text-muted/20 mt-8" />
            <div className="h-24 w-full rounded-xl bg-text-muted/10 mt-6" />
          </div>
          
        </div>
      </section>

      {/* Cast list loading row context blocks */}
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 space-y-6">
        <div className="h-8 w-48 rounded bg-text-muted/20" />
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center gap-3">
              <div className="aspect-square w-full max-w-32 rounded-full bg-text-muted/10" />
              <div className="h-4 w-20 rounded bg-text-muted/10" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
