from celery.schedules import crontab
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from notification_service.app.api.private import router as private_router
from notification_service.app.tasks import check_and_notify
from notification_service.app.util import init

# create the FastAPI app
app = FastAPI()

# re-create the database tables if needed
init(restart=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    # Trigger an immediate check on startup
    check_and_notify.delay()


app.include_router(private_router, prefix="/api")

print("FastAPI Notification service started successfully")
