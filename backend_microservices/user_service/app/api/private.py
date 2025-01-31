from sqlalchemy.orm import Session

from fastapi import Depends, HTTPException, APIRouter

from user_service.app.schemas import *
from user_service.app.database.session import get_db
from user_service.app.database.dbmanager import UserDB

from user_service.app.security.auth import verify_api_key

router = APIRouter(prefix="/private/users", tags=["User - Private API"])

@router.get("/")
def get_user(nickname: str = None, id: int = None, email: str = None,
             db: Session = Depends(get_db), dependencies=[Depends(verify_api_key)]):
    """
    Retrieve a user by their nickname or user ID.

    Args:
        nickname (str): The nickname of the user to retrieve.
        id (int): The ID of the user to retrieve.
        email (str): The email of the user to retrieve.
        db (Session): The database session.

    Returns:
        dict: A dictionary containing the user's data.

    Raises:
        HTTPException: If the user is not found.
    """
    
    if not any([nickname, id, email]): # if no nickname, ID or email is provided
        raise HTTPException(status_code=400, detail="Nickname, ID or email must be provided")
    
    user = UserDB.fetch(db, nickname=nickname, user_id=id, email=email)
    if not user: # if the user is not found
        raise HTTPException(status_code=404, detail="User(s) not found")

    return user
