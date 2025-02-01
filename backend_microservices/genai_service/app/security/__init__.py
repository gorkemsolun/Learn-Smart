import os
from dotenv import load_dotenv

load_dotenv()

CHAT_ALLOWED_KEY = os.getenv("CHAT_ALLOWED_KEY")
COURSE_ALLOWED_KEY = os.getenv("COURSE_ALLOWED_KEY")

ALLOWED_KEYS = {
    "chat_service": CHAT_ALLOWED_KEY,
    "course_service": COURSE_ALLOWED_KEY
}
