#!/bin/sh

# Start Next.js dashboard on port 3001 (internal)
cd /app/dashboard && PORT=3001 HOSTNAME=0.0.0.0 node server.js &

# Start Express bot on port 3000 (public)
cd /app && exec node dist/index.js
