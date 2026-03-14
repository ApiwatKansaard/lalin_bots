FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm install -g typescript && tsc && npm uninstall -g typescript

EXPOSE 3000

CMD ["node", "dist/index.js"]
