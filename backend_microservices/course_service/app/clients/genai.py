import httpx
from fastapi import HTTPException, UploadFile, HTTPException

from course_service.app.clients import GENAI_SERVICE_URL, GENAI_CLIENT_KEY

async def create_study_plan(course_syllabus_file: UploadFile):
    """
    Call GenAI service to generate a weekly study plan for a course.

    Args:
        course_syllabus_file (UploadFile): The course syllabus file.

    Returns:
        str: The generated weekly study plan in markdown format.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url = f"{GENAI_SERVICE_URL}/private/generate/weekly_study_plan", 
                headers={"X-API-Key": GENAI_CLIENT_KEY}, 
                files={
                    "syllabus": (
                        course_syllabus_file.filename, 
                        course_syllabus_file.file, 
                        course_syllabus_file.content_type
                    )
                },
                timeout=12 # set timeout to 12 seconds to create study plan
            )
        response.raise_for_status()
        response_dict = response.json()

        if not response_dict["success"]:
            raise HTTPException(status_code=500, detail=response_dict["data"])
            
        return response_dict["data"]
    
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    