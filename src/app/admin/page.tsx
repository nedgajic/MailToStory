import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import {
  AppTopBar,
  AppTopBarBackLink,
} from "@/components/app-top-bar";
import { isAdminEmail } from "@/lib/admin";
import { getAdminUserSummary, listAdminUsers } from "@/lib/adminUsers";
import { getAdminStorageReport } from "@/lib/admin/storage-metrics";
import { AdminStoragePanel } from "@/components/admin/admin-storage-panel";

export const metadata = {
  title: "Admin — MailToStory",
  robots: { index: false, follow: false },
};

function formatWhen(value: Date | null): string {
  if (!value) return "—";
  return value.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  if (!isAdminEmail(session.user.email)) {
    redirect("/dashboard");
  }

  const [summary, users, storage] = await Promise.all([
    getAdminUserSummary(),
    listAdminUsers(),
    getAdminStorageReport(),
  ]);

  return (
    <>
      <AppTopBar startSlot={<AppTopBarBackLink />} contentMaxWidth="digest" />
      <main className="admin-page">
        <div className="admin-page__inner">
          <header className="admin-page__header">
            <p className="admin-page__kicker">Admin</p>
            <h1 className="admin-page__title">User activity</h1>
            <p className="admin-page__lead">
              Signed-in users and story generation activity from the app database.
            </p>
          </header>

          <div className="admin-summary">
            <div className="admin-summary__card">
              <span className="admin-summary__value">{summary.totalUsers}</span>
              <span className="admin-summary__label">Total users</span>
            </div>
            <div className="admin-summary__card">
              <span className="admin-summary__value">
                {summary.usersWithDigests}
              </span>
              <span className="admin-summary__label">Used story generation</span>
            </div>
            <div className="admin-summary__card">
              <span className="admin-summary__value">
                {summary.activeSessions}
              </span>
              <span className="admin-summary__label">Active sessions</span>
            </div>
            <div className="admin-summary__card">
              <span className="admin-summary__value">{summary.totalDigests}</span>
              <span className="admin-summary__label">Cached digests</span>
            </div>
          </div>

          <AdminStoragePanel
            metrics={storage.metrics}
            suggestions={storage.suggestions}
          />

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Email</th>
                  <th scope="col">Name</th>
                  <th scope="col">Digests</th>
                  <th scope="col">Threads</th>
                  <th scope="col">First story</th>
                  <th scope="col">Last story</th>
                  <th scope="col">Session</th>
                  <th scope="col">Plan</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="admin-table__empty">
                      No users yet.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td className="admin-table__email">
                        {user.email ?? (
                          <span className="admin-table__muted">No email</span>
                        )}
                      </td>
                      <td>{user.name ?? "—"}</td>
                      <td className="admin-table__num">{user.digestCount}</td>
                      <td className="admin-table__num">{user.uniqueThreads}</td>
                      <td>{formatWhen(user.firstDigestAt)}</td>
                      <td>{formatWhen(user.lastDigestAt)}</td>
                      <td>
                        {user.activeSession ? (
                          <span className="admin-badge admin-badge--ok">
                            Active until{" "}
                            {formatWhen(user.sessionExpiresAt)}
                          </span>
                        ) : (
                          <span className="admin-badge admin-badge--muted">
                            Signed out
                          </span>
                        )}
                      </td>
                      <td>
                        {user.plan ?? "free"} / {user.googleLinked ? "Google" : "Email"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="admin-page__note">
            Users appear after signup. “Digests” counts generated stories. Sessions
            are JWT, so the session column may stay empty.{" "}
            <Link href="/dashboard" className="admin-page__link">
              Back to dashboard
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
