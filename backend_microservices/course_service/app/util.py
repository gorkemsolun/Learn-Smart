import httpx
from fastapi import HTTPException, Header

from database.session import get_db, Base
from . import USER_SERVICE_URL

def init(restart: bool = False):
    gen = get_db()
    db = next(gen)

    try:
        if restart:
            # drop "users" table
            print("Dropping tables...")
            db.execute("DROP TABLE IF EXISTS users;")
            
        # create "users" table
        print("Creating tables...")
        Base.metadata.create_all(bind=db.bind)
        
    finally:
        gen.close() # closes the session


from . import WEEKLY_STUDY_PLAN_PROMPT, FLASHCARD_PROMPT

def get_course_icon_path(course_id):
    return f"{FILES_DIR}/course_{course_id}/course_img.png"

def get_course_syllabus_path(course_id):
    return f"{FILES_DIR}/course_{course_id}/syllabus.pdf"

def get_study_plan_path(course_id):
    return f"{FILES_DIR}/course_{course_id}/study_plan.md"

def create_study_plan(course_syllabus_file_content, course_id):
    # TODO: Call to LLM service
    # call to filemanager to save the returned study plan
    pass


async def get_current_user(authorization: str = Header(None)):
    """
    Retrieves the current user based on the provided JWT token.

    Args:
    - authorization (str): The JWT token used for authentication.

    Returns:
    - dict: A dictionary containing the user's data.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{USER_SERVICE_URL}/authenticate", headers={"Authorization": authorization})

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    return response.json()
