import dotenv
import os

dotenv.load_dotenv()

USER_SERVICE_URL = os.getenv("USER_SERVICE_URL")
USER_CLIENT_KEY = os.getenv("USER_CLIENT_KEY")
