#!/bin/sh
set -e

# Wait for Postgres to be ready
until nc -z postgres 5432; do
  echo "Waiting for Postgres..."
  sleep 2
done

# Wait for Kafka (Redpanda) to be ready
until nc -z redpanda 9092; do
  echo "Waiting for Kafka..."
  sleep 2
done



npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma


npx prisma generate --schema=packages/db/prisma/schema.prisma
# Start the app (pass all arguments)
if [ "$1" = "web" ]; then
  npm run build --workspace=web
  npm run start --workspace=web
elif [ "$1" = "collector" ]; then
  npm run build --workspace=collector
  npm run start --workspace=collector
elif [ "$1" = "worker" ]; then
  npm run build --workspace=worker
  npm run start --workspace=worker
else
  echo "Unknown app: $1"
  exit 1
fi
