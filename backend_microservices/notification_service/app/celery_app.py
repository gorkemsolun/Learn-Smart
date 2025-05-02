import os

from celery import Celery
from celery.schedules import crontab

broker_url = os.getenv("REDIS_URL", "redis://redis:6379/1")
backend_url = os.getenv("REDIS_URL", "redis://redis:6379/1")

celery_app = Celery(
    "notification_service.app",
    broker=broker_url,
    backend=backend_url,
    include=["notification_service.app.tasks"],
)

celery_app.conf.timezone = "UTC"


""" celery_app.conf.beat_schedule = {
    "periodic-check": {
        "task": "notification_service.app.tasks.check_and_notify",
        "schedule": crontab(minute="*/10"),
    },
} """
