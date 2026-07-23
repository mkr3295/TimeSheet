import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function getOpenEntry(userId) {
  return db
    .prepare('SELECT * FROM entries WHERE user_id = ? AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1')
    .get(userId);
}

// --- Live punch status -------------------------------------------------
router.get('/status', (req, res) => {
  const open = getOpenEntry(req.userId);
  res.json({ open: open || null });
});

router.post('/clock-in', (req, res) => {
  const existingOpen = getOpenEntry(req.userId);
  if (existingOpen) {
    return res.status(409).json({ error: 'You are already punched in.', open: existingOpen });
  }

  const now = new Date().toISOString();
  const info = db
    .prepare("INSERT INTO entries (user_id, clock_in, source) VALUES (?, ?, 'punch')")
    .run(req.userId, now);

  const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ entry });
});

router.post('/clock-out', (req, res) => {
  const { note } = req.body || {};
  const open = getOpenEntry(req.userId);
  if (!open) {
    return res.status(409).json({ error: 'You are not currently punched in.' });
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE entries SET clock_out = ?, note = ?, updated_at = datetime('now') WHERE id = ?").run(
    now,
    note?.trim() || '',
    open.id
  );

  const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(open.id);
  res.json({ entry });
});

// --- History / CRUD ------------------------------------------------------
router.get('/', (req, res) => {
  const { from, to } = req.query;
  let query = 'SELECT * FROM entries WHERE user_id = ?';
  const params = [req.userId];

  if (from) {
    query += ' AND clock_in >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND clock_in <= ?';
    params.push(to);
  }
  query += ' ORDER BY clock_in DESC';

  const entries = db.prepare(query).all(...params);
  res.json({ entries });
});

router.post('/', (req, res) => {
  const { clock_in, clock_out, note } = req.body || {};
  if (!clock_in || !clock_out) {
    return res.status(400).json({ error: 'Start and end time are required.' });
  }
  if (new Date(clock_out) <= new Date(clock_in)) {
    return res.status(400).json({ error: 'End time must be after start time.' });
  }

  const info = db
    .prepare("INSERT INTO entries (user_id, clock_in, clock_out, note, source) VALUES (?, ?, ?, ?, 'manual')")
    .run(req.userId, clock_in, clock_out, note?.trim() || '');

  const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ entry });
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM entries WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Entry not found.' });

  const clock_in = req.body?.clock_in ?? existing.clock_in;
  const clock_out = req.body?.clock_out ?? existing.clock_out;
  const note = req.body?.note ?? existing.note;

  if (clock_out && new Date(clock_out) <= new Date(clock_in)) {
    return res.status(400).json({ error: 'End time must be after start time.' });
  }

  db.prepare(
    "UPDATE entries SET clock_in = ?, clock_out = ?, note = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(clock_in, clock_out, note, existing.id);

  const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(existing.id);
  res.json({ entry });
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM entries WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Entry not found.' });

  db.prepare('DELETE FROM entries WHERE id = ?').run(existing.id);
  res.status(204).end();
});

// --- Summary: hours per day for the current week -------------------------
router.get('/summary', (req, res) => {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }

  const entries = db
    .prepare('SELECT * FROM entries WHERE user_id = ? AND clock_in >= ? AND clock_out IS NOT NULL')
    .all(req.userId, monday.toISOString());

  function formatHourMinute(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }

  const totals = days.map((d) => {
    const dayStart = new Date(d);
    const dayEnd = new Date(d);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const seconds = entries
      .filter((e) => {
        const start = new Date(e.clock_in);
        return start >= dayStart && start < dayEnd;
      })
      .reduce((sum, e) => sum + (new Date(e.clock_out) - new Date(e.clock_in)) / 1000, 0);

    return {
      date: dayStart.toISOString().slice(0, 10),
      label: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
      hours: Math.round((seconds / 3600) * 100) / 100,
      duration: formatHourMinute(seconds),
    };
  });

  const weekTotalSeconds = entries.reduce((sum, e) => sum + (new Date(e.clock_out) - new Date(e.clock_in)) / 1000, 0);
  const weekTotalHours = Math.round((weekTotalSeconds / 3600) * 100) / 100;
  const weekTotalDuration = formatHourMinute(weekTotalSeconds);

  res.json({ days: totals, weekTotalHours, weekTotalDuration });
});

export default router;
