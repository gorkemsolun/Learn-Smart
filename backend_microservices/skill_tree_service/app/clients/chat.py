import httpx
from fastapi import HTTPException

from skill_tree_service.app.clients import CHAT_SERVICE_URL, CHAT_CLIENT_KEY

async def get_all_chat_histories_of_course(course_id: int) -> list:
    """
    Calls the Chat service to fetch all chat histories for a given course.

    Args:
        - course_id (int): The ID of the course whose chat histories to retrieve.

    Returns:
        - list: A list of chat‐history dicts as returned by the Chat service.
    
    Raises:
        - HTTPException(500): if the Chat service returns an HTTP error.
    """
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{CHAT_SERVICE_URL}/chat-histories/{course_id}",
                headers={"X-API-Key": CHAT_CLIENT_KEY}
            )
            resp.raise_for_status()
            payload = resp.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Chat service error: {e.response.status_code} {e.response.text}"
        )

    # Now payload is: { "status": "success", "data": [1,2,3,4] }
    history_fids = payload.get("data")
    if history_fids is None:
        raise HTTPException(400, detail="No data field in chat-histories response")

    if not isinstance(history_fids, list) or not all(isinstance(i, int) for i in history_fids):
        raise HTTPException(400, detail="Expected data to be a list of integers")

    return history_fids