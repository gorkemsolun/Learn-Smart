import jwt

from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import HTTPException, status, Depends
from pydantic import BaseModel
from jwt.exceptions import InvalidTokenError
#---------------------------------------------------------
#This enclosed part will belong to __init__ once I set up separate fastapi server for user service
import os
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext

load_dotenv()

#
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
#-------------------------------------------------------
class Token(BaseModel):
    """
    Represents a token object.

    Attributes:
        access_token (str): The access token.
        token_type (str): The type of the token.
    """
    access_token: str
    token_type: str


def verify_password(plain_password, hashed_password):
    """
    Verify if a plain password matches a hashed password.

    Args:
        plain_password (str): The plain password to verify.
        hashed_password (str): The hashed password to compare against.

    Returns:
        bool: True if the plain password matches the hashed password, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password):
    """
    Hashes the given password using the pwd_context.

    Args:
        password (str): The password to be hashed.

    Returns:
        str: The hashed password.
    """
    return pwd_context.hash(password)


async def get_current_user(token: str):
    """
    Retrieves the current user based on the provided JWT token.

    Args:
    - token (str): The JWT token used for authentication.

    Returns:
    - The user dictionary associated with the provided token.

    Raises:
    - HTTPException: If the token is invalid or the user is not found.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM]) # decode the JWT token
        
        email = payload.get("sub") # get the email from the decoded token
        if email is None:
            return None # return None if the email is not found in the payload
        
    except InvalidTokenError:
        return None # return None if the token is not genuine
    
    from database.dbmanager import UserDB
    user = UserDB.fetch(email=email) # fetch the user from the database using the email

    if user is None:
        return None # return None if the user with the email is not found

    return user

async def user_service_get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Retrieves the current user based on the provided JWT token.

    Args:
    - token (str): The JWT token used for authentication.

    Returns:
    - The user dictionary associated with the provided token.

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
    
    from database.dbmanager import UserDB
    user = UserDB.fetch(email=email) # fetch the user from the database using the email

    if user is None:
        raise credentials_exception # raise an exception if the user with the email is not found

    return user


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
    user = _authenticate_user(form_data.password, email=form_data.username) # authenticate the user using the provided credentials

    if not user:
        raise HTTPException(
            detail="Could not validate credentials",
            status_code=status.HTTP_401_UNAUTHORIZED,
            headers={"WWW-Authenticate": "Bearer"},
        ) # user not found or the password does not match
    
    access_token_expires = timedelta(minutes=int(ACCESS_TOKEN_EXPIRE_MINUTES)) # expiration time for the token

    access_token = _create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    ) # create an access token for the user
    
    # the client will use this token to authenticate requests
    return Token(access_token=access_token, token_type="bearer")


def _authenticate_user(password, **kwargs):
    """
    Authenticates a user based on the provided password and user information.

    Args:
        password (str): The password to be verified.
        **kwargs: Additional keyword arguments containing user information.
            Possible keyword arguments include:
            - nickname (str): The user's nickname.
            - email (str): The user's email address.
            - user_id (int): The user's ID.

    Returns:
        User dictionary: The authenticated user's dict. if the password matches and the user is found.
        None: If the user is not found or the password does not match.
    """

    nickname = kwargs.get("nickname", None)
    email = kwargs.get("email", None)
    user_id = kwargs.get("user_id", None)

    # import the UserDB class here to avoid circular imports
    from database.dbmanager import UserDB

    user = UserDB.fetch(nickname=nickname, email=email, user_id=user_id) # fetch the user from the database
    
    # user not found or password does not match
    if not user or not verify_password(password, user["hashed_password"]):
        return None
    
    return user


def _create_access_token(data: dict, expires_delta: timedelta = None):
    """
    Create an access token with the provided data.

    Args:
        data (dict): The data to be encoded in the access token.
        expires_delta (timedelta, optional): The expiration time for the access token. Defaults to 30 minutes.

    Returns:
        str: The encoded access token.
    """
    to_encode = data.copy()

    # set expiration time for the token
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(minutes=30)
        
    to_encode.update({"exp": expire}) # add expiration time to the token

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM) # encode the token with the secret key

    return encoded_jwt # return the encoded token