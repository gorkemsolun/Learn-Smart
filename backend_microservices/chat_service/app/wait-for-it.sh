#!/usr/bin/env bash
# wait-for-it.sh: Waits until a given host and port become available.
HOST=$1
PORT=$2
TIMEOUT=$3

echo "Waiting for $HOST:$PORT for up to $TIMEOUT seconds..."

for i in $(seq 1 $TIMEOUT); do
  # Try connecting with netcat (nc). If the port is open, exit with success.
  output=$(nc -vz "$HOST" "$PORT" 2>&1)
  status=$?
  echo "Attempt $i: $output"
  
  if [ $status -eq 0 ]; then
    echo "Connection to $HOST:$PORT succeeded."
    # Run the MySQL initialization commands if needed.
    mysql -h "$DATABASE_HOST" -P "$DATABASE_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" <<EOF
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DATABASE_USER}'@'%';
FLUSH PRIVILEGES;
EOF
    exit 0
  fi
  sleep 1
done
echo "Error: $HOST:$PORT is not available after $TIMEOUT seconds." >&2
exit 1