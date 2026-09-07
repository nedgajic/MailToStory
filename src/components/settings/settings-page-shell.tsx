import { AppTopBar } from "@/components/app-top-bar";
import { SettingsFeedbackProvider } from "@/components/settings/settings-feedback";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import type { PlanId } from "@/lib/billing/plans";

export function SettingsPageShell({
  title,
  description,
  canManageTeam,
  plan,
  children,
  wide = false,
  billingBackground = false,
}: {
  title: string;
  description: string;
  canManageTeam: boolean;
  plan: PlanId;
  children: React.ReactNode;
  wide?: boolean;
  billingBackground?: boolean;
}) {
  return (
    <>
      <AppTopBar
        showNav
        canManageTeam={canManageTeam}
        plan={plan}
        contentMaxWidth="app"
      />
      <main className="dash">
        {billingBackground ? (
          <div className="dash__bg" aria-hidden="true">
            <div className="dash__orb dash__orb--1" />
            <div className="dash__orb dash__orb--2" />
            <div className="dash__orb dash__orb--3" />
            <div className="dash__grid" />
          </div>
        ) : null}
        <div
          className={`dash__inner settings-layout${wide ? " settings-layout--wide" : ""}`}
        >
          <SettingsSidebar canManageTeam={canManageTeam} plan={plan} />
          <div className="settings-layout__main">
            <header
              className={
                billingBackground
                  ? "dash-billing-page__head settings-layout__header"
                  : "dash__header settings-layout__header"
              }
            >
              <p className="home-kicker">Settings</p>
              <h1 className={billingBackground ? "dash-billing-page__title" : undefined}>
                {title}
              </h1>
              <p className={billingBackground ? "dash-billing-page__lead" : undefined}>
                {description}
              </p>
            </header>
            <SettingsFeedbackProvider>
              <div className="settings-content">{children}</div>
            </SettingsFeedbackProvider>
          </div>
        </div>
      </main>
    </>
  );
}
