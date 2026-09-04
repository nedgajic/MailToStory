"use client";

import { useEffect, useMemo, useState } from "react";
import {
  billingAmountUsd,
  formatUsd,
  planUnitAmountUsd,
  type BillingInterval,
} from "@/lib/billing/plans";
import { seatsToRemove, suggestMemberIdsToRemove } from "@/lib/billing/seats-shared";

type Member = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  createdAt: string;
};

type Invite = {
  id: string;
  email: string;
};

export function SeatChangeForm({
  seatQuantity,
  seatsUsed,
  interval,
  stripeReady,
  platformAdminBilling = false,
  members,
  invites,
  compact = false,
  onSuccess,
}: {
  seatQuantity: number;
  seatsUsed: number;
  interval: BillingInterval;
  stripeReady: boolean;
  platformAdminBilling?: boolean;
  members: Member[];
  invites: Invite[];
  compact?: boolean;
  onSuccess?: () => void;
}) {
  const [targetSeats, setTargetSeats] = useState(seatQuantity);
  const [removeMemberIds, setRemoveMemberIds] = useState<string[]>([]);
  const [revokeInviteIds, setRevokeInviteIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const memberRows = useMemo(
    () =>
      members.map((member) => ({
        id: member.id,
        userId: member.id,
        role: member.role,
        createdAt: new Date(member.createdAt),
      })),
    [members],
  );

  const requiredRemovals = seatsToRemove(seatsUsed, targetSeats);
  const isDowngrade = targetSeats < seatQuantity;
  const isUpgrade = targetSeats > seatQuantity;
  const removable = members.filter((member) => member.role !== "owner");
  const pricePerSeat = planUnitAmountUsd("team", interval);
  const currentTotal = billingAmountUsd("team", interval, seatQuantity);
  const nextTotal = billingAmountUsd("team", interval, targetSeats);
  const canChangeSeats = stripeReady || platformAdminBilling;

  useEffect(() => {
    if (requiredRemovals > 0) {
      setRemoveMemberIds(suggestMemberIdsToRemove(memberRows, targetSeats));
    } else {
      setRemoveMemberIds([]);
    }
    setRevokeInviteIds([]);
  }, [targetSeats, requiredRemovals, memberRows]);

  function toggleMember(memberId: string) {
    setRemoveMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
  }

  function toggleInvite(inviteId: string) {
    setRevokeInviteIds((current) =>
      current.includes(inviteId)
        ? current.filter((id) => id !== inviteId)
        : [...current, inviteId],
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch("/api/billing/seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seats: targetSeats,
          removeMemberIds,
          revokeInviteIds,
        }),
      });
      const data = (await res.json()) as { error?: string; seatQuantity?: number };
      if (!res.ok) {
        setError(data.error || "Could not update seats.");
        return;
      }
      if (onSuccess) {
        onSuccess();
        return;
      }
      setMessage(
        data.seatQuantity
          ? `Team updated to ${data.seatQuantity} seats. Stripe will prorate your next invoice.`
          : "Seats updated.",
      );
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  const unchanged = targetSeats === seatQuantity && removeMemberIds.length === 0;

  return (
    <form className={compact ? "seat-change seat-change--compact" : "seat-change dash-panel"} onSubmit={(e) => void submit(e)}>
      {!compact ? <h2 className="dash-panel__section-title">Seats & billing</h2> : null}
      <p className="dash-muted">
        {seatsUsed} of {seatQuantity} seats in use · {formatUsd(pricePerSeat)}
        {interval === "annual" ? " / seat / year" : " / seat / month"}
      </p>

      <label className="auth-form__field">
        Team seats
        <input
          type="number"
          min={1}
          value={targetSeats}
          onChange={(e) => setTargetSeats(Math.max(1, Number(e.target.value) || 1))}
          aria-label="Team seats"
        />
      </label>

      <p className="seat-change__pricing">
        {unchanged ? (
          <>Current total: {formatUsd(currentTotal)}{interval === "annual" ? " / year" : " / month"}</>
        ) : (
          <>
            {formatUsd(currentTotal)} → <strong>{formatUsd(nextTotal)}</strong>
            {interval === "annual" ? " / year" : " / month"}
            {isUpgrade ? " (charged immediately with proration)" : isDowngrade ? " (credit applied with proration)" : null}
          </>
        )}
      </p>

      {requiredRemovals > 0 ? (
        <div className="seat-change__removals">
          <p className="seat-change__removals-lead">
            Lowering seats removes {requiredRemovals} {requiredRemovals === 1 ? "person" : "people"}.
            The owner always keeps a seat. Adjust the selection below:
          </p>
          <ul className="seat-change__member-list">
            {removable.map((member) => (
              <li key={member.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={removeMemberIds.includes(member.id)}
                    onChange={() => toggleMember(member.id)}
                  />
                  <span>
                    {member.name || member.email || "Member"} · {member.role}
                    {member.email ? ` · ${member.email}` : ""}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {removeMemberIds.length < requiredRemovals ? (
            <p className="auth-form__error">
              Select {requiredRemovals - removeMemberIds.length} more{" "}
              {requiredRemovals - removeMemberIds.length === 1 ? "member" : "members"}.
            </p>
          ) : null}
        </div>
      ) : null}

      {invites.length > 0 && isDowngrade ? (
        <div className="seat-change__invites">
          <p className="dash-muted">Optionally revoke pending invites before reducing seats.</p>
          <ul className="seat-change__member-list">
            {invites.map((invite) => (
              <li key={invite.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={revokeInviteIds.includes(invite.id)}
                    onChange={() => toggleInvite(invite.id)}
                  />
                  <span>Revoke invite for {invite.email}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? <p className="auth-form__error">{error}</p> : null}
      {message ? <p className="dash-banner__feedback">{message}</p> : null}

      <button
        className="home-cta home-cta--primary"
        type="submit"
        disabled={
          busy ||
          !canChangeSeats ||
          unchanged ||
          (requiredRemovals > 0 && removeMemberIds.length < requiredRemovals)
        }
      >
        {busy
          ? "Updating…"
          : isUpgrade
            ? `Add seats · ${formatUsd(nextTotal)}`
            : isDowngrade
              ? `Reduce to ${targetSeats} seats`
              : "Update seats"}
      </button>
    </form>
  );
}
