import prisma from "@/lib/prisma";
import type { GenerationBlockReason } from "@/lib/billing/generation-limits";
import { parsePlanId } from "@/lib/billing/plans";
import { normalizeEmail } from "@/lib/password";
import { appUrl, sendTransactionalEmail } from "@/lib/email/send";
import {
  filterStoryNotificationRecipients,
  type StoryNotificationRecipient,
} from "@/lib/email/story-notifications";
import { BRAND_NAME } from "@/lib/brand";

function skipEmailForReason(reason: GenerationBlockReason): boolean {
  return reason === "regeneration_debounce";
}

async function generationAlertRecipients(input: {
  workspaceId: string;
  forwarderEmail: string;
}): Promise<StoryNotificationRecipient[]> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: input.workspaceId },
    select: { plan: true },
  });
  if (!workspace) return [];

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: input.workspaceId, status: "active" },
    select: {
      role: true,
      notifyStoryReady: true,
      user: { select: { id: true, email: true, name: true } },
    },
  });

  const plan = parsePlanId(workspace.plan);
  const recipients = filterStoryNotificationRecipients({
    plan,
    forwarderEmail: input.forwarderEmail,
    members,
  });

  const owner = members.find((m) => m.role === "owner" && m.user.email);
  if (owner?.user.email) {
    const ownerEmail = normalizeEmail(owner.user.email);
    if (!recipients.some((r) => normalizeEmail(r.email) === ownerEmail)) {
      recipients.push({
        userId: owner.user.id,
        email: owner.user.email,
        name: owner.user.name,
      });
    }
  }

  return recipients;
}

export async function notifyGenerationSkipped(input: {
  workspaceId: string;
  conversationId: string;
  subject: string;
  fromEmail: string;
  reason: GenerationBlockReason;
  message: string;
  attachmentNote?: string | null;
}): Promise<void> {
  if (skipEmailForReason(input.reason)) return;

  const workspace = await prisma.workspace.findUnique({
    where: { id: input.workspaceId },
    select: { name: true },
  });
  if (!workspace) return;

  const recipients = await generationAlertRecipients({
    workspaceId: input.workspaceId,
    forwarderEmail: input.fromEmail,
  });
  if (recipients.length === 0) return;

  const storiesUrl = appUrl("/stories");
  const billingUrl = appUrl("/settings/billing");
  const subjectLine = `Story not generated — ${input.subject}`;
  const text = [
    `We received your forwarded thread "${input.subject}" but did not generate a story.`,
    "",
    input.message,
    "",
    input.attachmentNote ?? "",
    `Open Stories to retry once you have capacity: ${storiesUrl}`,
    input.reason === "free_story_quota" || input.reason === "monthly_generation_quota"
      ? `Upgrade or review usage: ${billingUrl}`
      : "",
    "",
    `Manage notifications: ${appUrl("/settings/profile")}`,
  ]
    .filter(Boolean)
    .join("\n");

  for (const recipient of recipients) {
    try {
      await sendTransactionalEmail({
        to: recipient.email,
        subject: subjectLine,
        text,
      });
    } catch (error) {
      console.error("[generation-notify] skip send failed", {
        conversationId: input.conversationId,
        userId: recipient.userId,
        error,
      });
    }
  }
}

export async function notifyGenerationFailed(input: {
  workspaceId: string;
  conversationId: string;
  subject: string;
  fromEmail: string;
  attachmentNote?: string | null;
}): Promise<void> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: input.workspaceId },
    select: { name: true },
  });
  if (!workspace) return;

  const recipients = await generationAlertRecipients({
    workspaceId: input.workspaceId,
    forwarderEmail: input.fromEmail,
  });
  if (recipients.length === 0) return;

  const storiesUrl = appUrl("/stories");
  const subjectLine = `Story generation failed — ${input.subject}`;
  const text = [
    `We received your forwarded thread "${input.subject}" but ${BRAND_NAME} could not finish building the story.`,
    "",
    "Your messages are saved. Open Stories and tap Generate story to try again.",
    "",
    input.attachmentNote ?? "",
    `Open Stories: ${storiesUrl}`,
    "",
    `Manage notifications: ${appUrl("/settings/profile")}`,
  ].join("\n");

  for (const recipient of recipients) {
    try {
      await sendTransactionalEmail({
        to: recipient.email,
        subject: subjectLine,
        text,
      });
    } catch (error) {
      console.error("[generation-notify] fail send failed", {
        conversationId: input.conversationId,
        userId: recipient.userId,
        error,
      });
    }
  }
}
