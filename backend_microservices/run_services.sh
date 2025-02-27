#!/bin/bash

# Set PYTHONPATH
export PYTHONPATH="/home/bil/edux/backend_microservices"
echo "PYTHONPATH set to $PYTHONPATH"

# Define services and their respective ports
declare -A services=(
    ["auth_service"]=8001
    ["chat_service"]=8002
    ["course_service"]=8003
    ["filemanager_service"]=8004
    ["genai_service"]=8005
    ["user_service"]=8007
)

# Base directory where the services are located
BASE_DIR="/home/bil/edux/backend_microservices"

# Start each service
for service in "${!services[@]}"; do
    port=${services[$service]}
    service_path="$BASE_DIR/$service/app"
    
    if [ -d "$service_path" ]; then
        cd "$service_path" || exit
        nohup uvicorn main:app --reload --host 127.0.0.1 --port "$port" > "$BASE_DIR/$service.log" 2>&1 &
        echo "$service started on port $port (logging to $BASE_DIR/$service/run.log)"
    else
        echo "Error: Directory $service_path not found!"
    fi
done

echo "All services started successfully!"

