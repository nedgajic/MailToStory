import {
  formatStorageBytes,
  type StorageMetrics,
  type StorageSuggestion,
} from "@/lib/admin/storage-metrics";

function levelClass(level: StorageSuggestion["level"]): string {
  if (level === "urgent") return "admin-badge admin-badge--warn";
  if (level === "action") return "admin-badge admin-badge--action";
  if (level === "watch") return "admin-badge admin-badge--watch";
  return "admin-badge admin-badge--ok";
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="admin-summary__card">
      <span className="admin-summary__value admin-summary__value--sm">{value}</span>
      <span className="admin-summary__label">{label}</span>
      {hint ? <span className="admin-summary__hint">{hint}</span> : null}
    </div>
  );
}

export function AdminStoragePanel({
  metrics,
  suggestions,
}: {
  metrics: StorageMetrics;
  suggestions: StorageSuggestion[];
}) {
  return (
    <section className="admin-storage">
      <header className="admin-storage__header">
        <h2 className="admin-page__title admin-page__title--section">
          Storage &amp; growth
        </h2>
        <p className="admin-page__lead">
          Live footprint from Postgres and{" "}
          <code className="admin-storage__code">{metrics.env.uploadDir}</code>.
          Updated {new Date(metrics.collectedAt).toLocaleString()}.
        </p>
      </header>

      <div className="admin-summary admin-summary--storage">
        <MetricCard
          label="Postgres database"
          value={formatStorageBytes(metrics.postgresDatabaseBytes)}
          hint={`~${formatStorageBytes(metrics.estimates.estimatedMonthlyDbGrowthBytes)}/mo est.`}
        />
        <MetricCard
          label="Local uploads"
          value={formatStorageBytes(metrics.uploadDirBytes)}
          hint={`${metrics.uploadFileCount} files · ~${formatStorageBytes(metrics.estimates.estimatedMonthlyDiskGrowthBytes)}/mo est.`}
        />
        <MetricCard
          label="Active users (30d)"
          value={String(metrics.counts.activeUsersLast30Days)}
          hint={`${metrics.counts.storiesLast30Days} stories / ${metrics.counts.generationLogLast30Days} generations`}
        />
        <MetricCard
          label="Stories total"
          value={String(metrics.counts.stories)}
          hint={`Avg ${formatStorageBytes(metrics.estimates.avgStoryFootprintBytes)} mail+digest`}
        />
      </div>

      <div className="admin-storage__breakdown">
        <h3 className="admin-storage__subtitle">Postgres breakdown</h3>
        <ul className="admin-storage__list">
          <li>
            ConversationMessage{" "}
            <strong>{formatStorageBytes(metrics.tableBytes.conversationMessage)}</strong>
          </li>
          <li>
            Story <strong>{formatStorageBytes(metrics.tableBytes.story)}</strong>
          </li>
          <li>
            QuarantinedInbound{" "}
            <strong>{formatStorageBytes(metrics.tableBytes.quarantinedInbound)}</strong>
            {" "}({metrics.counts.quarantineActive} active
            {metrics.counts.quarantineExpired > 0
              ? `, ${metrics.counts.quarantineExpired} expired`
              : ""}
            )
          </li>
          <li>
            StoryGenerationLog{" "}
            <strong>{formatStorageBytes(metrics.tableBytes.storyGenerationLog)}</strong>
            {" "}({metrics.counts.generationLogTotal} rows)
          </li>
          <li>
            Attachments metadata{" "}
            <strong>
              {formatStorageBytes(metrics.tableBytes.conversationAttachmentMeta)}
            </strong>
            {" "}({metrics.attachmentCount} rows ·{" "}
            {formatStorageBytes(metrics.attachmentBytesOnDisk)} on disk)
          </li>
        </ul>
      </div>

      <div className="admin-storage__suggestions">
        <h3 className="admin-storage__subtitle">Recommendations</h3>
        <ul className="admin-suggestions">
          {suggestions.map((item) => (
            <li key={item.id} className="admin-suggestions__item">
              <div className="admin-suggestions__head">
                <span className={levelClass(item.level)}>{item.level}</span>
                <strong>{item.title}</strong>
              </div>
              <p className="admin-suggestions__detail">{item.detail}</p>
            </li>
          ))}
        </ul>
      </div>

      <p className="admin-page__note">
        JSON API: <code className="admin-storage__code">GET /api/admin/storage-metrics</code>
      </p>
    </section>
  );
}
