from fastapi.security import OAuth2PasswordRequestForm
from fastapi import HTTPException, status, APIRouter, Depends
from datetime import timedelta

from auth_service.app import ACCESS_TOKEN_EXPIRE_MINUTES
from auth_service.app.util import authenticate_user, create_access_token
from auth_service.app.schemas import Token

router = APIRouter(prefix="/public", tags=["Authentication - Public API"])


@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticates the user and generates an access token.

    Args:
        form_data (OAuth2PasswordRequestForm): The form data containing the user's credentials.

    Returns:
        Token: An object containing the access token and token type.

    Raises:
        HTTPException: If the user credentials are invalid.
    """
    user = await authenticate_user(form_data.password, email=form_data.username) # authenticate the user using the provided credentials

    if not user:
        raise HTTPException(
            detail="Could not validate credentials",
            status_code=status.HTTP_401_UNAUTHORIZED,
            headers={"WWW-Authenticate": "Bearer"},
        ) # user not found or the password does not match
    
    access_token_expires = timedelta(minutes=int(ACCESS_TOKEN_EXPIRE_MINUTES)) # expiration time for the token

    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    ) # create an access token for the user
    
    # the client will use this token to authenticate requests
    return Token(access_token=access_token, token_type="bearer")
