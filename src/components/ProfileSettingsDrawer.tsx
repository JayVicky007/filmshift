"use client"; // 🚀 Safe client-side boundary isolated here

import { useState } from "react";
import { ChevronDown, Settings } from "lucide-react";
import ProfileForm from "@/components/ProfileForm";

interface ProfileSettingsDrawerProps {
  userId: string;
  email: string;
  profile: {
    username: string | null;
    display_name: string | null;
    bio: string | null;
  } | null;
}

export default function ProfileSettingsDrawer({ userId, email, profile }: ProfileSettingsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="rounded-3xl border border-text-muted/15 bg-surface overflow-hidden transition-all duration-300">
      {/* 🛠️ Dropdown Header Toggle Button Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left font-semibold text-sm text-foreground hover:bg-background/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <Settings className={`h-4 w-4 text-accent ${isOpen ? 'animate-spin' : ''}`} />
          <div>
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Account Preferences
            </span>
            <span className="text-xs font-normal text-text-muted">
              {isOpen ? "Close profile management canvas" : "Update your name, username, or bio"}
            </span>
          </div>
        </div>
        <ChevronDown 
          className={`h-5 w-5 text-text-muted transition-transform duration-300 ${isOpen ? "rotate-180 text-accent" : ""}`} 
        />
      </button>

      {/* 🔐 Slidable form tray container drawer */}
      {isOpen && (
        <div className="border-t border-text-muted/10 p-6 sm:p-8 bg-background/10 animate-search-placeholder">
          <ProfileForm 
            userId={userId}
            email={email}
            initialUsername={profile?.username ?? ""}
            initialDisplayName={profile?.display_name ?? ""}
            initialBio={profile?.bio ?? ""}
          />
        </div>
      )}
    </section>
  );
}
