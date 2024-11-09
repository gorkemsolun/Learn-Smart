import os
import threading

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from modules.user.router import router as users_router
from modules.course.router import router as course_router
from modules.chat.router import router as chat_router
from modules.notification.router import router as notification_router
from middleware.router import router as files_router
from tools import init
from logger import logger

# boot up the grpc server for authentication service
def run_auth_grpc_server():
    script_path = os.path.join('modules', 'user', 'auth_servicer.py')
    os.system(f'PYTHONPATH=./ python {script_path}')

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

# Mount the files directory to the "/files" route
# This will allow the frontend to access the files in the "files" directory
# Example: http://localhost:8000/files/myfile.png will directly serve the file "myfile.png" stored in the "files" directory
app.mount("/files", StaticFiles(directory="files"), name="files")

routers = [users_router, files_router, course_router, chat_router, notification_router]

# Include the router in the app with the "/api" prefix for all routes
for router in routers:
    app.include_router(router, prefix="/api")

grpc_thread = threading.Thread(target=run_auth_grpc_server)
grpc_thread.start()

logger.info("FastAPI backend started successfully")
