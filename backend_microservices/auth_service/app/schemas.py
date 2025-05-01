from pydantic import BaseModel, Field


class Token(BaseModel):
    """
    Represents a token object.

    Attributes:
        access_token (str): The access token.
        token_type (str): The type of the token.
    """

    access_token: str
    token_type: str


class VerifyPasswordRequest(BaseModel):
    """Used to verify that the current (plain-text) password is correct."""

    current_password: str = Field(..., min_length=1)


class SimpleResponse(BaseModel):
    """Uniform response when nothing more than success/failure is required."""

    success: bool
    detail: str = ""
