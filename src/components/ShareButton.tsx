"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface ShareButtonProps {
  title: string;
  url: string;
}

export default function ShareButton({ title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: window.location.href,
        });
        return;
      } catch (e) {
        // User cancelled or share failed, fall back to copy
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 text-sm text-[#737373] hover:text-accent transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-accent" />
          <span className="text-accent">已复制</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          <span>分享文章</span>
        </>
      )}
    </button>
  );
}