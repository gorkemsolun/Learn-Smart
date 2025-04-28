import httpx
from fastapi import HTTPException, Header

from user_service.app.clients import AUTH_SERVICE_URL, AUTH_CLIENT_KEY

async def get_authenticated_email(authorization: str = Header(None)) -> str:
    """
    Calls the authentication service to validate the token and retrieve the email.

    Args:
        authorization (str): The Authorization header containing the JWT token.

    Returns:
        str: The authenticated user's email.

    Raises:
        HTTPException: If authentication fails.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    try: 
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AUTH_SERVICE_URL}/private/verify", 
                headers={
                    "Authorization": authorization,
                    "X-API-Key": AUTH_CLIENT_KEY
                }
            )

        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid authentication token")

        return response.json().get("email", None)
    
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Authentication service error: {str(e)}"
        )


async def hash_password(password: str) -> str:
    """
    Hashes the given password using the pwd_context.

    Args:
        password (str): The password to be hashed.

    Returns:
        str: The hashed password.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AUTH_SERVICE_URL}/private/hash",
                params={"password": password}, 
                headers={"X-API-Key": AUTH_CLIENT_KEY}
            )
            response.raise_for_status()

        return response.json()

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Authentication service error: {str(e)}"
        )
    