from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from modules.user.router import router as users_router
from modules.analytics.router import router as analytics_router
from modules.course.router import router as course_router
from modules.chat.router import router as chat_router
from modules.notification.router import router as notification_router
from modules.subscription.router import router as subscription_router
from tools import init
from logger import logger
from tasks import process_subscriptions
from celery.schedules import crontab
from celery_app import celery_app

# create the FastAPI app
app = FastAPI()

# re/create the database tables and directories
# Debug mode will log additional information
init(restart=False, debug_mode=False)

# Add CORS middleware to allow cross-origin requests
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

# Mount the files directory to the "/files" route
# This will allow the frontend to access the files in the "files" directory
# Example: http://localhost:8000/files/myfile.png will directly serve the file "myfile.png" stored in the "files" directory
app.mount("/files", StaticFiles(directory="files"), name="files")

routers = [users_router, analytics_router, course_router, chat_router, notification_router, subscription_router]

# Include the router in the app with the "/api" prefix for all routes
for router in routers:
    app.include_router(router, prefix="/api")

logger.info("FastAPI backend started successfully")
