import jwt
from datetime import datetime, timedelta

from auth_service.app import SECRET_KEY, ALGORITHM, pwd_context
import auth_service.app.clients.user as user

async def authenticate_user(password, **kwargs):
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

    # get the user from the user service
    user_dict = await user.get_user(nickname=nickname, email=email, user_id=user_id)
    
    # user not found or password does not match
    if not user_dict or not _verify_password(password, user_dict["hashed_password"]):
        return None
    
    return user_dict


def create_access_token(data: dict, expires_delta: timedelta = None):
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


def _verify_password(plain_password, hashed_password):
    """
    Verify if a plain password matches a hashed password.

    Args:
        plain_password (str): The plain password to verify.
        hashed_password (str): The hashed password to compare against.

    Returns:
        bool: True if the plain password matches the hashed password, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)
