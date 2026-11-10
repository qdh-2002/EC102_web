#!/bin/sh
set -e
# Apply schema changes (non-destructive) and make sure the first admin exists.
npx prisma db push --skip-generate
npx tsx prisma/seed.ts
exec node server.js
