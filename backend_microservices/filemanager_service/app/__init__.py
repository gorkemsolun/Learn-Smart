import dotenv
import os

dotenv.load_dotenv()
BUCKET_NAME = os.getenv("BUCKET_NAME")

STORAGE_DIR = "files"