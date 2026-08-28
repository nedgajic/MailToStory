import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { normalizeEmail, verifyPassword } from "@/lib/password";
import { ensureWorkspaceForUser } from "@/lib/workspace";
import { verifyLoginTotp } from "@/lib/auth/totp";

const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "Authentication code", type: "text" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email ?? "");
        const password = credentials?.password ?? "";
        const totpCode = credentials?.totpCode?.trim() ?? "";
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
            credentialsChangedAt: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
            twoFactorBackupCodes: true,
          },
        });
        if (!user?.passwordHash) return null;
        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        if (user.twoFactorEnabled && user.twoFactorSecret) {
          if (!totpCode) {
            throw new Error("TwoFactorRequired");
          }
          const verification = await verifyLoginTotp({
            email,
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
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          credentialsChangedAt: user.credentialsChangedAt,
        };
      },
    }),
    ...(googleId && googleSecret
      ? [
          GoogleProvider({
            clientId: googleId,
            clientSecret: googleSecret,
            allowDangerousEmailAccountLinking: true,
            authorization: {
              params: { scope: "openid email profile" },
            },
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        const changedAt =
          "credentialsChangedAt" in user && user.credentialsChangedAt instanceof Date
            ? user.credentialsChangedAt.getTime()
            : null;
        if (changedAt != null) {
          token.credentialsVersion = changedAt;
        } else {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { credentialsChangedAt: true },
          });
          token.credentialsVersion = dbUser?.credentialsChangedAt?.getTime() ?? 0;
        }
        return token;
      }

      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { credentialsChangedAt: true },
        });
        const currentVersion = dbUser?.credentialsChangedAt?.getTime() ?? 0;
        if ((token.credentialsVersion ?? 0) !== currentVersion) {
          return {};
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!token.sub) return session;
      if (session.user) session.user.id = token.sub;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      await ensureWorkspaceForUser({
        userId: user.id,
        name: user.name,
        email: user.email,
      });
    },
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.id) {
        await prisma.user.updateMany({
          where: { id: user.id, emailVerified: null },
          data: { emailVerified: new Date() },
        });
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export { googleAuthEnabled } from "@/lib/google-auth-enabled";