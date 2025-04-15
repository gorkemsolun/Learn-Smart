from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from user_service.app.api.public import router as public_router
from user_service.app.api.private import router as private_router
from util import init

# create the FastAPI app
app = FastAPI()

# re/create the database tables
init(restart=False)

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(public_router, prefix="/api")
app.include_router(private_router, prefix="/api")

print("FastAPI User service started successfully!")
