"use client";

import Link from "next/link";

export function HeldMailBanner({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <div className="dash-banner dash-banner--held" role="alert">
      <div className="dash-banner__copy">
        <p className="dash-banner__title">Held mail waiting for approval</p>
        <p className="dash-banner__text">
          {count} message{count === 1 ? "" : "s"} arrived from an unverified
          forwarding address. Approve the sender to generate stories.
        </p>
      </div>
      <Link href="/settings/email#forwarding" className="dash-banner__btn">
        Review held mail
      </Link>
    </div>
  );
}
