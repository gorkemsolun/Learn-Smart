import httpx
from fastapi import HTTPException

from course_service.app.clients import CHAT_SERVICE_URL, CHAT_CLIENT_KEY

async def delete_chats(course_id: int):
    """
    Calls the Chat service to delete all chats for a course.

    Args:
        - course_id (int): The ID of the course to delete chats for.

    Returns:
        - bool: True if the chats were deleted successfully.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{CHAT_SERVICE_URL}/private/course/{course_id}",
                headers={"X-API-Key": CHAT_CLIENT_KEY}
            )
            response.raise_for_status()  # Raise an exception for HTTP errors
        
        return True
    
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Chat service error: {str(e)}"
        )
