import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ClockButton from '../components/ClockButton.jsx';
import WeekSummary from '../components/WeekSummary.jsx';
import EntryList from '../components/EntryList.jsx';
import EntryForm from '../components/EntryForm.jsx';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [openEntry, setOpenEntry] = useState(null);
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const refresh = useCallback(async () => {
    const [statusRes, entriesRes, summaryRes] = await Promise.all([
      api.status(),
      api.list(),
      api.summary(),
    ]);
    setOpenEntry(statusRes.open);
    setEntries(entriesRes.entries.filter((e) => e.clock_out));
    setSummary(summaryRes);
  }, []);

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, [refresh]);

  async function handleClockIn() {
    setBusy(true);
    setError('');
    try {
      await api.clockIn();
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleClockOut(note) {
    setBusy(true);
    setError('');
    try {
      await api.clockOut(note);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(payload) {
    await api.create(payload);
    setShowForm(false);
    await refresh();
  }

  async function handleUpdate(payload) {
    await api.update(editingEntry.id, payload);
    setEditingEntry(null);
    await refresh();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    await api.remove(id);
    await refresh();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" />
          <span className="brand-name">Punch</span>
        </div>
        <div className="topbar-user">
          <span>{user?.name}</span>
          <button className="btn btn-ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="main">
        {error && <div className="form-error">{error}</div>}

        <section className="card">
          <h2>Clock</h2>
          <p className="card-sub">One button. Punch in when you start, punch out when you stop.</p>
          <ClockButton
            openEntry={openEntry}
            busy={busy}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
          />
        </section>

        <WeekSummary summary={summary} />

        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <h2>History</h2>
              <p className="card-sub">Every punch and manual entry, most recent first.</p>
            </div>
            {!showForm && (
              <button className="btn btn-ghost" onClick={() => setShowForm(true)}>
                + Add entry
              </button>
            )}
          </div>

          {showForm && (
            <div style={{ marginBottom: 20 }}>
              <EntryForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
            </div>
          )}

          {editingEntry && (
            <div style={{ marginBottom: 20 }}>
              <EntryForm
                initial={editingEntry}
                onSubmit={handleUpdate}
                onCancel={() => setEditingEntry(null)}
              />
            </div>
          )}

          <EntryList entries={entries} onEdit={setEditingEntry} onDelete={handleDelete} />
        </section>
      </main>
    </div>
  );
}
