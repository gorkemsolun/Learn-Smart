from skill_tree_service.app.model import ChatHistory
from fastapi import HTTPException
import httpx
import json
from typing import List, Dict, Any

from skill_tree_service.app.clients import GENAI_SERVICE_URL, GENAI_CLIENT_KEY

async def create_skill_tree(history: ChatHistory) -> Dict[str, Any]:
    """
    Calls the Skill Tree service to generate a skill tree from chat history.

    Args:
        history: List of chat‐history dicts.

    Returns:
        The generated skill‐tree dict.

    Raises:
        HTTPException: on HTTP errors or invalid response format.
    """
    try:
        timeout = httpx.Timeout(
            connect=10.0,
            read=60.0,
            write=60.0,
            pool=60.0
        )
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                f"{GENAI_SERVICE_URL}/private/generate/skill-tree",
                headers={"X-API-Key": GENAI_CLIENT_KEY},
                json={"history": json.dumps(history.google())}  
            )
            response.raise_for_status()
            payload = response.json()
    except httpx.HTTPStatusError as e:
        # Propagate HTTP errors 
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Skill Tree service error: {e.response.text}"
        )

    # Check the business‐level success flag
    if not payload.get("success", False):
        raise HTTPException(
            status_code=500,
            detail="Failed to generate skill tree."
        )

    skill_tree = payload.get("skill_tree")

    return skill_tree