"use client";

type ThreadsInboxHeaderProps = {
  email: string | null | undefined;
  threadsOnly: boolean;
  onThreadsOnlyChange: (value: boolean) => void;
};

export function ThreadsInboxHeader({
  email,
  threadsOnly,
  onThreadsOnlyChange,
}: ThreadsInboxHeaderProps) {
  return (
    <header className="threads-inbox-header threads-inbox-header--compact">
      <div className="threads-inbox-header__main">
        <div className="threads-inbox-header__identity">
          <h1 className="threads-inbox-title">Inbox</h1>
          {email ? <p className="threads-inbox-email">{email}</p> : null}
        </div>
        <button
          type="button"
          className={`threads-filter-toggle${threadsOnly ? " threads-filter-toggle--on" : ""}`}
          aria-pressed={threadsOnly}
          onClick={() => onThreadsOnlyChange(!threadsOnly)}
        >
          <span className="threads-filter-toggle__track" aria-hidden>
            <span className="threads-filter-toggle__thumb" />
          </span>
          <span className="threads-filter-toggle__label">Threads only</span>
        </button>
      </div>
    </header>
  );
}
