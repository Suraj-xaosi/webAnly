# Dockerfile for worker service
FROM node:25.4.0-alpine

WORKDIR /app

# Copy root package.json and lockfile
COPY package.json ./
COPY package-lock.json ./

# Copy the worker package.json
COPY apps/worker/package.json ./apps/worker/package.json

RUN npm ci

COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
