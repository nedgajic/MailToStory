import prisma from "@/lib/prisma";
import {
  FREE_STORY_LIMIT,
  GENERATION_LIMIT_DAILY,
  GENERATION_LIMIT_HOURLY,
  PRO_GENERATION_LIMIT_MONTHLY,
  REGENERATION_DEBOUNCE_MINUTES,
  TEAM_GENERATION_LIMIT_MONTHLY_PER_SEAT,
  type PlanId,
} from "@/lib/billing/plans";
import { canGenerateStory } from "@/lib/billing/entitlements";
import { isInboundSenderAllowed } from "@/lib/inbound/sender-allowlist";
import { utcMonthRange } from "@/lib/workspace";

export type GenerationBlockReason =
  | "free_story_quota"
  | "monthly_generation_quota"
  | "hourly_rate_limit"
  | "daily_rate_limit"
  | "regeneration_debounce"
  | "sender_not_allowed"
  | "email_not_verified";

export type GenerationGateResult = {
  allowed: boolean;
  reason?: GenerationBlockReason;
  message?: string;
};

function parsePositiveInt(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export function generationLimitHourly(): number {
  return parsePositiveInt(
    process.env.GENERATION_LIMIT_HOURLY,
    GENERATION_LIMIT_HOURLY,
  );
}

export function generationLimitDaily(): number {
  return parsePositiveInt(
    process.env.GENERATION_LIMIT_DAILY,
    GENERATION_LIMIT_DAILY,
  );
}

export function regenerationDebounceMinutes(): number {
  return parsePositiveInt(
    process.env.REGENERATION_DEBOUNCE_MINUTES,
    REGENERATION_DEBOUNCE_MINUTES,
  );
}

export function monthlyGenerationLimit(
  plan: PlanId,
  seatQuantity: number,
): number | null {
  if (plan === "free") return null;
  if (plan === "pro") {
    return parsePositiveInt(
      process.env.GENERATION_LIMIT_PRO_MONTHLY,
      PRO_GENERATION_LIMIT_MONTHLY,
    );
  }
  const perSeat = parsePositiveInt(
    process.env.GENERATION_LIMIT_TEAM_MONTHLY_PER_SEAT,
    TEAM_GENERATION_LIMIT_MONTHLY_PER_SEAT,
  );
  return perSeat * Math.max(1, seatQuantity);
}

export function requireVerifiedEmailForGeneration(): boolean {
  const raw = process.env.INBOUND_REQUIRE_VERIFIED_EMAIL?.trim().toLowerCase();
  if (raw === "false" || raw === "0") return false;
  return true;
}

export async function workspaceHasVerifiedMember(
  workspaceId: string,
): Promise<boolean> {
  const count = await prisma.workspaceMember.count({
    where: {
      workspaceId,
      status: "active",
      user: { emailVerified: { not: null } },
    },
  });
  return count > 0;
}

export async function generationsSince(
  workspaceId: string,
  since: Date,
): Promise<number> {
  return prisma.storyGenerationLog.count({
    where: { workspaceId, createdAt: { gte: since } },
  });
}

export async function generationsThisMonth(
  workspaceId: string,
): Promise<number> {
  const { start } = utcMonthRange();
  return generationsSince(workspaceId, start);
}

export async function lastGenerationAt(
  conversationId: string,
): Promise<Date | null> {
  const row = await prisma.storyGenerationLog.findFirst({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return row?.createdAt ?? null;
}

export async function logStoryGeneration(input: {
  workspaceId: string;
  conversationId: string;
}): Promise<void> {
  await prisma.storyGenerationLog.create({
    data: {
      workspaceId: input.workspaceId,
      conversationId: input.conversationId,
    },
  });
}

function block(
  reason: GenerationBlockReason,
  message: string,
): GenerationGateResult {
  return { allowed: false, reason, message };
}

export async function evaluateGenerationGate(input: {
  plan: PlanId;
  workspaceId: string;
  conversationId: string;
  seatQuantity: number;
  hasExistingStory: boolean;
  /** Manual refresh from the app — skips debounce, still enforces rate limits. */
  manualRefresh?: boolean;
  /** Inbound webhook only — when set, sender must be a workspace member. */
  fromEmail?: string;
}): Promise<GenerationGateResult> {
  if (requireVerifiedEmailForGeneration()) {
    const verified = await workspaceHasVerifiedMember(input.workspaceId);
    if (!verified) {
      return block(
        "email_not_verified",
        "Verify your email before stories can be generated.",
      );
    }
  }

  if (input.fromEmail !== undefined) {
    const senderOk = await isInboundSenderAllowed(
      input.workspaceId,
      input.fromEmail,
    );
    if (!senderOk) {
      return block(
        "sender_not_allowed",
        "Only verified workspace or forwarding addresses can trigger story generation.",
      );
    }
  }

  if (!input.hasExistingStory) {
    const quota = await canGenerateStory(input.plan, input.workspaceId);
    if (!quota.allowed) {
      return block(
        "free_story_quota",
        `Free plan includes ${FREE_STORY_LIMIT} stories this month. Upgrade to generate more.`,
      );
    }
  }

  const monthlyLimit = monthlyGenerationLimit(input.plan, input.seatQuantity);
  if (monthlyLimit != null) {
    const used = await generationsThisMonth(input.workspaceId);
    if (used >= monthlyLimit) {
      return block(
        "monthly_generation_quota",
        `Monthly generation limit reached (${monthlyLimit}). Contact support if you need more.`,
      );
    }
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const hourlyUsed = await generationsSince(input.workspaceId, hourAgo);
  const hourlyLimit = generationLimitHourly();
  if (hourlyUsed >= hourlyLimit) {
    return block(
      "hourly_rate_limit",
      `Too many stories generated recently. Try again in an hour (limit ${hourlyLimit}/hour).`,
    );
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dailyUsed = await generationsSince(input.workspaceId, dayAgo);
  const dailyLimit = generationLimitDaily();
  if (dailyUsed >= dailyLimit) {
    return block(
      "daily_rate_limit",
      `Daily generation limit reached (${dailyLimit}/day). Try again tomorrow.`,
    );
  }

  if (input.hasExistingStory && !input.manualRefresh) {
    const last = await lastGenerationAt(input.conversationId);
    const debounceMs = regenerationDebounceMinutes() * 60 * 1000;
    if (last && Date.now() - last.getTime() < debounceMs) {
      return block(
        "regeneration_debounce",
        `Story was recently updated. Wait ${regenerationDebounceMinutes()} minutes or refresh manually in the app.`,
      );
    }
  }

  return { allowed: true };
}
