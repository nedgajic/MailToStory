import { OAuth2Client } from "google-auth-library";
import {
  GoogleReconnectRequiredError,
  isInvalidGrantError,
} from "@/lib/google-auth-errors";
import { clearGoogleAccountLink } from "@/lib/google-account";
import prisma from "@/lib/prisma";

const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";

export async function getValidGoogleAccessToken(userId: string): Promise<string> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });

  if (!account) {
    throw new GoogleReconnectRequiredError(
      "No Google account linked. Reconnect Google to load your inbox.",
    );
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expiresAt = account.expires_at ?? 0;

  if (account.access_token && expiresAt > nowSec + 120) {
    return account.access_token;
  }

  if (!account.refresh_token) {
    await clearGoogleAccountLink(userId);
    throw new GoogleReconnectRequiredError(
      "Missing Gmail refresh token. Reconnect Google to grant access again.",
    );
  }

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).");
  }

  const client = new OAuth2Client(clientId, clientSecret);
  client.setCredentials({ refresh_token: account.refresh_token });

  let credentials;
  try {
    ({ credentials } = await client.refreshAccessToken());
  } catch (error) {
    if (isInvalidGrantError(error)) {
      await clearGoogleAccountLink(userId);
      throw new GoogleReconnectRequiredError();
    }
    throw error;
  }

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
