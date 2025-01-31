import os
from dotenv import load_dotenv

load_dotenv()

USER_ALLOWED_KEY = os.getenv("USER_ALLOWED_KEY")

ALLOWED_KEYS = {
    "user_service": USER_ALLOWED_KEY
}