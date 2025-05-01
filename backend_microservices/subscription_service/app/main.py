from subscription_service.app.tasks import process_subscriptions
from subscription_service.app.celery_app import celery_app
from celery.schedules import crontab
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from subscription_service.app.api.private import router as private_router
from subscription_service.app.util import init

# create the FastAPI app
app = FastAPI()

# re/create the database tables
init(restart=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

celery_app.conf.beat_schedule = {
    "process-subscriptions-everyday": {
        "task": "tasks.process_subscriptions",
        "schedule": crontab(hour=0, minute=0),
    }
}

@app.on_event("startup")
def startup_event():
    process_subscriptions.delay()

app.include_router(private_router, prefix="/api")

print("FastAPI Subscription service started successfully")
