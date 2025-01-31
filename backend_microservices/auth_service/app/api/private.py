from fastapi import Depends, HTTPException, APIRouter
import jwt
from jwt.exceptions import InvalidTokenError
from fastapi import HTTPException, status, APIRouter, Depends

from auth_service.app import (
    SECRET_KEY, ALGORITHM, oauth2_scheme, pwd_context
)
from auth_service.app.security.auth import verify_api_key
from auth_service.app.schemas import *

router = APIRouter(prefix="/private", tags=["Authentication - Private API"])

@router.post("/hash")
def hash_password(password, dependencies=[Depends(verify_api_key)]):
    """
    Hashes the given password using the pwd_context.

    Args:
        password (str): The password to be hashed.

    Returns:
        str: The hashed password.
    """
    return pwd_context.hash(password)


@router.post("/verify")
async def verify_email(token: str = Depends(oauth2_scheme), dependencies=[Depends(verify_api_key)]):
    """
    Retrieves the current user's email based on the provided JWT token.

    Args:
    - token (str): The JWT token used for authentication.

    Returns:
    - dict: A dictionary containing the email of the user.

    Raises:
    - HTTPException: If the token is invalid or the user is not found.
    """
    
    credentials_exception = HTTPException(
        detail="Could not validate credentials",
        status_code=status.HTTP_401_UNAUTHORIZED,
        headers={"WWW-Authenticate": "Bearer"},
    ) # create an exception for invalid credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM]) # decode the JWT token
        
        email = payload.get("sub") # get the email from the decoded token
        if email is None:
            raise credentials_exception # raise an exception if the email is not found in the payload
        
    except InvalidTokenError:
        raise credentials_exception # raise an exception if the token is not genuine
    
    return {"email": email} # return the email of the user
