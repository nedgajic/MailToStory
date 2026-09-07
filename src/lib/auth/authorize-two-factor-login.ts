import prisma from "@/lib/prisma";
import { verifyLoginTotp } from "@/lib/auth/totp";
import { consumePendingTwoFactorLogin } from "@/lib/auth/two-factor-login";

export async function authorizeTwoFactorLogin(
  loginToken: string,
  totpCode: string,
) {
  const userId = await consumePendingTwoFactorLogin(loginToken);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      credentialsChangedAt: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
      twoFactorBackupCodes: true,
    },
  });

  if (!user?.twoFactorEnabled || !user.twoFactorSecret || !user.email) {
    return null;
  }

  if (!totpCode.trim()) {
    throw new Error("TwoFactorRequired");
  }

  const verification = await verifyLoginTotp({
    email: user.email,
    encryptedSecret: user.twoFactorSecret,
    backupCodesJson: user.twoFactorBackupCodes,
    code: totpCode,
  });
  if (!verification.ok) return null;

  if (verification.nextBackupCodesJson !== undefined) {
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorBackupCodes: verification.nextBackupCodesJson },
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    credentialsChangedAt: user.credentialsChangedAt,
  };
}
