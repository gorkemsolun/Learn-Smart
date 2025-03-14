#!/bin/bash

# Set PYTHONPATH
export PYTHONPATH="/home/bil/edux/backend_microservices"

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

# Track successful starts
success_count=0
total_services=${#services[@]}

# Start each service
for service in "${!services[@]}"; do
    port=${services[$service]}
    service_path="$BASE_DIR/$service/app"
    
    if [ -d "$service_path" ]; then
        cd "$service_path" || exit
        nohup uvicorn main:app --reload --host 127.0.0.1 --port "$port" > "$BASE_DIR/logs/$service.log" 2>&1 &
        last_pid=$!
        
        # Check if process started successfully
        if ps -p $last_pid > /dev/null; then
            ((success_count++))
        else
            echo "WARNING: Failed to start $service on port $port!"
        fi
    else
        echo "ERROR: Directory $service_path not found!"
    fi
done

# Print summary based on success
if [ $success_count -eq $total_services ]; then
    echo -e "All services started successfully!\n"
else
    echo -e "WARNING: Started $success_count out of $total_services services.\n"
fi
