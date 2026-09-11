# PC & AI Cursus — container image for hosting via Dokploy (or any Docker host).
#
# better-sqlite3's prebuilt binaries turned out to segfault at runtime in
# this environment (require() succeeds, but opening the actual database
# crashes with a native SIGSEGV — confirmed by exec'ing into a real
# container and testing step by step) — likely an ABI mismatch between the
# prebuild and this exact Node build, not a platform/arch/musl issue (we
# also ruled out Alpine vs. Debian, and confirmed the CPU is plain x86_64).
# So instead of relying on the bundled prebuild, we compile it from source
# for this exact image: --ignore-scripts=false overrides this project's
# .npmrc (ignore-scripts=true, which is what lets local Windows dev/CI
# installs skip compilation and use the prebuild there, where it works
# fine) just for this one build step, and the toolchain below gives
# node-gyp a compiler to work with.
FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts=false

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
