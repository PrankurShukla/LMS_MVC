#!/bin/sh
set -e

echo "Starting entrypoint script..."

# Wait for the database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Run database seed
echo "Seeding the database..."
npx prisma db seed

# Start the application
echo "Starting the application..."
exec node dist/server.js 