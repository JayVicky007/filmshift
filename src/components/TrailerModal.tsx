"use client";

import { useState } from "react";
import { Play } from "lucide-react";

interface TrailerModalProps {
  trailerKey: string;
  videoTitle: string;
}

export default function TrailerModal({ trailerKey, videoTitle }: TrailerModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button - Balanced flex layout alignment */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-4 h-14 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
      >
        <Play className="w-5 h-5 fill-current" />
        <span>Watch Trailer</span>
      </button>

{/* Theater Modal Layer - Increased to backdrop-blur-md for a deep cinematic blur */}
{isOpen && (
  <div 
    className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 z-100 transition-all duration-200"
    onClick={() => setIsOpen(false)}
  >
    {/* Sizing Container to replicate your screenshot layout */}
    <div 
      className="w-full max-w-5xl flex flex-col items-end animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Minimalist Close Text Button positioned right above the video */}
      <button 
        onClick={() => setIsOpen(false)}
        className="text-zinc-300 hover:text-white text-sm font-medium tracking-wide uppercase mb-2 px-2 py-1 transition-colors cursor-pointer"
      >
        Close
      </button>

      {/* Sharp, clean edge YouTube Frame Panel */}
      <div className="w-full aspect-video bg-black shadow-2xl border border-zinc-900 rounded-sm overflow-hidden">
        <iframe
          src={"https://youtube.com" + trailerKey}
          title={`${videoTitle} Trailer`}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  </div>
)}
    </>
  );
}
