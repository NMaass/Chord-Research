import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  sessionExpiryISO,
  sessionCookie,
  clearSessionCookie,
  readSessionToken,
} from "./auth";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

// --- Chord validation (must mirror src/audio/chords.ts) ---
const ROOTS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];
const VALID_CHORDS = new Set(
  ROOTS.flatMap((r) => [r, `${r}m`])
);

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

// --- Small helpers ---

function json(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

async function readBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

interface SessionUser {
  id: number;
  username: string;
}

async function getSessionUser(
  request: Request,
  env: Env
): Promise<SessionUser | null> {
  const token = readSessionToken(request);
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT u.id, u.username FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now')`
  )
    .bind(token)
    .first<{ id: number; username: string }>();
  return row ?? null;
}

async function createSession(
  env: Env,
  userId: number
): Promise<{ token: string; cookie: string }> {
  const token = generateSessionToken();
  await env.DB.prepare(
    "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)"
  )
    .bind(token, userId, sessionExpiryISO())
    .run();
  return { token, cookie: sessionCookie(token, 30 * 24 * 60 * 60) };
}

// --- Route handlers ---

async function handleRegister(request: Request, env: Env): Promise<Response> {
  const body = await readBody<{ username?: string; password?: string }>(request);
  const username = body?.username?.trim() ?? "";
  const password = body?.password ?? "";

  if (!USERNAME_RE.test(username)) {
    return error("username must be 3–20 chars: letters, numbers, underscore");
  }
  if (password.length < 6 || password.length > 128) {
    return error("password must be 6–128 characters");
  }

  const existing = await env.DB.prepare(
    "SELECT id FROM users WHERE username = ?"
  )
    .bind(username)
    .first();
  if (existing) return error("username is taken", 409);

  const pwHash = await hashPassword(password);
  const result = await env.DB.prepare(
    "INSERT INTO users (username, password_hash) VALUES (?, ?)"
  )
    .bind(username, pwHash)
    .run();

  const userId = result.meta.last_row_id as number;
  const { cookie } = await createSession(env, userId);
  return json(
    { user: { id: userId, username } },
    201,
    { "Set-Cookie": cookie }
  );
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const body = await readBody<{ username?: string; password?: string }>(request);
  const username = body?.username?.trim() ?? "";
  const password = body?.password ?? "";

  const row = await env.DB.prepare(
    "SELECT id, username, password_hash FROM users WHERE username = ?"
  )
    .bind(username)
    .first<{ id: number; username: string; password_hash: string }>();

  if (!row || !(await verifyPassword(password, row.password_hash))) {
    return error("invalid username or password", 401);
  }

  const { cookie } = await createSession(env, row.id);
  return json(
    { user: { id: row.id, username: row.username } },
    200,
    { "Set-Cookie": cookie }
  );
}

async function handleLogout(request: Request, env: Env): Promise<Response> {
  const token = readSessionToken(request);
  if (token) {
    await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  }
  return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie() });
}

async function handleMe(request: Request, env: Env): Promise<Response> {
  const user = await getSessionUser(request, env);
  return json({ user });
}

interface ResearchBody {
  chords?: unknown;
}

async function handleResearch(request: Request, env: Env): Promise<Response> {
  const body = await readBody<ResearchBody>(request);
  const chords = body?.chords;

  if (
    !Array.isArray(chords) ||
    chords.length !== 4 ||
    !chords.every((c) => typeof c === "string" && VALID_CHORDS.has(c))
  ) {
    return error("a progression is exactly 4 valid chords");
  }

  const chordKey = (chords as string[]).join("|");
  const user = await getSessionUser(request, env);

  const existing = await env.DB.prepare(
    `SELECT p.id, p.chords, p.discovered_at, p.play_count, u.username AS discoverer
     FROM progressions p JOIN users u ON u.id = p.discovered_by
     WHERE p.chord_key = ?`
  )
    .bind(chordKey)
    .first<{
      id: number;
      chords: string;
      discovered_at: string;
      play_count: number;
      discoverer: string;
    }>();

  if (existing) {
    await env.DB.prepare(
      "UPDATE progressions SET play_count = play_count + 1 WHERE id = ?"
    )
      .bind(existing.id)
      .run();
    return json({
      is_new: false,
      claimed: true,
      chords: JSON.parse(existing.chords),
      discovered_by: existing.discoverer,
      discovered_at: existing.discovered_at,
      play_count: existing.play_count + 1,
      progression_id: existing.id,
    });
  }

  // Never played before — only a logged-in researcher can claim it.
  if (!user) {
    return json({ is_new: true, claimed: false, chords });
  }

  // Race-safe: chord_key is UNIQUE, so a concurrent claim turns into a conflict.
  try {
    const inserted = await env.DB.prepare(
      "INSERT INTO progressions (chord_key, chords, discovered_by) VALUES (?, ?, ?)"
    )
      .bind(chordKey, JSON.stringify(chords), user.id)
      .run();
    const id = inserted.meta.last_row_id as number;
    const row = await env.DB.prepare(
      "SELECT discovered_at FROM progressions WHERE id = ?"
    )
      .bind(id)
      .first<{ discovered_at: string }>();
    return json({
      is_new: true,
      claimed: true,
      chords,
      discovered_by: user.username,
      discovered_at: row?.discovered_at ?? new Date().toISOString(),
      play_count: 1,
      progression_id: id,
    });
  } catch {
    // Lost the race — treat as already discovered.
    return handleResearch(request, env);
  }
}

async function handleStats(env: Env): Promise<Response> {
  const totals = await env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM progressions) AS total_progressions,
       (SELECT COUNT(*) FROM users) AS total_researchers,
       (SELECT COALESCE(SUM(play_count), 0) FROM progressions) AS total_plays`
  ).first<{
    total_progressions: number;
    total_researchers: number;
    total_plays: number;
  }>();

  const recent = await env.DB.prepare(
    `SELECT p.id, p.chords, p.discovered_at, u.username AS discovered_by
     FROM progressions p JOIN users u ON u.id = p.discovered_by
     ORDER BY p.discovered_at DESC LIMIT 10`
  ).all<{
    id: number;
    chords: string;
    discovered_at: string;
    discovered_by: string;
  }>();

  const top = await env.DB.prepare(
    `SELECT u.username, COUNT(*) AS count
     FROM progressions p JOIN users u ON u.id = p.discovered_by
     GROUP BY p.discovered_by ORDER BY count DESC, u.username ASC LIMIT 10`
  ).all<{ username: string; count: number }>();

  return json({
    total_progressions: totals?.total_progressions ?? 0,
    total_researchers: totals?.total_researchers ?? 0,
    total_plays: totals?.total_plays ?? 0,
    possible_progressions: 24 ** 4,
    recent: (recent.results ?? []).map((r) => ({
      ...r,
      chords: JSON.parse(r.chords),
    })),
    top_researchers: top.results ?? [],
  });
}

async function handleProfile(env: Env, username: string): Promise<Response> {
  const user = await env.DB.prepare(
    "SELECT id, username, created_at FROM users WHERE username = ?"
  )
    .bind(username)
    .first<{ id: number; username: string; created_at: string }>();
  if (!user) return error("researcher not found", 404);

  const progressions = await env.DB.prepare(
    `SELECT p.id, p.chords, p.discovered_at, p.play_count,
       EXISTS(SELECT 1 FROM favorites f WHERE f.user_id = p.discovered_by AND f.progression_id = p.id) AS is_favorite
     FROM progressions p
     WHERE p.discovered_by = ?
     ORDER BY p.discovered_at DESC`
  )
    .bind(user.id)
    .all<{
      id: number;
      chords: string;
      discovered_at: string;
      play_count: number;
      is_favorite: number;
    }>();

  const all = (progressions.results ?? []).map((p) => ({
    id: p.id,
    chords: JSON.parse(p.chords) as string[],
    discovered_at: p.discovered_at,
    play_count: p.play_count,
    is_favorite: !!p.is_favorite,
  }));

  return json({
    user: { username: user.username, created_at: user.created_at },
    total: all.length,
    progressions: all,
    favorites: all.filter((p) => p.is_favorite),
  });
}

async function handleFavorite(request: Request, env: Env): Promise<Response> {
  const user = await getSessionUser(request, env);
  if (!user) return error("not logged in", 401);

  const body = await readBody<{ progression_id?: number; favorite?: boolean }>(
    request
  );
  const progressionId = body?.progression_id;
  const favorite = body?.favorite === true;
  if (typeof progressionId !== "number") return error("progression_id required");

  // You can only favorite progressions you discovered yourself.
  const owned = await env.DB.prepare(
    "SELECT id FROM progressions WHERE id = ? AND discovered_by = ?"
  )
    .bind(progressionId, user.id)
    .first();
  if (!owned) return error("you can only favorite your own discoveries", 403);

  if (favorite) {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO favorites (user_id, progression_id) VALUES (?, ?)"
    )
      .bind(user.id, progressionId)
      .run();
  } else {
    await env.DB.prepare(
      "DELETE FROM favorites WHERE user_id = ? AND progression_id = ?"
    )
      .bind(user.id, progressionId)
      .run();
  }
  return json({ ok: true });
}

// --- Router ---

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      if (method === "POST" && path === "/api/register") return await handleRegister(request, env);
      if (method === "POST" && path === "/api/login") return await handleLogin(request, env);
      if (method === "POST" && path === "/api/logout") return await handleLogout(request, env);
      if (method === "GET" && path === "/api/me") return await handleMe(request, env);
      if (method === "POST" && path === "/api/research") return await handleResearch(request, env);
      if (method === "GET" && path === "/api/stats") return await handleStats(env);
      if (method === "POST" && path === "/api/favorite") return await handleFavorite(request, env);

      const profileMatch = path.match(/^\/api\/profile\/([a-zA-Z0-9_]{3,20})$/);
      if (method === "GET" && profileMatch) {
        return await handleProfile(env, profileMatch[1]);
      }

      if (path.startsWith("/api/")) return error("not found", 404);
      return env.ASSETS.fetch(request);
    } catch (e) {
      console.error("worker error:", e);
      return error("internal error", 500);
    }
  },
} satisfies ExportedHandler<Env>;
