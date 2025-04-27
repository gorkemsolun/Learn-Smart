#!/bin/bash

# Get the absolute path of the backend_microservices directory
BASE_DIR="$(pwd)"
if [[ ! "$BASE_DIR" =~ /backend_microservices$ ]]; then
    echo "Error: This script must be run from the backend_microservices directory"
    exit 1
fi

# Set PYTHONPATH to current directory
export PYTHONPATH="$BASE_DIR"

# Define services and their respective ports
declare -A services=(
    ["auth_service"]=8001
    ["chat_service"]=8002
    ["course_service"]=8003
    ["filemanager_service"]=8004
    ["genai_service"]=8005
    ["user_service"]=8007
)

# Create logs directory if it doesn't exist
LOGS_DIR="$BASE_DIR/logs"
if [ ! -d "$LOGS_DIR" ]; then
    mkdir -p "$LOGS_DIR"
fi

# Track successful starts
success_count=0
total_services=${#services[@]}

# Start each service
for service in "${!services[@]}"; do
    port=${services[$service]}
    service_path="$BASE_DIR/$service/app"
    
    if [ -d "$service_path" ]; then
        echo "Starting $service on port $port..."
        cd "$service_path" || exit
        nohup uvicorn main:app --reload --host 127.0.0.1 --port "$port" > "$LOGS_DIR/$service.log" 2>&1 &
        last_pid=$!
        
        # Check if process started successfully
        if ps -p $last_pid > /dev/null; then
            echo "✓ $service started successfully (PID: $last_pid)"
            ((success_count++))
        else
            echo "✗ Failed to start $service on port $port!"
        fi
        
        # Return to base directory
        cd "$BASE_DIR" || exit
    else
        echo "✗ Directory not found: $service/app"
    fi
done

# Print summary based on success
if [ $success_count -eq $total_services ]; then
    echo -e "\n✅ All services started successfully!"
else
    echo -e "\n⚠️  Started $success_count out of $total_services services"
fi

echo -e "\nLogs available in: ./logs/"