"use client";

import { useMemo, useState } from "react";

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
    <section className="dash-billing-invoices" aria-labelledby="dash-billing-invoices-title">
      <div className="dash-billing-invoices__head">
        <h2 id="dash-billing-invoices-title" className="dash-billing-invoices__title">
          Invoices
        </h2>
        <div className="dash-billing-invoices__controls">
          <span className="dash-billing-invoices__tz">UTC</span>
          {monthOptions.length > 0 ? (
            <select
              className="dash-billing-invoices__month"
              value={monthFilter}
              aria-label="Filter invoices by month"
              onChange={(e) => setMonthFilter(e.target.value)}
            >
              {monthOptions.map((key) => (
                <option key={key} value={key}>
                  {formatMonthLabel(key)}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>

      {invoices.length === 0 ? (
        <p className="dash-billing-invoices__empty">
          Invoices appear here after you upgrade to a paid plan.
        </p>
      ) : (
        <div className="dash-billing-invoices__table-wrap">
          <table className="dash-billing-invoices__table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Description</th>
                <th scope="col">Status</th>
                <th scope="col" className="dash-billing-invoices__col-amount">
                  Amount
                </th>
                <th scope="col" className="dash-billing-invoices__col-invoice">
                  Invoice
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id}>
                  <td>{formatInvoiceDate(inv.created)}</td>
                  <td className="dash-billing-invoices__desc">
                    {inv.description || inv.number || "Subscription"}
                  </td>
                  <td>{statusLabel(inv.status)}</td>
                  <td className="dash-billing-invoices__col-amount">{inv.amount}</td>
                  <td className="dash-billing-invoices__col-invoice">
                    {inv.hostedInvoiceUrl ? (
                      <a
                        href={inv.hostedInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dash-billing-invoices__view"
                      >
                        View
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                        </svg>
                      </a>
                    ) : inv.invoicePdf ? (
                      <a
                        href={inv.invoicePdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dash-billing-invoices__view"
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
    </section>
  );
}
