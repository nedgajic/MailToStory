import { SettingsPageShell } from "@/components/settings/settings-page-shell";
import { SettingsSection } from "@/components/settings/settings-section";
import { DeleteAccountForm } from "@/components/account/delete-account-form";
import { ExportAccountForm } from "@/components/account/export-account-form";
import { requireSettingsPageContext } from "@/lib/settings-page-data";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = { title: `Privacy & data — ${BRAND_NAME}` };

export default async function PrivacySettingsPage() {
  const { ctx, canManageTeam, plan } = await requireSettingsPageContext();

  return (
    <SettingsPageShell
      title="Privacy & data"
      description="Download a copy of your data or permanently delete your account."
      canManageTeam={canManageTeam}
      plan={plan}
    >
      <SettingsSection title="Export data">
        <ExportAccountForm />
      </SettingsSection>

      <SettingsSection title="Delete account">
        <DeleteAccountForm email={ctx.email} hasPassword={ctx.hasPassword} />
      </SettingsSection>
    </SettingsPageShell>
  );
}
