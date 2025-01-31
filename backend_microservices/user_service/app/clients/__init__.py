import dotenv
import os

dotenv.load_dotenv()

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL")
COURSE_SERVICE_URL = os.getenv("COURSE_SERVICE_URL")

AUTH_CLIENT_KEY = os.getenv("AUTH_CLIENT_KEY")
COURSE_CLIENT_KEY = os.getenv("COURSE_CLIENT_KEY")