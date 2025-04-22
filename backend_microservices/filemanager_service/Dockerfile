FROM python:3.12.8
# Install dependencies (MySQL client and netcat)
RUN apt-get update && apt-get install -y default-mysql-client netcat-openbsd && rm -rf /var/lib/apt/lists/*
WORKDIR /filemanager_service
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN chmod +x app/wait-for-it.sh app/entrypoint.sh
ENV PYTHONPATH=/
EXPOSE 8004
ENTRYPOINT ["./app/entrypoint.sh"]
