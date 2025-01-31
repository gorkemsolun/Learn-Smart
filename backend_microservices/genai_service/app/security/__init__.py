import os
from dotenv import load_dotenv

load_dotenv()

COURSE_ALLOWED_KEY = os.getenv("COURSE_ALLOWED_KEY")

ALLOWED_KEYS = {
    "course_service": COURSE_ALLOWED_KEY
}
