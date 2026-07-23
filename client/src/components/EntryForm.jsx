import { useState } from 'react';

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

export default function EntryForm({ initial, onSubmit, onCancel }) {
  const [clockIn, setClockIn] = useState(toLocalInput(initial?.clock_in));
  const [clockOut, setClockOut] = useState(toLocalInput(initial?.clock_out));
  const [note, setNote] = useState(initial?.note || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSubmit({
        clock_in: new Date(clockIn).toISOString(),
        clock_out: new Date(clockOut).toISOString(),
        note,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="manual-form" onSubmit={handleSubmit}>
      {error && (
        <div className="form-error field-wide">{error}</div>
      )}
      <div className="field">
        <label htmlFor="clock-in">Start</label>
        <input
          id="clock-in"
          type="datetime-local"
          value={clockIn}
          onChange={(e) => setClockIn(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="clock-out">End</label>
        <input
          id="clock-out"
          type="datetime-local"
          value={clockOut}
          onChange={(e) => setClockOut(e.target.value)}
          required
        />
      </div>
      <div className="field field-wide">
        <label htmlFor="entry-note">Note (optional)</label>
        <input id="entry-note" type="text" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="actions">
        <button className="btn btn-primary" type="submit" style={{ width: 'auto' }} disabled={busy}>
          {busy ? 'Saving…' : initial ? 'Save changes' : 'Add entry'}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
