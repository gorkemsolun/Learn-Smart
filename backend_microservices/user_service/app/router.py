from sqlalchemy.orm import Session

from fastapi import Depends, HTTPException, APIRouter
from fastapi.security import OAuth2PasswordRequestForm

from schemas import *
from database.session import get_db
from database.dbmanager import UserDB, CourseDB
from middleware import authentication as auth # TODO: Add communication mechanism with the auth service

router = APIRouter(prefix="/users", tags=["User"])

# TODO: This might have to be moved to the auth service
@router.post("/login", response_model=auth.Token, include_in_schema=False)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Endpoint for user login.

    Parameters:
    - form_data: OAuth2PasswordRequestForm object containing user login credentials.

    Returns:
    - Token: Token object containing the JWT access token.

    """
    return auth.login_for_access_token(form_data)


@router.post("/create", response_model=UserResponse)
def create_user(user: UserCreationRequest, db: Session = Depends(get_db)):
    """
    Create a new user.

    Args:
        user (UserCreationRequest): The user data to be created.

    Returns:
        UserResponse: The created user data.

    Raises:
        HTTPException: If there is an error creating the user.
    """
    
    try:
        user_dict = UserDB.create(db, **user.model_dump()) # create the user given the user data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return UserResponse(**user_dict)


@router.get("/", response_model=UserResponse)
def get_user(nickname: str = None, id: int = None, 
             current_user: dict = Depends(auth.get_current_user), 
             db: Session = Depends(get_db)):
    """
    Retrieve a user by their nickname or user ID.

    Args:
        nickname (str): The nickname of the user to retrieve.
        id (int): The ID of the user to retrieve.

    Returns:
        UserResponse: The response model containing the user's information.

    Raises:
        HTTPException: If the user is not found.
    """
    
    if not nickname and not id:
        raise HTTPException(status_code=400, detail="Nickname or ID must be provided")
    
    user = UserDB.fetch(db, nickname=nickname, user_id=id)
    if not user: # if the user is not found
        raise HTTPException(status_code=404, detail="User(s) not found")

    return UserResponse(**user)


@router.get("/me")
def get_current_user(current_user: dict = Depends(auth.get_current_user),
                     db: Session = Depends(get_db)):
    """
    Get the current authenticated user.
    
    Returns:
        User: The current authenticated user.
    """
    
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")

    # TODO: next line to be replaced by gRPC call  
    courses = CourseDB.fetch(user_id=current_user["user_id"], all=True)

    current_user["courses"] = courses # add the user's courses to response
    current_user.pop("hashed_password") # remove the hashed password from the response
    return current_user


@router.put("/update", response_model=UserResponse)
def update_user(user: UserUpdateRequest, 
                current_user: dict = Depends(auth.get_current_user),
                db: Session = Depends(get_db)):
    """
    Update a user's information.

    Args:
        user (UserUpdateRequest): The user data to update.

    Returns:
        UserResponse: The updated user data.

    Raises:
        HTTPException: If the user is not found.
    """
    
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_dict = UserDB.update(db, current_user["user_id"], **user.model_dump())
    
    return UserResponse(**user_dict)
