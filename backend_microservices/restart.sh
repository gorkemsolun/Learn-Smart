#!/bin/bash

# Initialize variables with default values
USERNAME=""
PASSWORD=""

# Process command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -u|--user)
      USERNAME="$2"
      shift 2
      ;;
    -p|--password)
      PASSWORD="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 -u|--user username -p|--password password"
      exit 1
      ;;
  esac
done

# Check if username and password are provided
if [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
  echo "Usage: $0 -u|--user <mysql_username> -p|--password <mysql_password>"
  exit 1
fi

bash stop_services.sh
python delete_all_data.py --user "$USERNAME" --password "$PASSWORD"
bash run_services.sh
