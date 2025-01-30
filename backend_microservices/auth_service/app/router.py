import jwt
from jwt.exceptions import InvalidTokenError
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import HTTPException, status, APIRouter, Depends
from datetime import timedelta

from . import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, oauth2_scheme, pwd_context
from util import authenticate_user, create_access_token
from schemas import Token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/hash")
def hash_password(password):
    """
    Hashes the given password using the pwd_context.

    Args:
        password (str): The password to be hashed.

    Returns:
        str: The hashed password.
    """
    return pwd_context.hash(password)


@router.post("/authenticate")
async def get_current_user(token: str = Depends(oauth2_scheme)):
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


@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticates the user and generates an access token.

    Args:
        form_data (OAuth2PasswordRequestForm): The form data containing the user's credentials.

    Returns:
        Token: An object containing the access token and token type.

    Raises:
        HTTPException: If the user credentials are invalid.
    """
    user = authenticate_user(form_data.password, email=form_data.username) # authenticate the user using the provided credentials

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
