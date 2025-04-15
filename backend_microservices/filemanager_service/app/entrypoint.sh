#!/usr/bin/env bash
set -e

# Check that required environment variables are set. If any are missing, print an error and exit.
if [ -z "$DATABASE_HOST" ]; then
  echo "Error: DATABASE_HOST is not set."
  exit 1
fi

if [ -z "$DATABASE_PORT" ]; then
  echo "Error: DATABASE_PORT is not set."
  exit 1
fi

if [ -z "$SERVICE_PORT" ]; then
  echo "Error: SERVICE_PORT is not set."
  exit 1
fi

if [ -z "$WAIT_TIMEOUT" ]; then
  echo "Error: WAIT_TIMEOUT is not set."
  exit 1
fi
echo "PYTHONPATH is set to: $PYTHONPATH"
# Wait for the database using the wait-for-it.sh script.
./app/wait-for-it.sh "$DATABASE_HOST" "$DATABASE_PORT" "$WAIT_TIMEOUT"

# Once the database is ready, start your application.
echo "Database is ready. Starting service on port $SERVICE_PORT..."
exec uvicorn app.main:app --host 0.0.0.0 --port "$SERVICE_PORT"
