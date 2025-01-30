import os
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext

load_dotenv()

# file uploads path
FILES_DIR = os.getenv("FILES_DIR")
CHATS_DIR = os.getenv("CHATS_DIR")
BUCKET_NAME = os.getenv("BUCKET_NAME")

# authentication
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")