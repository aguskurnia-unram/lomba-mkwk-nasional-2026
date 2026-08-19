-- Skema penilaian juri Lomba Project MKWK Nasional 2026.
-- Terapkan dengan:
--   npx wrangler d1 execute mkwk-juri-db --remote --file=./migrations/0001_init.sql
-- (hapus --remote untuk menerapkan ke database lokal saat development)

CREATE TABLE IF NOT EXISTS scores (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  team_slug   TEXT NOT NULL,
  juror_name  TEXT NOT NULL,
  -- a1-a3: Video (pra-event) · b1-b2: Poster (pra-event) · c1-c4: Presentasi finalis (hari-H)
  criterion   TEXT NOT NULL CHECK (criterion IN ('a1','a2','a3','b1','b2','c1','c2','c3','c4')),
  score       REAL NOT NULL CHECK (score >= 0 AND score <= 100),
  note        TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (team_slug, juror_name, criterion)
);

CREATE INDEX IF NOT EXISTS idx_scores_team ON scores(team_slug);
CREATE INDEX IF NOT EXISTS idx_scores_juror ON scores(juror_name);
