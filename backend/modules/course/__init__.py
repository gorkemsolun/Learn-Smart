import os
from fastapi.security import OAuth2PasswordBearer


WEEKLY_STUDY_PLAN_PROMPT = os.getenv("WEEKLY_STUDY_PLAN_PROMPT")
FLASHCARD_PROMPT = os.getenv("FLASHCARD_PROMPT")

#oauth2 scheme for Chat Service
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")