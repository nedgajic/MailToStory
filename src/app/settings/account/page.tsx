import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import { getUpcomingBill } from "@/lib/dashboard-data";
import { AppTopBar } from "@/components/app-top-bar";
import { DeleteAccountForm } from "@/components/account/delete-account-form";

export const metadata = { title: "Account — MailToStory" };

export default async function AccountSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) redirect("/login");
  const upcoming = await getUpcomingBill(ctx);

  return (
    <>
      <AppTopBar
        showNav
        canManageTeam={isWorkspaceAdmin(ctx.role)}
        billingLabel={upcoming.label}
        contentMaxWidth="app"
      />
      <main className="dash">
        <div className="dash__inner">
          <header className="dash__header">
            <p className="home-kicker">Account</p>
            <h1>Delete account</h1>
          </header>
          <section className="dash-panel">
            <DeleteAccountForm email={ctx.email} hasPassword={ctx.hasPassword} />
          </section>
        </div>
      </main>
    </>
  );
}
