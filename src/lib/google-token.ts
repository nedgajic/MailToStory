import { OAuth2Client } from "google-auth-library";
import prisma from "@/lib/prisma";

const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";

export async function getValidGoogleAccessToken(userId: string): Promise<string> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });

  if (!account) {
    throw new Error("No Google account linked. Sign in again.");
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expiresAt = account.expires_at ?? 0;

  if (account.access_token && expiresAt > nowSec + 120) {
    return account.access_token;
  }

  if (!account.refresh_token) {
    throw new Error(
      "Missing Google refresh token. Sign out and sign in again (choose the same Google account and grant access).",
    );
  }

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).");
  }

  const client = new OAuth2Client(clientId, clientSecret);
  client.setCredentials({ refresh_token: account.refresh_token });
  const { credentials } = await client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error("Failed to refresh Google access token.");
  }

  const nextExpires =
    credentials.expiry_date != null
      ? Math.floor(credentials.expiry_date / 1000)
      : null;

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: credentials.access_token,
      expires_at: nextExpires,
      ...(credentials.refresh_token
        ? { refresh_token: credentials.refresh_token }
        : {}),
    },
  });

  return credentials.access_token;
}
