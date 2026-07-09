import { useState } from "react";

interface ShareLinkProps {
  roomId: string;
}

export function ShareLink({ roomId }: ShareLinkProps) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${roomId}`
      : `/room/${roomId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. non-secure context): fall back to
      // selecting the text so the user can copy manually.
      setCopied(false);
    }
  };

  return (
    <div className="flex items-stretch gap-2 w-full max-w-md">
      <a
        href={url}
        onClick={(e) => e.preventDefault()}
        className="flex-1 min-w-0 truncate bg-slate-800 text-slate-200 rounded-lg px-4 py-2 text-sm font-mono border border-slate-700"
        title={url}
      >
        {url}
      </a>
      <button
        onClick={handleCopy}
        className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
