from sqlalchemy.orm import Session

from fastapi import Depends, HTTPException, APIRouter, Header

from user_service.app.schemas import *
from user_service.app.util import get_authenticated_user
from user_service.app.database.session import get_db
from user_service.app.database.dbmanager import UserDB

from user_service.app.clients import auth as auth_client
from user_service.app.clients import course as course_client

router = APIRouter(prefix="/public", tags=["User - Public API"])

@router.post("/create", response_model=UserResponse)
async def create_user(user: UserCreationRequest, db: Session = Depends(get_db)):
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
        user_dict = await UserDB.create(db, **user.model_dump()) # create the user given the user data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unknown error occured. Please try again later.")
    
    return UserResponse(**user_dict)


@router.get("/authenticate")
async def authenticate_user(authorization: str = Header(None)):
    """
    Authenticate the user based on the provided JWT token.

    Args:
        authorization (str): The JWT token used for authentication.

    Returns:
        dict: A dictionary containing the user's data.
    """
    return await get_authenticated_user(authorization)


@router.get("/me")
async def get_user_and_courses(current_user: dict = Depends(get_authenticated_user)):
    """
    Retrieve the user's data and courses.

    Args:
        current_user (dict): The authenticated user's data.

    Returns:
        dict: A dictionary containing the user's data and courses.
    """
    courses = await course_client.get_courses(current_user["user_id"]) # get the user's courses

    current_user["courses"] = courses # add the user's courses to response
    current_user.pop("hashed_password") # remove the hashed password from the response

    return current_user


@router.put("/update", response_model=UserResponse)
async def update_user(user: UserUpdateRequest, 
                current_user: dict = Depends(get_authenticated_user),
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
    
    user_dict = await UserDB.update(db, current_user["user_id"], **user.model_dump())
    
    return UserResponse(**user_dict)
