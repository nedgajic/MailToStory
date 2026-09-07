import type { AdminGenerationStats } from "@/lib/admin/generation-stats";

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

function LengthBreakdown({
  title,
  counts,
}: {
  title: string;
  counts: AdminGenerationStats["regenerationsByLength"];
}) {
  const total = counts.concise + counts.normal + counts.elaborate;
  return (
    <div className="admin-generation__breakdown-card">
      <h3 className="admin-generation__breakdown-title">{title}</h3>
      <ul className="admin-generation__length-list">
        <li>
          <span>Concise</span>
          <strong>{counts.concise}</strong>
        </li>
        <li>
          <span>Normal</span>
          <strong>{counts.normal}</strong>
        </li>
        <li>
          <span>Elaborate</span>
          <strong>{counts.elaborate}</strong>
        </li>
      </ul>
      <p className="admin-generation__breakdown-foot">
        {total} regeneration{total === 1 ? "" : "s"} total
      </p>
    </div>
  );
}

export function AdminGenerationPanel({
  stats,
}: {
  stats: AdminGenerationStats;
}) {
  const regenShare =
    stats.totalGenerations > 0
      ? Math.round((stats.regenerations / stats.totalGenerations) * 100)
      : 0;

  return (
    <section className="admin-generation">
      <header className="admin-generation__header">
        <h2 className="admin-page__title admin-page__title--section">
          Generation &amp; regenerations
        </h2>
        <p className="admin-page__lead">
          AI usage from <code className="admin-storage__code">StoryGenerationLog</code>.
          Each log row is one Gemini call; anything after the first row for a thread
          counts as a regeneration.
        </p>
      </header>

      <div className="admin-summary admin-summary--storage">
        <MetricCard
          label="Total generations"
          value={String(stats.totalGenerations)}
          hint={`${stats.totalGenerationsLast30Days} in the last 30 days`}
        />
        <MetricCard
          label="Initial stories"
          value={String(stats.initialGenerations)}
          hint="First generation per thread"
        />
        <MetricCard
          label="Regenerations"
          value={String(stats.regenerations)}
          hint={`${regenShare}% of all generations · ${stats.regenerationsLast30Days} in 30d · ${stats.regenerationsLast7Days} in 7d`}
        />
        <MetricCard
          label="Stories re-generated"
          value={String(stats.storiesWithRegenerations)}
          hint={
            stats.storiesWithRegenerations > 0
              ? `Avg ${stats.avgRegenerationsPerRegeneratedStory} regens per story`
              : "No repeat regenerations yet"
          }
        />
      </div>

      <div className="admin-generation__breakdown">
        <LengthBreakdown
          title="Regenerations by length (all time)"
          counts={stats.regenerationsByLength}
        />
        <LengthBreakdown
          title="Regenerations by length (30 days)"
          counts={stats.regenerationsByLengthLast30Days}
        />
        <div className="admin-generation__breakdown-card">
          <h3 className="admin-generation__breakdown-title">
            Current story length (active stories)
          </h3>
          <ul className="admin-generation__length-list">
            <li>
              <span>Concise</span>
              <strong>{stats.currentStoryLength.concise}</strong>
            </li>
            <li>
              <span>Normal</span>
              <strong>{stats.currentStoryLength.normal}</strong>
            </li>
            <li>
              <span>Elaborate</span>
              <strong>{stats.currentStoryLength.elaborate}</strong>
            </li>
          </ul>
          <p className="admin-generation__breakdown-foot">
            Stored on each story after the latest regenerate
          </p>
        </div>
      </div>
    </section>
  );
}
