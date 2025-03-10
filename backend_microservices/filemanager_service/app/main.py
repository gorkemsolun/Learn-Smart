from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # Add this import

from filemanager_service.app.api.private import router as private_router
from filemanager_service.app.api.public import router as public_router
from filemanager_service.app.util import init
from filemanager_service.app import STORAGE_DIR

# create the FastAPI app
app = FastAPI()

# re/create the database tables
init(restart=False)

# Add CORS middleware to allow cross-origin requests
# TODO: Disable this in production and specify the frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(private_router, prefix="/api")
app.include_router(public_router, prefix="/api")

app.mount("/files", StaticFiles(directory=STORAGE_DIR), name="files")

print("FastAPI FileManager service started successfully")
