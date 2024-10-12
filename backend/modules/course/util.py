import google.generativeai as genai
import json

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
