from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth_service.app.api.public import router as public_router
from auth_service.app.api.private import router as private_router

# create the FastAPI app
app = FastAPI()

# Add CORS middleware to allow cross-origin requests
# TODO: Disable this in production and specify the API gateway URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(public_router, prefix="/api")
app.include_router(private_router, prefix="/api")

print("FastAPI Authentication service started successfully")
