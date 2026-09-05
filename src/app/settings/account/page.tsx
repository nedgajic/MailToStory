import { SettingsPageShell } from "@/components/settings/settings-page-shell";
import { SettingsSection } from "@/components/settings/settings-section";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { TwoFactorForm } from "@/components/settings/two-factor-form";
import { requireSettingsPageContext } from "@/lib/settings-page-data";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = { title: `Account — ${BRAND_NAME}` };

export default async function AccountSettingsPage() {
  const { ctx, canManageTeam, plan, hasGoogleAccount, twoFactorEnabled } =
    await requireSettingsPageContext();

  return (
    <SettingsPageShell
      title="Account"
      description="Sign-in details and account security."
      canManageTeam={canManageTeam}
      plan={plan}
    >
      <SettingsSection title="Account details">
        <dl className="dash-profile__dl">
          <div className="dash-profile__row">
            <dt>Email</dt>
            <dd>{ctx.email}</dd>
          </div>
          <div className="dash-profile__row">
            <dt>Plan</dt>
            <dd>{plan.charAt(0).toUpperCase() + plan.slice(1)}</dd>
          </div>
        </dl>
      </SettingsSection>

      <SettingsSection title="Password">
        <ChangePasswordForm
          hasPassword={ctx.hasPassword}
          hasGoogleAccount={hasGoogleAccount}
        />
      </SettingsSection>

      <SettingsSection title="Two-factor authentication">
        <TwoFactorForm enabled={twoFactorEnabled} hasPassword={ctx.hasPassword} />
      </SettingsSection>
    </SettingsPageShell>
  );
}
