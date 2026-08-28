import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import type { PlanId } from "@/lib/billing/plans";
import { AppTopBar } from "@/components/app-top-bar";
import { DeleteAccountForm } from "@/components/account/delete-account-form";
import { ExportAccountForm } from "@/components/account/export-account-form";
import { StoryNotificationsForm } from "@/components/settings/story-notifications-form";
import { ForwardingSettingsPanel } from "@/components/settings/forwarding-settings-panel";
import {
  storyNotificationSettingHint,
  storyNotificationSettingLabel,
} from "@/lib/email/story-notifications";

export const metadata = { title: "Profile — MailToStory" };

export default async function ProfileSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) redirect("/login");
  const canManageTeam = isWorkspaceAdmin(ctx.role);
  const plan = ctx.workspace.plan as PlanId;
  const notifyCopy = storyNotificationSettingLabel(plan);

  return (
    <>
      <AppTopBar
        showNav
        canManageTeam={canManageTeam}
        plan={plan}
        contentMaxWidth="app"
      />
      <main className="dash">
        <div className="dash__inner">
          <header className="dash__header">
            <p className="home-kicker">Settings</p>
            <h1>Profile</h1>
            <p>Your sign-in details and account preferences.</p>
          </header>

          <section className="dash-panel">
            <h2 className="dash-panel__section-title">Account</h2>
            <dl className="dash-profile__dl">
              <div className="dash-profile__row">
                <dt>Name</dt>
                <dd>{ctx.name?.trim() || "—"}</dd>
              </div>
              <div className="dash-profile__row">
                <dt>Email</dt>
                <dd>{ctx.email}</dd>
              </div>
              <div className="dash-profile__row">
                <dt>Plan</dt>
                <dd>{plan.charAt(0).toUpperCase() + plan.slice(1)}</dd>
              </div>
            </dl>
          </section>

          <StoryNotificationsForm
            initialEnabled={ctx.notifyStoryReady}
            plan={plan}
            title={notifyCopy.title}
            description="Choose whether we email you when a forwarded thread becomes a story."
            hint={storyNotificationSettingHint(plan)}
          />

          <ForwardingSettingsPanel canManage={canManageTeam} />

          {canManageTeam && plan === "team" ? (
            <section className="dash-panel dash-panel--flat">
              <div className="dash-panel__head">
                <h2>Team</h2>
                <Link href="/settings/team">Manage team</Link>
              </div>
              <p className="dash-muted">
                Invite colleagues, assign seats, and update your shared team inbox name.
              </p>
            </section>
          ) : null}

          <section className="dash-panel">
            <h2 className="dash-panel__section-title">Export data</h2>
            <ExportAccountForm />
          </section>

          <section className="dash-panel">
            <h2 className="dash-panel__section-title">Delete account</h2>
            <DeleteAccountForm email={ctx.email} hasPassword={ctx.hasPassword} />
          </section>
        </div>
      </main>
    </>
  );
}
