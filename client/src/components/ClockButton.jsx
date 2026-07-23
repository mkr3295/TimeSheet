import { useEffect, useState } from 'react';

function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function ClockButton({ openEntry, busy, onClockIn, onClockOut }) {
  const [note, setNote] = useState('');
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    if (!openEntry) {
      setElapsed('00:00:00');
      return;
    }
    const start = new Date(openEntry.clock_in).getTime();
    const tick = () => setElapsed(formatElapsed(Date.now() - start));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [openEntry]);

  function handleClick() {
    if (openEntry) {
      onClockOut(note);
      setNote('');
    } else {
      onClockIn();
    }
  }

  return (
    <div className="punch-panel">
      <button
        type="button"
        className={`punch-btn${openEntry ? ' is-active' : ''}`}
        onClick={handleClick}
        disabled={busy}
      >
        {openEntry ? 'PUNCH\u00A0OUT' : 'PUNCH\u00A0IN'}
      </button>

      <div className="punch-status">
        <span className={`state${openEntry ? ' live' : ''}`}>
          {openEntry ? 'Clocked in' : 'Not clocked in'}
        </span>
        <span className="punch-timer">{elapsed}</span>
        {openEntry && (
          <div className="field punch-note-field">
            <label htmlFor="shift-note">Note for this shift (optional)</label>
            <input
              id="shift-note"
              type="text"
              placeholder="What are you working on?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
