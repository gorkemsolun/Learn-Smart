from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from router import router

# create the FastAPI app
app = FastAPI()

# Add CORS middleware to allow cross-origin requests
# TODO: Disable this in production and specify the frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

print("FastAPI Authentication service started successfully")
