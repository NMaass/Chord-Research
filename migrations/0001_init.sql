-- Chord Research schema

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX idx_sessions_user ON sessions(user_id);

CREATE TABLE progressions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chord_key TEXT NOT NULL UNIQUE,
  chords TEXT NOT NULL, -- JSON array of chord names, e.g. ["C","Am","F","G"]
  discovered_by INTEGER NOT NULL REFERENCES users(id),
  discovered_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  play_count INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_progressions_discoverer ON progressions(discovered_by);
CREATE INDEX idx_progressions_discovered_at ON progressions(discovered_at DESC);

CREATE TABLE favorites (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  progression_id INTEGER NOT NULL REFERENCES progressions(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_id, progression_id)
);
