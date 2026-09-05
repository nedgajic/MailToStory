import { SettingsPageShell } from "@/components/settings/settings-page-shell";
import { ForwardingSettingsPanel } from "@/components/settings/forwarding-settings-panel";
import { requireSettingsPageContext } from "@/lib/settings-page-data";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = { title: `Email & forwarding — ${BRAND_NAME}` };

export default async function EmailSettingsPage() {
  const { canManageTeam, plan } = await requireSettingsPageContext();

  return (
    <SettingsPageShell
      title="Email & forwarding"
      description="Control who can forward mail to your inbox and approve held messages."
      canManageTeam={canManageTeam}
      plan={plan}
    >
      <ForwardingSettingsPanel canManage={canManageTeam} />
    </SettingsPageShell>
  );
}
