FROM node:20-slim AS builder

WORKDIR /app

COPY dashboard/package*.json ./
RUN npm install

COPY dashboard/ ./

RUN npm run build

# ── Production ──────────────────────────────────────────
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
