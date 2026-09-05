import type { ReactNode } from "react";

export function SettingsSection({
  title,
  id,
  className,
  children,
}: {
  title?: string;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={["dash-panel", "dash-panel--sectioned", className]
        .filter(Boolean)
        .join(" ")}
    >
      {title ? (
        <div className="dash-panel__header">
          <h2 className="dash-panel__section-title">{title}</h2>
        </div>
      ) : null}
      <div className="dash-panel__body">{children}</div>
    </section>
  );
}
