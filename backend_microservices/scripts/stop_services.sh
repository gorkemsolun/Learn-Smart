#!/bin/bash

# Get the absolute path of the backend_microservices directory
BASE_DIR="$(pwd)"
if [[ ! "$BASE_DIR" =~ /backend_microservices$ ]]; then
    echo "Error: This script must be run from the backend_microservices directory"
    exit 1
fi

# Define the logs directory
LOGS_DIR="$BASE_DIR/logs"

# Stop all uvicorn processes
echo "Stopping all services..."
if pgrep uvicorn > /dev/null; then
    killall uvicorn
    echo "✓ All uvicorn processes terminated"
else
    echo "! No uvicorn processes found running"
fi

# Clear logs if they exist
if [ -d "$LOGS_DIR" ]; then
    rm -f "$LOGS_DIR"/*
    echo "✓ Logs cleared"
else
    echo "! Logs directory not found"
fi

echo "✅ All services stopped successfully!"
