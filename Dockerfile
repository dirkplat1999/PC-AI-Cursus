# PC & AI Cursus — container image for hosting via Dokploy (or any Docker host).
#
# Uses Debian-based "bookworm-slim" rather than Alpine: better-sqlite3 ships
# prebuilt native binaries for both glibc and musl linux (see
# node_modules/better-sqlite3/prebuilds/), so both work in principle, but
# Alpine's musl libc + minimal base image is a well-known source of native
# addons failing to load at runtime (missing shared libraries the prebuild
# was linked against) even when the prebuild file itself matches — this bit
# us on the first real deploy (container crash-looped with no logs). glibc
# on Debian is the far more commonly tested target for native Node addons.
#
# `npm ci` needs no compiler here — PROVIDED .npmrc (ignore-scripts=true) is
# present, otherwise npm falls back to its default "run node-gyp rebuild"
# behavior and fails (no compiler in this image).
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Persistent data (SQLite database, session secret, backups) — mount a
# volume here in Dokploy so it survives redeploys. See README.md.
VOLUME ["/app/data"]

EXPOSE 3000
CMD ["node", "server.js"]
