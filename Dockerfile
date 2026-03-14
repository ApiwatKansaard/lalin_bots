# ── Build Bot ───────────────────────────────────────────
FROM node:20-slim AS bot-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npx tsc

# ── Build Dashboard ─────────────────────────────────────
FROM node:20-slim AS dash-builder

WORKDIR /app

COPY dashboard/package*.json ./
RUN npm ci

COPY dashboard/ ./

RUN npm run build

# ── Production ──────────────────────────────────────────
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production

# Bot dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Bot dist + assets
COPY --from=bot-builder /app/dist ./dist
COPY assets/ ./assets/

# Dashboard standalone
COPY --from=dash-builder /app/.next/standalone ./dashboard
COPY --from=dash-builder /app/.next/static ./dashboard/.next/static
COPY --from=dash-builder /app/public ./dashboard/public

# Start script
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 3000

CMD ["./start.sh"]
