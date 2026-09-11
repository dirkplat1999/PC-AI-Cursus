# PC & AI Cursus — container image for hosting via Dokploy (or any Docker host).
#
# Pinned to Node 22 (not 20): better-sqlite3@13 segfaults on Node 20.20.2 in
# this environment (confirmed by exec'ing into a running container —
# require() succeeds, but opening an actual database crashes with SIGSEGV,
# both with the bundled prebuild AND a from-source rebuild; plain sqlite3
# via apt works fine, ruling out the CPU/platform itself). Node 22/24 is
# what this project has been developed and tested against locally all
# along, without ever hitting this, so it's the safe choice here too.
#
# better-sqlite3 ships prebuilt native binaries for glibc linux (see
# node_modules/better-sqlite3/prebuilds/), so no compiler is needed —
# PROVIDED .npmrc (ignore-scripts=true) is present, otherwise npm falls
# back to its default "run node-gyp rebuild" behavior instead of using it.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Persistent data (SQLite database, session secret, backups) — mount a
# volume here in Dokploy so it survives redeploys. See README.md.
VOLUME ["/app/data"]

EXPOSE 3000
CMD ["node", "server.js"]
