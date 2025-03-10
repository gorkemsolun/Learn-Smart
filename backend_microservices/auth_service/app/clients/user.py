import httpx
from fastapi import HTTPException

from auth_service.app.clients import USER_SERVICE_URL, USER_CLIENT_KEY

async def get_user(nickname=None, email=None, user_id=None):
    """
    Get a user from the user service based on the provided user information.

    Args:
        nickname (str, optional): The user's nickname. Defaults to None.
        email (str, optional): The user's email address. Defaults to None.
        user_id (int, optional): The user's ID. Defaults to None.

    Returns:
        User dictionary: The user's dict. if found.
        None: If the user is not found.
    """
    try:
        params = {}
        if nickname:
            params["nickname"] = nickname
        if email:
            params["email"] = email
        if user_id:
            params["id"] = user_id

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{USER_SERVICE_URL}/private/", 
                params=params,
                headers={"X-API-Key": USER_CLIENT_KEY}
            )
            response.raise_for_status()

        user = response.json()
        return user
    
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return None
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error occurred while authenticating user: {str(e)}")
