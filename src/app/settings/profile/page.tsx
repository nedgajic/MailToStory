import { SettingsPageShell } from "@/components/settings/settings-page-shell";
import { SettingsSection } from "@/components/settings/settings-section";
import { ProfileNameForm } from "@/components/settings/profile-name-form";
import { ProfilePhotoForm } from "@/components/settings/profile-photo-form";
import { ProfileForwardingHashRedirect } from "@/components/settings/profile-forwarding-hash-redirect";
import { requireSettingsPageContext } from "@/lib/settings-page-data";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = { title: `Profile — ${BRAND_NAME}` };

export default async function ProfileSettingsPage() {
  const { ctx, canManageTeam, plan, image } = await requireSettingsPageContext();

  return (
    <SettingsPageShell
      title="Profile"
      description={`Your photo and how your name appears across ${BRAND_NAME}.`}
      canManageTeam={canManageTeam}
      plan={plan}
    >
      <ProfileForwardingHashRedirect />
      <SettingsSection title="Profile photo" className="settings-profile">
        <ProfilePhotoForm
          initialImage={image}
          name={ctx.name?.trim() ?? ""}
          email={ctx.email ?? ""}
        />
      </SettingsSection>

      <SettingsSection title="Display name">
        <p className="settings-profile__name-lead">
          Shown on stories, emails, and team invites.
        </p>
        <ProfileNameForm initialName={ctx.name?.trim() ?? ""} />
      </SettingsSection>
    </SettingsPageShell>
  );
}
