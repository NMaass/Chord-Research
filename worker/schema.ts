interface DatabaseEnv {
  DB: D1Database;
}

let schemaReady: Promise<void> | null = null;

export function ensureSchema(env: DatabaseEnv): Promise<void> {
  if (!schemaReady) {
    schemaReady = env.DB
      .batch([
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE COLLATE NOCASE,
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )`),
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS sessions (
          token TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
          expires_at TEXT NOT NULL
        )`),
        env.DB.prepare(
          "CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)"
        ),
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS progressions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chord_key TEXT NOT NULL UNIQUE,
          chords TEXT NOT NULL,
          discovered_by INTEGER NOT NULL REFERENCES users(id),
          discovered_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
          play_count INTEGER NOT NULL DEFAULT 1
        )`),
        env.DB.prepare(
          "CREATE INDEX IF NOT EXISTS idx_progressions_discoverer ON progressions(discovered_by)"
        ),
        env.DB.prepare(
          "CREATE INDEX IF NOT EXISTS idx_progressions_discovered_at ON progressions(discovered_at DESC)"
        ),
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS favorites (
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          progression_id INTEGER NOT NULL REFERENCES progressions(id) ON DELETE CASCADE,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
          PRIMARY KEY (user_id, progression_id)
        )`),
      ])
      .then(() => undefined)
      .catch((error: unknown) => {
        schemaReady = null;
        throw error;
      });
  }

  return schemaReady;
}
