import { render } from "@react-email/render";
import prisma from "@/lib/prisma";
import { StoryReadyEmail } from "@/emails/story-ready-email";
import { parsePlanId } from "@/lib/billing/plans";
import { normalizeEmail } from "@/lib/password";
import { appUrl, sendTransactionalEmail } from "@/lib/email/send";
import { createStoryAccessToken } from "@/lib/email/story-access-token";
import { BRAND_NAME } from "@/lib/brand";

export type StoryNotificationRecipient = {
  userId: string;
  email: string;
  name: string | null;
};

export function filterStoryNotificationRecipients(input: {
  plan: "free" | "pro" | "team";
  forwarderEmail: string;
  members: Array<{
    notifyStoryReady: boolean;
    user: { id: string; email: string | null; name: string | null };
  }>;
}): StoryNotificationRecipient[] {
  const forwarder = normalizeEmail(input.forwarderEmail);
  const enabled = input.members.filter(
    (member) => member.notifyStoryReady && member.user.email,
  );

  const mapped = enabled.map((member) => ({
    userId: member.user.id,
    email: member.user.email!,
    name: member.user.name,
  }));

  if (input.plan === "team") {
    return mapped;
  }

  if (!forwarder) return [];
  return mapped.filter(
    (recipient) => normalizeEmail(recipient.email) === forwarder,
  );
}

export async function notifyStoryReady(storyId: string): Promise<void> {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: {
      conversation: {
        include: {
          messages: { orderBy: { sequence: "desc" }, take: 1 },
        },
      },
    },
  });
  if (!story) return;

  const workspace = await prisma.workspace.findUnique({
    where: { id: story.workspaceId },
    select: { id: true, plan: true, name: true },
  });
  if (!workspace) return;

  const forwarderEmail =
    story.conversation.messages[0]?.fromEmail?.trim() ?? "";
  const plan = parsePlanId(workspace.plan);

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: workspace.id, status: "active" },
    select: {
      notifyStoryReady: true,
      user: { select: { id: true, email: true, name: true } },
    },
  });

  const recipients = filterStoryNotificationRecipients({
    plan,
    forwarderEmail,
    members,
  });

  for (const recipient of recipients) {
    try {
      const rawToken = await createStoryAccessToken(storyId, recipient.userId);
      const storyUrl = appUrl(`/api/story-access?token=${encodeURIComponent(rawToken)}`);
      const html = await render(
        StoryReadyEmail({
          recipientName: recipient.name ?? "",
          storyTitle: story.title,
          subjectLine: story.subject,
          resolutionSummary: story.resolutionSummary,
          storyUrl,
          workspaceName: workspace.name,
          isTeamInbox: plan === "team",
        }),
      );
      const text = [
        `Your story is ready: ${story.title}`,
        "",
        story.resolutionSummary,
        "",
        `Open story: ${storyUrl}`,
        "",
        `Manage notifications: ${appUrl("/settings/profile")}`,
      ].join("\n");

      await sendTransactionalEmail({
        to: recipient.email,
        subject: `Your story is ready — ${story.title}`,
        text,
        html,
      });
    } catch (error) {
      console.error("[story-notify] send failed", {
        storyId,
        userId: recipient.userId,
        error,
      });
    }
  }
}

export function storyNotificationSettingLabel(plan: "free" | "pro" | "team"): {
  title: string;
  description: string;
} {
  if (plan === "team") {
    return {
      title: "Email me when a team story is ready",
      description:
        "Get a message with a secure link whenever a thread forwarded to your shared inbox becomes a story.",
    };
  }
  return {
    title: "Email me when my story is ready",
    description:
      "Get a message with a secure link after you forward a thread and we finish building the story.",
  };
}

export function storyNotificationSettingHint(plan: "free" | "pro" | "team"): string {
  if (plan === "team") {
    return "Applies to stories created in this team workspace. Each teammate controls their own notifications.";
  }
  return `We only email the address that forwarded the thread (${BRAND_NAME} account email).`;
}
