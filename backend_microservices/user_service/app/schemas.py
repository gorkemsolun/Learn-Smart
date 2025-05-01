from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserCreationRequest(BaseModel):
    """
    Represents a request to create a new user.

    Attributes:
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

    nickname: Optional[str] = None
    email: Optional[EmailStr] = None  # EmailStr is a Pydantic email validator
    password: Optional[str] = None


class AnalyticsRequest(BaseModel):
    """
    Schema for incoming analytics requests.

    Attributes:
        date (date): The date of the usage in 'YYYY-MM-DD' format.
        time_spent (int): The time spent in seconds.
    """

    date: date
    time_spent: int
    timestamp: datetime


class AnalyticsResponse(BaseModel):
    """
    Schema for outgoing analytics responses.

    Attributes:
        date (Optional[date]): The date of the usage in 'YYYY-MM-DD' format.
        time_spent (Optional[int]): The total time spent in seconds.
    """

    date: Optional[date]
    time_spent: Optional[int]
    timestamp: Optional[datetime]
