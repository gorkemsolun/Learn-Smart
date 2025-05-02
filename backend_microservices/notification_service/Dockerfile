FROM python:3.12.8

# Install dependencies (MySQL client, netcat)
RUN apt-get update && \
    apt-get install -y default-mysql-client netcat-openbsd && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /notification_service

# Install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy service code
COPY . .
RUN chmod +x app/wait-for-it.sh app/entrypoint.sh

# Create a system group & user, then take ownership of your app directory
RUN groupadd --system app \
 && useradd  --system --gid app --create-home --home-dir /home/app app \
 && chown -R app:app /notification_service

# Switch to the “app” user for all future commands
USER app

# Expose service port
EXPOSE 8010

# Set import path
ENV PYTHONPATH=/:/notification_service/app

# Entrypoint script will start Celery worker, beat, and FastAPI
ENTRYPOINT ["./app/entrypoint.sh"]