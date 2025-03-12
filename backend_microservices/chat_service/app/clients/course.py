import httpx
from fastapi import HTTPException

from chat_service.app.clients import COURSE_SERVICE_URL, COURSE_CLIENT_KEY

async def get_user_courses(user_id: int):
    """
    Calls the course service to retrieve the courses for a given user.

    Args:
        - user_id (int): The ID of the user to retrieve the courses for.

    Returns:
        - list: A list of dictionaries containing the user's courses.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{COURSE_SERVICE_URL}/private/user/{user_id}",
                headers={"X-API-Key": COURSE_CLIENT_KEY}
            )
            response.raise_for_status()  # Raise an exception for HTTP errors
        
        courses = response.json()
        return courses
    
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Course service error: {str(e)}"
        )


async def get_course(course_id: int):
    """
    Calls the course service to retrieve a course by its ID.

    Args:
        - course_id (int): The ID of the course to retrieve.

    Returns:
        - dict: A dictionary containing the course information.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{COURSE_SERVICE_URL}/private/{course_id}",
                headers={"X-API-Key": COURSE_CLIENT_KEY}
            )
            response.raise_for_status()  # Raise an exception for HTTP errors
        
        return response.json()
    
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Course service error: {str(e)}"
       )