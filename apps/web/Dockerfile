# Dockerfile for web (Next.js)
FROM node:25.4.0-alpine

WORKDIR /app

# Copy root package.json and lockfile
COPY package.json ./
COPY package-lock.json ./

# Copy the web package.json
COPY apps/web/package.json ./apps/web/package.json


RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
