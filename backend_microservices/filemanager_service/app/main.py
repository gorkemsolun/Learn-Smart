from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from filemanager_service.app.api.private import router as private_router
from filemanager_service.app.util import init

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

print("FastAPI FileManager service started successfully")
