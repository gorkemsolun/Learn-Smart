import os
from dotenv import load_dotenv

load_dotenv()

AUTH_ALLOWED_KEY = os.getenv("AUTH_ALLOWED_KEY")

ALLOWED_KEYS = {
    "auth_service": AUTH_ALLOWED_KEY
}
