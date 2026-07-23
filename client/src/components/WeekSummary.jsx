export default function WeekSummary({ summary }) {
  if (!summary) return null;

  const maxHours = Math.max(1, ...summary.days.map((d) => d.hours));
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="card">
      <h2>This week</h2>
      <p className="card-sub">Hours logged per day, Monday through Sunday.</p>

      <div className="week-grid">
        {summary.days.map((d) => (
          <div className="week-bar-col" key={d.date}>
            <div
              className={`week-bar${d.date === todayStr ? ' today' : ''}`}
              style={{ height: `${Math.max(3, (d.hours / maxHours) * 100)}%` }}
              title={d.duration}
            />
            <span className="week-bar-label">{d.label}</span>
          </div>
        ))}
      </div>

      <div className="week-total">
        Total: <strong>{summary.weekTotalDuration}</strong>
      </div>
    </div>
  );
}
