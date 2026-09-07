"use client";

import { useMemo, useState } from "react";
import { SettingsSection } from "@/components/settings/settings-section";

export type BillingInvoice = {
  id: string;
  number: string | null;
  description: string | null;
  status: string | null;
  amount: string;
  created: number;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
};

function monthKey(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function formatInvoiceDate(unixSeconds: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(unixSeconds * 1000));
}

function statusLabel(status: string | null): string {
  if (!status) return "—";
  switch (status) {
    case "paid":
      return "Paid";
    case "open":
      return "Open";
    case "void":
      return "Void";
    case "uncollectible":
      return "Uncollectible";
    case "draft":
      return "Draft";
    default:
      return status;
  }
}

export function BillingInvoicesPanel({
  invoices,
  stripeReady,
}: {
  invoices: BillingInvoice[];
  stripeReady: boolean;
}) {
  const monthOptions = useMemo(
    () =>
      [...new Set(invoices.map((inv) => monthKey(inv.created)))].sort((a, b) =>
        b.localeCompare(a),
      ),
    [invoices],
  );

  const [monthFilter, setMonthFilter] = useState<string>(
    monthOptions[0] ?? "all",
  );

  const filtered =
    monthFilter === "all"
      ? invoices
      : invoices.filter((inv) => monthKey(inv.created) === monthFilter);

  if (!stripeReady) return null;

  return (
    <SettingsSection title="Invoices">
      {monthOptions.length > 0 ? (
        <div className="settings-billing-invoices__filter auth-form auth-form--settings">
          <label className="auth-form__field">
            Month
            <select
              value={monthFilter}
              aria-label="Filter invoices by month"
              onChange={(e) => setMonthFilter(e.target.value)}
            >
              {monthOptions.map((key) => (
                <option key={key} value={key}>
                  {formatMonthLabel(key)} (UTC)
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {invoices.length === 0 ? (
        <p className="dash-muted">
          Invoices appear here after you upgrade to a paid plan.
        </p>
      ) : (
        <div className="settings-billing-invoices__table-wrap">
          <table className="story-table settings-billing-invoices__table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Description</th>
                <th scope="col">Status</th>
                <th scope="col">Amount</th>
                <th scope="col">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id}>
                  <td>{formatInvoiceDate(inv.created)}</td>
                  <td className="settings-billing-invoices__desc">
                    {inv.description || inv.number || "Subscription"}
                  </td>
                  <td>{statusLabel(inv.status)}</td>
                  <td>{inv.amount}</td>
                  <td>
                    {inv.hostedInvoiceUrl ? (
                      <a
                        href={inv.hostedInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="settings-btn settings-btn--ghost"
                      >
                        View
                      </a>
                    ) : inv.invoicePdf ? (
                      <a
                        href={inv.invoicePdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="settings-btn settings-btn--ghost"
                      >
                        PDF
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SettingsSection>
  );
}
