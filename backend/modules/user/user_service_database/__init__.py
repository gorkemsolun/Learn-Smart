from dotenv import load_dotenv
import os

load_dotenv()
USER_DATABASE_URL = os.getenv("USER_DATABASE_URL")