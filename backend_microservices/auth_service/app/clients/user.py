import httpx

from auth_service.app.clients import USER_SERVICE_URL

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
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{USER_SERVICE_URL}/private/users", 
            params={
                "nickname": nickname, "email": email, "id": user_id
            })
        response.raise_for_status()

    user = response.json()
    return user
