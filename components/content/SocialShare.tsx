"use client";

import { useState } from "react";
import { Link2, Check, Mail } from "lucide-react";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const btnClass =
  "inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 text-foreground transition-colors";

export function SocialShare({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleTwitter() {
    const params = new URLSearchParams({ url, text: title });
    window.open(
      `https://twitter.com/intent/tweet?${params.toString()}`,
      "_blank",
      "noopener,noreferrer,width=550,height=420"
    );
  }

  function handleEmail() {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`Check this out: ${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleTwitter}
        className={btnClass}
        aria-label="Share on X / Twitter"
        title="Share on X"
      >
        <XIcon className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={handleEmail}
        className={btnClass}
        aria-label="Share via email"
        title="Share via email"
      >
        <Mail className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={handleCopy}
        className={btnClass}
        aria-label="Copy link"
        title="Copy link"
      >
        {copied ? (
          <Check className="w-4 h-4 text-primary" />
        ) : (
          <Link2 className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
