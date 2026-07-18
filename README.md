# Chord Research Inc.

In the spirit of [numberresearch.xyz](https://numberresearch.xyz): a collaborative
effort to find and document every possible four-chord progression.

Pick four basic piano chords (12 majors + 12 minors = 331,776 possible
progressions), press play, and they're performed at **100 BPM**, one chord per
bar. If nobody has ever played that exact progression before, it's added to the
record and attributed to you with a timestamp — you've done original research.

## Stack

- **Frontend**: React + TypeScript + Vite (`src/`)
- **Backend**: Cloudflare Worker (`worker/`) — REST API + serves the built SPA
- **Database**: Cloudflare D1 (SQLite) — users, sessions, progressions, favorites
- **Audio**: Web Audio API synthesis (`src/audio/`) — no samples needed
- **Auth**: username + password, PBKDF2 hashing (Web Crypto), httpOnly session cookie

## Local development

```sh
npm install

# create + migrate the local database
npm run db:migrate:local

# build the frontend and run the worker (serves everything on :8787)
npm run dev:worker
```

Open http://localhost:8787.

For frontend-only iteration with hot reload, run `npx wrangler dev` and
`npm run dev` side by side — Vite proxies `/api` to the worker.

## Deploying to Cloudflare

1. Log in and create the production database:

   ```sh
   npx wrangler login
   npx wrangler d1 create chord-research
   ```

2. Copy the `database_id` from the output into `wrangler.toml`
   (replacing the placeholder).

3. Migrate and deploy:

   ```sh
   npm run db:migrate
   npm run deploy
   ```

The worker serves the SPA with client-side routing fallback
(`not_found_handling = "single-page-application"`), so `/profile/you`,
`/stats`, etc. all work as deep links.

## API

| Method | Route | Description |
| --- | --- | --- |
| POST | `/api/register` | create account (sets session cookie) |
| POST | `/api/login` | log in |
| POST | `/api/logout` | log out |
| GET | `/api/me` | current user |
| POST | `/api/research` | submit 4 chords; claims the progression if it's new |
| GET | `/api/stats` | totals, recent discoveries, top researchers |
| GET | `/api/profile/:username` | a researcher's discoveries + favorites |
| POST | `/api/favorite` | star/unstar one of your own discoveries |
