import httpx
from fastapi import HTTPException

from course_service.app.clients import CHAT_SERVICE_URL

async def delete_chats(course_id: int, authorization: str):
    """
    Calls the Chat service to delete all chats for a course.

    Args:
        - course_id (int): The ID of the course to delete chats for.
        - authorization (str): The authorization token.

    Returns:
        - bool: True if the chats were deleted successfully, False otherwise.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{CHAT_SERVICE_URL}/public/course/{course_id}",
                headers={"Authorization": authorization}
            )
            response.raise_for_status()  # Raise an exception for HTTP errors
        
        return True
    
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Chat service error: {str(e)}"
        )


async def get_chats(course_id: int, authorization: str):
    """
    Calls the Chat service to get all chats for a course.

    Args:
        - course_id (int): The ID of the course to get chats for.
        - authorization (str): The authorization token.

    Returns:
        - list: A list of chat objects.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CHAT_SERVICE_URL}/public/course/{course_id}",
                headers={"Authorization": authorization}
            )
            response.raise_for_status()  # Raise an exception for HTTP errors
        
        return response.json()
    
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Chat service error: {str(e)}"
        )