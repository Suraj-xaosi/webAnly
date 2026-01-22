FROM node:25.4.0-alpine

WORKDIR /app

# Copy root package.json and lockfile
COPY package.json ./
COPY package-lock.json ./

# Copy the collector package.json
COPY apps/collector/package.json ./apps/collector/package.json

RUN npm ci

COPY . .
RUN npm run build

EXPOSE 4000
CMD ["node", "dist/index.js"]
# Dockerfile for collector service