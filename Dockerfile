# PC & AI Cursus — container image for hosting via Dokploy (or any Docker host).
#
# better-sqlite3 ships prebuilt native binaries for both glibc and musl
# linux (see node_modules/better-sqlite3/prebuilds/), so no compiler
# toolchain is needed here — a plain `npm ci` is enough.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Persistent data (SQLite database, session secret, backups) — mount a
# volume here in Dokploy so it survives redeploys. See README.md.
VOLUME ["/app/data"]

EXPOSE 3000
CMD ["node", "server.js"]
