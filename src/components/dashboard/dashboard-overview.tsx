"use client";

import Link from "next/link";
import type { PlanId } from "@/lib/billing/plans";
import { BRAND_NAME } from "@/lib/brand";
import { CopyAddress } from "@/components/copy-address";
import { ResendVerifyButton } from "@/components/dashboard/resend-verify";

export type DashboardOverviewProps = {
  firstName: string | null;
  verified: boolean;
  used: number;
  limit: number | null;
  planName: string;
  seatsUsed: number;
  seatQuantity: number;
  inbound: string;
  plan: PlanId;
};

export function DashboardOverview({
  firstName,
  verified,
  used,
  limit,
  planName,
  seatsUsed,
  seatQuantity,
  inbound,
  plan,
}: DashboardOverviewProps) {
  return (
    <>
      <header className="dash__header dash__header--compact">
        <h1 className="dash__title">
          Welcome{firstName ? `, ${firstName}` : ""}
        </h1>
        <span className={`dash__plan-badge dash__plan-badge--${plan}`}>{planName}</span>
      </header>

      {!verified ? <ResendVerifyButton /> : null}

      <section className="dash-inbound">
        <p className="dash-inbound__eyebrow">Your private address</p>
        <h2 className="dash-inbound__title">Forward threads here</h2>
        <p className="dash-inbound__lede">
          Forward any email thread to this address from whatever mail app or provider
          you use. {BRAND_NAME} turns it into a readable story with timeline and open
          actions.
        </p>
        <CopyAddress address={inbound} prominent />
      </section>

      <section className="dash-stats dash-stats--compact">
        <article className="dash-stat">
          <span className="dash-stat__value">
            {used}
            {limit != null ? ` / ${limit}` : ""}
          </span>
          <span className="dash-stat__label">Stories this month</span>
        </article>
        <article className="dash-stat">
          <span className="dash-stat__value">{planName}</span>
          <span className="dash-stat__label">Plan</span>
        </article>
        {plan === "team" ? (
          <article className="dash-stat">
            <span className="dash-stat__value">
              {seatsUsed} / {seatQuantity}
            </span>
            <span className="dash-stat__label">Seats</span>
          </article>
        ) : null}
      </section>

      <section className="dash-panel dash-panel--flat">
        <div className="dash-panel__head">
          <h2>Quick start</h2>
        </div>
        <p className="dash-muted">
          Once forwarded, open Stories to read the recap, timeline, and action list.
        </p>
        <div className="dash-quick-actions">
          <Link href="/stories" className="home-cta home-cta--primary">
            Open stories library
          </Link>
        </div>
      </section>
    </>
  );
}
