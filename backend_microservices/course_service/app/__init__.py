import dotenv
import os

dotenv.load_dotenv()

WEEKLY_STUDY_PLAN_PROMPT = os.getenv("WEEKLY_STUDY_PLAN_PROMPT")
FLASHCARD_PROMPT = os.getenv("FLASHCARD_PROMPT")
