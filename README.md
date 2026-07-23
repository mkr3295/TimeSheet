# Punch — a timesheet app you'd actually use

A fast clock-in/clock-out timesheet with real accounts and a real database.
No spreadsheets, no forgetting to log hours after the fact — one big button,
a live running timer, and a week view that adds itself up.

## Why this shape

The core insight: nobody *wants* to fill in a timesheet. They want to hit a
button when they start working and hit it again when they stop, and have the
math happen for them. So the app is built around one primary action —
**Punch In / Punch Out** — with everything else (manual corrections, weekly
totals, history) treated as secondary, for the days you forget.

## Stack

- **Backend:** Node.js, Express, SQLite (via `better-sqlite3`), JWT auth,
  bcrypt password hashing.
- **Frontend:** React (Vite), React Router, no CSS framework — hand-written
  design system in `client/src/index.css`.

## Running it locally

Requires Node.js 18+.

```bash
# 1. Backend
cd server
cp .env.example .env
npm install
npm run dev          # starts on http://localhost:4000

# 2. Frontend (in a second terminal)
cd client
npm install
npm run dev           # starts on http://localhost:5173
```

Open http://localhost:5173, register an account, and start punching in.

The SQLite database file (`server/data.db`) is created automatically on
Open the SQLite DB in DBeaver
In DBeaver, choose:

Database → New Database Connection
Select SQLite
Point it to the file:

data.db
No username/password is needed for SQLite:

Leave auth blank unless you set one separately
Finish and connect.

first run — no external database server needed.

## API overview

| Method | Route                  | Description                          |
|--------|-------------------------|---------------------------------------|
| POST   | `/api/auth/register`    | Create an account                    |
| POST   | `/api/auth/login`       | Log in, returns a JWT                |
| GET    | `/api/auth/me`          | Current user (auth required)         |
| GET    | `/api/entries/status`   | Currently open punch, if any         |
| POST   | `/api/entries/clock-in` | Start a new punch                    |
| POST   | `/api/entries/clock-out`| Close the open punch                 |
| GET    | `/api/entries`          | List entries in a date range         |
| POST   | `/api/entries`          | Add a manual entry                   |
| PUT    | `/api/entries/:id`      | Edit an entry                        |
| DELETE | `/api/entries/:id`      | Delete an entry                      |
| GET    | `/api/entries/summary`  | Hours per day for the current week   |

All `/api/entries/*` routes require `Authorization: Bearer <token>`.

## Design notes
~
The visual language borrows from physical time clocks: a chunky punch
button with a pressed state, monospace digits for anything that counts
(the live timer, hour totals), and an ink/paper palette instead of the
default cream-and-terracotta AI-generated look. Full token list at the top
of `client/src/index.css`.

## What I'd add next

- CSV/PDF export for payroll
- Manager view to see a team's hours
- Overtime and break-time rules
