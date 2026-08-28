import prisma from "@/lib/prisma";
import { normalizeEmail } from "@/lib/password";

export async function findRegisteredUserEmail(
  email: string,
): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true },
  });
  return user != null;
}

export async function exportDataByEmail(email: string) {
  const normalized = normalizeEmail(email);

  const [invites, forwardingAddresses, quarantined] = await Promise.all([
    prisma.workspaceInvite.findMany({
      where: { email: normalized },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
        workspace: { select: { name: true } },
      },
    }),
    prisma.forwardingAddress.findMany({
      where: { email: normalized },
      select: {
        id: true,
        email: true,
        verifiedAt: true,
        createdAt: true,
        workspace: { select: { name: true } },
      },
    }),
    prisma.quarantinedInbound.findMany({
      where: { fromEmail: normalized },
      select: {
        id: true,
        fromEmail: true,
        fromName: true,
        subject: true,
        snippet: true,
        textBody: true,
        htmlBody: true,
        toAddresses: true,
        messageDate: true,
        attachmentCount: true,
        expiresAt: true,
        createdAt: true,
        workspace: { select: { name: true } },
      },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    email: normalized,
    workspaceInvites: invites,
    forwardingAddresses,
    quarantinedInbound: quarantined,
  };
}

export async function deleteDataByEmail(email: string): Promise<number> {
  const normalized = normalizeEmail(email);

  const [invites, forwarding, quarantine] = await Promise.all([
    prisma.workspaceInvite.deleteMany({ where: { email: normalized } }),
    prisma.forwardingAddress.deleteMany({ where: { email: normalized } }),
    prisma.quarantinedInbound.deleteMany({ where: { fromEmail: normalized } }),
  ]);

  return invites.count + forwarding.count + quarantine.count;
}

export async function buildAccountExport(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      memberships: {
        where: { status: "active" },
        select: {
          role: true,
          notifyStoryReady: true,
          createdAt: true,
          workspace: {
            select: {
              id: true,
              name: true,
              plan: true,
              inboundLocalPart: true,
              seatQuantity: true,
              cancelAtPeriodEnd: true,
              currentPeriodEnd: true,
              createdAt: true,
              forwardingAddresses: {
                select: {
                  email: true,
                  verifiedAt: true,
                  createdAt: true,
                },
              },
              conversations: {
                select: {
                  id: true,
                  subject: true,
                  snippet: true,
                  lastMessageAt: true,
                  createdAt: true,
                  messages: {
                    orderBy: { sequence: "asc" },
                    select: {
                      sequence: true,
                      fromName: true,
                      fromEmail: true,
                      toAddresses: true,
                      subject: true,
                      date: true,
                      textBody: true,
                      htmlBody: true,
                    },
                  },
                  attachments: {
                    select: {
                      filename: true,
                      mimeType: true,
                      size: true,
                    },
                  },
                  story: {
                    select: {
                      title: true,
                      status: true,
                      resolutionSummary: true,
                      digest: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  return {
    exportedAt: new Date().toISOString(),
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
    },
    workspaces: user.memberships.map((m) => ({
      role: m.role,
      notifyStoryReady: m.notifyStoryReady,
      memberSince: m.createdAt,
      workspace: m.workspace,
    })),
  };
}
