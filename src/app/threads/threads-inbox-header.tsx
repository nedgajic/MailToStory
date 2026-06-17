"use client";

export function ThreadsInboxHeader({ email }: { email: string | null | undefined }) {
  return (
    <header className="threads-inbox-header">
      <p className="threads-inbox-kicker">Inbox preview · {email}</p>
      <h1 className="threads-inbox-title">Primary</h1>
      <p className="threads-inbox-blurb">
        Open a row for a digest. Single-message threads look lighter but work the
        same. Page right for older mail.
      </p>
    </header>
  );
}
