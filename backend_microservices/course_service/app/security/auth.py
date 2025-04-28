from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader
from typing import Optional
import secrets

from course_service.app.security import ALLOWED_KEYS

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: Optional[str] = Security(api_key_header)) -> bool:
    """
    Verifies the API key provided in the header.

    Args:
        - api_key (str): The API key provided in the header.

    Returns:
        - bool: True if the API key is valid, False otherwise.
    """
    if api_key is None:
        raise HTTPException(
            status_code=401,
            detail="API Key header is missing"
        )
    
    for valid_key in ALLOWED_KEYS.values():
        if secrets.compare_digest(api_key, valid_key):
            return True
            
    raise HTTPException(
        status_code=403,
        detail="Invalid API key"
    )
