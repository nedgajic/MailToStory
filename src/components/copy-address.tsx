"use client";

import { useState } from "react";

export function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="copy-address">
      <code>{address}</code>
      <button
        type="button"
        className="home-cta"
        onClick={async () => {
          await navigator.clipboard.writeText(address);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
