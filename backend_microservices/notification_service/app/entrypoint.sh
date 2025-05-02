#!/usr/bin/env bash
set -e

# Validate required environment variables
: "${DATABASE_HOST:?Need to set DATABASE_HOST}"
: "${DATABASE_PORT:?Need to set DATABASE_PORT}"
: "${SERVICE_PORT:?Need to set SERVICE_PORT}"
: "${WAIT_TIMEOUT:?Need to set WAIT_TIMEOUT}"

# Wait for the database to be ready
./app/wait-for-it.sh "${DATABASE_HOST}" "${DATABASE_PORT}" "${WAIT_TIMEOUT}"

# Start Celery worker and beat in background
echo "[Entry] Starting Celery worker..."
celery -A notification_service.app.celery_app worker --loglevel=info &

echo "[Entry] Starting Celery beat..."
celery -A notification_service.app.celery_app beat --loglevel=info &

# Start FastAPI application
echo "[Entry] Starting FastAPI on port ${SERVICE_PORT}..."
exec uvicorn notification_service.app.main:app --host 0.0.0.0 --port "${SERVICE_PORT}"