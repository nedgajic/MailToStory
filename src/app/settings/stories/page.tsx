import { SettingsPageShell } from "@/components/settings/settings-page-shell";
import { StoryNotificationsForm } from "@/components/settings/story-notifications-form";
import { StoryDefaultLengthForm } from "@/components/settings/story-default-length-form";
import { requireSettingsPageContext } from "@/lib/settings-page-data";
import { canUseElaborateStoryLength, parseStoryLength } from "@/lib/story-length";
import {
  storyNotificationSettingHint,
  storyNotificationSettingLabel,
} from "@/lib/email/story-notifications";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = { title: `Stories — ${BRAND_NAME}` };

export default async function StoriesSettingsPage() {
  const { ctx, canManageTeam, plan, workspacePrefs } =
    await requireSettingsPageContext();
  const notifyCopy = storyNotificationSettingLabel(plan);

  return (
    <SettingsPageShell
      title="Stories"
      description="Choose how stories are generated and when we notify you."
      canManageTeam={canManageTeam}
      plan={plan}
    >
      <StoryDefaultLengthForm
        initialLength={parseStoryLength(workspacePrefs?.defaultStoryLength)}
        canUseElaborate={canUseElaborateStoryLength(plan)}
        canManage={canManageTeam}
        plan={plan}
      />

      <StoryNotificationsForm
        initialEnabled={ctx.notifyStoryReady}
        title={notifyCopy.title}
        description={notifyCopy.description}
        hint={storyNotificationSettingHint(plan)}
      />
    </SettingsPageShell>
  );
}
