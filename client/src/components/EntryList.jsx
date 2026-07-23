function formatDuration(startIso, endIso) {
  const ms = Math.max(0, new Date(endIso) - new Date(startIso));
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function formatWhen(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const date = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const startTime = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const endTime = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return { date, range: `${startTime} – ${endTime}` };
}

export default function EntryList({ entries, onEdit, onDelete }) {
  if (!entries.length) {
    return <p className="empty-state">No entries yet. Punch in above, or add one manually.</p>;
  }

  return (
    <div>
      {entries.map((entry) => {
        const { date, range } = formatWhen(entry.clock_in, entry.clock_out);
        return (
          <div className="entry-row" key={entry.id}>
            <div>
              <div className="entry-date">
                {date} <span style={{ fontWeight: 400, color: 'var(--ink-faint)' }}>· {range}</span>
              </div>
              {entry.note ? <div className="entry-note">{entry.note}</div> : null}
            </div>
            <div className="entry-duration">{formatDuration(entry.clock_in, entry.clock_out)}</div>
            <div className="entry-actions">
              <button className="icon-btn" onClick={() => onEdit(entry)}>
                Edit
              </button>
              <button className="icon-btn danger" onClick={() => onDelete(entry.id)}>
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
