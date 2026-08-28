"use client";

import { useState } from "react";

export function CopyAddress({
  address,
  prominent = false,
}: {
  address: string;
  prominent?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={prominent ? "copy-address copy-address--prominent" : "copy-address"}>
      <code>{address}</code>
      <button
        type="button"
        className={prominent ? "dash-inbound__copy-btn" : "home-cta"}
        onClick={async () => {
          await navigator.clipboard.writeText(address);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "Copied" : "Copy address"}
      </button>
    </div>
  );
}
