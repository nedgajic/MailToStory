"use client";

type Invoice = {
  id: string;
  number: string | null;
  status: string | null;
  amount: string;
  created: number;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
};

export function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return (
      <p className="dash-muted">Invoices appear here after you upgrade.</p>
    );
  }
  return (
    <table className="story-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Number</th>
          <th>Amount</th>
          <th>Status</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {invoices.map((inv) => (
          <tr key={inv.id}>
            <td>
              {new Date(inv.created * 1000).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </td>
            <td>{inv.number || "—"}</td>
            <td>{inv.amount}</td>
            <td>{inv.status}</td>
            <td>
              {inv.hostedInvoiceUrl ? (
                <a href={inv.hostedInvoiceUrl} target="_blank" rel="noreferrer">
                  View
                </a>
              ) : null}
              {inv.invoicePdf ? (
                <>
                  {" "}
                  <a href={inv.invoicePdf} target="_blank" rel="noreferrer">
                    PDF
                  </a>
                </>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
