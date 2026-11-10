# Deployment

The site is a single Next.js server plus a database and a folder of uploaded files.
Both the database and the upload folder **must be persistent and backed up**.

## Option A (recommended): Docker on any Linux server

Works on a department VM, SEASnet-hosted server, AWS Lightsail / EC2, DigitalOcean, Render or Fly.io
(with a persistent volume).

```bash
git clone <your repo> ec102 && cd ec102
cp .env.example .env
#   set AUTH_SECRET (openssl rand -base64 48), ADMIN_EMAIL, ADMIN_PASSWORD, SITE_URL
#   set SEED_SAMPLE_CONTENT=false for a clean start without demo content
docker compose up -d --build
```

The container applies schema changes and ensures the admin account exists on every start, then serves on
port 3000. Put it behind HTTPS (Caddy, nginx, or your host's load balancer). Example Caddyfile:

```
ec102.example.ucla.edu {
  reverse_proxy localhost:3000
}
```

If you use nginx, allow large recording uploads with `client_max_body_size 4g;` and `proxy_request_buffering off;`
(Caddy needs no change).

**Storage sizing:** an hour of lecture video at 720p is roughly 300–700 MB. Plan disk for about 20 lectures
per term; since recordings are reused across years, this does not grow much over time.

Everything persistent lives in the `ec102-data` Docker volume (`/data/ec102.db` and `/data/uploads`).

**Updating:** `git pull && docker compose up -d --build`.

## Option B: plain Node.js

```bash
npm ci
cp .env.example .env    # edit as above; set UPLOAD_DIR to a persistent path
npx prisma db push
npm run db:seed
npm run build
node .next/standalone/server.js     # or run under pm2 / systemd
```

When running the standalone server yourself, copy static assets once after each build:
`cp -r .next/static .next/standalone/.next/static`.

## Option C: Vercel or other serverless hosts

Serverless hosts have no persistent disk, so two changes are needed:

1. **Database:** use PostgreSQL (Neon, Supabase, Vercel Postgres). In `prisma/schema.prisma` change
   `provider = "sqlite"` to `provider = "postgresql"` and set `DATABASE_URL`. Run `npx prisma db push` once.
2. **Files:** uploads would be lost. Either attach materials as links (Box / Google Drive / Bruin Learn), which
   the admin fully supports, or replace `src/lib/storage.ts` with an S3/R2/Blob implementation (three functions:
   `saveUpload`, `resolveUpload`/streaming, `deleteUpload`).

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | `file:./dev.db` (SQLite) or a PostgreSQL URL |
| `AUTH_SECRET` | yes in production | 32+ random characters; signs staff sessions. Changing it signs everyone out. |
| `UPLOAD_DIR` | yes | Persistent folder for uploaded files |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | first run | First admin account (created by the seed; never overwritten later except role/active) |
| `SITE_URL` | recommended | Public URL, used in metadata |
| `MAX_UPLOAD_MB` | no | Max size for files attached through the admin forms (default 100) |
| `MAX_VIDEO_MB` | no | Max size of an uploaded recording (default 4096). Recordings are streamed to disk, not held in memory. |
| `SEED_SAMPLE_CONTENT` | no | `false` to skip demo content |
| `ALLOW_INSECURE_COOKIES` | no | Set only when testing production mode over plain http |

## Backups

- SQLite: copy `ec102.db` (e.g. nightly `sqlite3 /data/ec102.db ".backup /backups/ec102-$(date +%F).db"`).
- Uploads: copy the `uploads` folder (rsync / object storage).
- PostgreSQL: your provider's automatic backups, or `pg_dump`.

## Security notes

- Students never log in; only staff accounts exist. Passwords are bcrypt-hashed; sessions are signed,
  http-only, SameSite cookies that expire after 12 hours. Deactivating an account takes effect immediately.
- Failed sign-ins are throttled (8 per 15 minutes per email + IP).
- Every admin page and server action re-checks the signed-in user and role; the middleware is only a first gate.
- Uploaded files are never served directly: `/files/[id]` checks status, access level and release time on each request.
  Draft items, draft terms, staff-only files, unreleased solutions and Bruin Learn-only files return 403 to the public.
- **Copyright:** anything with access "Public on this site" can be downloaded by anyone with the link. Keep
  copyrighted or restricted material (textbook scans, recordings with student faces, exam solutions) on
  Bruin Learn and use the "Bruin Learn only" access level, which links students there behind UCLA login.
- If you want to add UCLA Shibboleth/SSO for staff later, replace `login()` in `src/lib/auth.ts`; the rest of the app
  only relies on `getStaff()` / `requireStaff()`.
