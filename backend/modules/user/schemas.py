from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreationRequest(BaseModel):
    """
    Represents a request to create a new user.

    Attributes:
        role (str): The role of the user.
        nickname (str): The nickname of the user.
        email (EmailStr): The email address of the user.
        password (str): The password of the user.
    """
    nickname: str
    email: EmailStr  # EmailStr is a Pydantic email validator
    password: str


class UserResponse(BaseModel):
    """
    Represents a generic user response model.

    Attributes:
        user_id (Optional[int]): The user's ID.
        role (Optional[str]): The user's role.
        nickname (Optional[str]): The user's nickname.
        email (Optional[EmailStr]): The user's email.
    """
    user_id: Optional[int] = None
    nickname: Optional[str] = None
    email: Optional[EmailStr] = None  # EmailStr is a Pydantic email validator


class UserUpdateRequest(BaseModel):
    """
    Represents a request to update a user.

    Attributes:
        role (Optional[str]): The name of the user.
        nickname (Optional[str]): The nickname of the user.
        email (Optional[EmailStr]): The email address of the user.
        password (Optional[str]): The password of the user.
    """
    role: Optional[str] = None
    nickname: Optional[str] = None
    email: Optional[EmailStr] = None  # EmailStr is a Pydantic email validator
    password: Optional[str] = None
