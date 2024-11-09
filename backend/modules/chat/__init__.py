import os
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer
import google.generativeai as genai

load_dotenv()

# The directory where the chat history files are stored
CHATS_DIR = os.getenv("CHATS_DIR") 
MODEL_VERSION = os.getenv("MODEL_VERSION")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
SYSTEM_PROMPT = os.getenv("SYSTEM_PROMPT")
EXPLAIN_SLIDE_PROMPT = os.getenv("EXPLAIN_SLIDE_PROMPT")
FLASHCARD_PROMPT = os.getenv("FLASHCARD_PROMPT")
QUIZZES_PROMPT = os.getenv("QUIZZES_PROMPT")
genai.configure(api_key=GOOGLE_API_KEY)

#oauth2 scheme for Chat Service
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")