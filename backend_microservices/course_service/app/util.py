# TODO: Placeholder file, most of these function calls are to be converted into gRPC calls

import json

from database.session import get_db, Base

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


from middleware import FILES_DIR
from . import WEEKLY_STUDY_PLAN_PROMPT, FLASHCARD_PROMPT
from modules.chat import MODEL_VERSION, SYSTEM_PROMPT

def get_course_icon_path(course_id):
    return f"{FILES_DIR}/course_{course_id}/course_img.png"

def get_course_syllabus_path(course_id):
    return f"{FILES_DIR}/course_{course_id}/syllabus.pdf"

def get_study_plan_path(course_id):
    return f"{FILES_DIR}/course_{course_id}/study_plan.md"

def create_study_plan(course_syllabus_file_content, course_id):
    model = genai.GenerativeModel(MODEL_VERSION, system_instruction=SYSTEM_PROMPT, 
                                  generation_config={"response_mime_type": "application/json"})
    response = model.generate_content([WEEKLY_STUDY_PLAN_PROMPT, course_syllabus_file_content]).text
    
    response_dict = json.loads(response)
    study_plan_path = get_study_plan_path(course_id)

    success, data = response_dict["success"], response_dict["data"]

    with open(study_plan_path, 'w') as file:
        file.write(data)
        
    return success, study_plan_path
