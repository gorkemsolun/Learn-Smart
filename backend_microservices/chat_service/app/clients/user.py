import httpx
from fastapi import HTTPException, Header

from chat_service.app.clients import USER_SERVICE_URL

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

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{USER_SERVICE_URL}/public/user/authenticate", 
                headers={"Authorization": authorization}
            )

        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid authentication token")

        return response.json()

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"User service error: {str(e)}"
        )