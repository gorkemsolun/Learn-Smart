import os
from dotenv import load_dotenv

load_dotenv()

AUTH_ALLOWED_KEY = os.getenv("AUTH_ALLOWED_KEY")
COURSE_ALLOWED_KEY = os.getenv("COURSE_ALLOWED_KEY")
GENAI_ALLOWED_KEY = os.getenv("GENAI_ALLOWED_KEY")
CHAT_ALLOWED_KEY = os.getenv("CHAT_ALLOWED_KEY")

ALLOWED_KEYS = {
    "auth_service": AUTH_ALLOWED_KEY,
    "course_service": COURSE_ALLOWED_KEY,
    "genai_service": GENAI_ALLOWED_KEY,
    "chat_service": CHAT_ALLOWED_KEY,
}
