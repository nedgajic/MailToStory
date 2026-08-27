import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import { getDashboardData } from "@/lib/dashboard-data";
import { AppTopBar } from "@/components/app-top-bar";
import { CopyAddress } from "@/components/copy-address";
import { BillingPanel } from "@/components/dashboard/billing-panel";
import { InvoiceList } from "@/components/dashboard/invoice-list";
import { ResendVerifyButton } from "@/components/dashboard/resend-verify";

export const metadata = { title: "Dashboard — MailToStory" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) redirect("/login");
  const data = await getDashboardData(ctx);
  const params = await searchParams;

  return (
    <>
      <AppTopBar
        showNav
        canManageTeam={isWorkspaceAdmin(ctx.role)}
        billingLabel={data.upcoming.label}
        contentMaxWidth="app"
      />
      <main className="dash">
        <div className="dash__inner">
          {params.billing === "ok" ? (
            <p className="dash-flash">Billing updated.</p>
          ) : null}
          <header className="dash__header">
            <p className="home-kicker">Dashboard</p>
            <h1>Welcome{ctx.name ? `, ${ctx.name.split(" ")[0]}` : ""}</h1>
            <p className="dash-bill-strip">{data.upcoming.label}</p>
          </header>

          {!data.verified ? <ResendVerifyButton /> : null}

          <section className="dash-stats">
            <article className="dash-stat">
              <span className="dash-stat__value">
                {data.used}
                {data.limit != null ? ` / ${data.limit}` : ""}
              </span>
              <span className="dash-stat__label">Stories this month</span>
            </article>
            <article className="dash-stat">
              <span className="dash-stat__value">{data.planName}</span>
              <span className="dash-stat__label">Plan</span>
            </article>
            <article className="dash-stat">
              <span className="dash-stat__value">
                {data.seatsUsed} / {ctx.workspace.seatQuantity}
              </span>
              <span className="dash-stat__label">Seats</span>
            </article>
            <article className="dash-stat dash-stat--wide">
              <span className="dash-stat__label">Forward threads to</span>
              <CopyAddress address={data.inbound} />
            </article>
          </section>

          <section className="dash-panel">
            <div className="dash-panel__head">
              <h2>Recent stories</h2>
              <Link href="/stories">View all</Link>
            </div>
            {data.recent.length === 0 ? (
              <div className="dash-empty">
                <p>Forward a thread from any mail app to generate your first story.</p>
                <CopyAddress address={data.inbound} />
              </div>
            ) : (
              <ul className="story-cards story-cards--compact">
                {data.recent.map((story) => (
                  <li key={story.id} className="story-card">
                    <Link href={`/stories/${story.id}`}>
                      <h3>{story.title}</h3>
                      <p className="story-card__meta">
                        {story.subject} · {story.createdAt.toLocaleDateString()}
                      </p>
                      <p>{story.resolutionSummary}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <BillingPanel
            plan={ctx.workspace.plan}
            canBill={data.canBill}
            seatQuantity={ctx.workspace.seatQuantity}
            seatsUsed={data.seatsUsed}
            cancelAtPeriodEnd={ctx.workspace.cancelAtPeriodEnd}
            stripeReady={data.stripeReady}
          />

          <section className="dash-panel">
            <div className="dash-panel__head">
              <h2>Invoices</h2>
            </div>
            <InvoiceList invoices={data.invoices} />
          </section>
        </div>
      </main>
    </>
  );
}
