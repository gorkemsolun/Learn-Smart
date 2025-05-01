from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from user_service.app.clients import course
from user_service.app.database.dbmanager import AnalyticsDB, UserDB
from user_service.app.database.session import get_db
from user_service.app.schemas import *
from user_service.app.util import get_authenticated_user

router = APIRouter(prefix="/public", tags=["User - Public API"])


# User
@router.post("/user", response_model=UserResponse)
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
        user_dict = await UserDB.create(
            db, **user.model_dump()
        )  # create the user given the user data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e) + " hi btw :)")

    return UserResponse(**user_dict)


# TODO: Put in private router
@router.get("/user/authenticate")
async def authenticate_user(
    authorization: str = Header(None), db: Session = Depends(get_db)
):
    """
    Authenticate the user based on the provided JWT token.

    Args:
        authorization (str): The JWT token used for authentication.

    Returns:
        dict: A dictionary containing the user's data.
    """
    return await get_authenticated_user(db, authorization)


@router.get("/user")
async def get_user_and_courses(
    db: Session = Depends(get_db), authorization: str = Header(None)
):
    """
    Retrieve the user's data and courses.

    Args:
        current_user (dict): The authenticated user's data.

    Returns:
        dict: A dictionary containing the user's data and courses.
    """
    current_user = await get_authenticated_user(db, authorization)
    courses = await course.get_courses(
        current_user["user_id"]
    )  # get the user's courses

    current_user["courses"] = courses  # add the user's courses to response
    current_user.pop("hashed_password")  # remove the hashed password from the response

    return current_user


@router.put("/user", response_model=UserResponse)
async def update_user(
    user: UserUpdateRequest,
    current_user: dict = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
):
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


# Analytics
@router.post("/analytics", response_model=AnalyticsResponse)
async def log_usage(
    request: AnalyticsRequest,
    db: Session = Depends(get_db),
    authorization: str = Header(None),
):
    """
    Log the time spent by the user on the platform.

    Args:
        request (AnalyticsRequest): The request containing the time spent by the user.
        current_user (dict): The user information derived from the token.

    Returns:
        AnalyticsResponse: The latest analytics record for the user.
    """
    # TODO: recursion in an endpoint is NOT good
    current_user = await get_authenticated_user(db, authorization)
    user_id = current_user["user_id"]
    try:
        timestamp = request.timestamp
        time_spent = request.time_spent

        MAX_SECONDS_PER_DAY = 86_400

        def distribute_time(timestamp: datetime, remaining_time: int):
            date = timestamp.date()

            start_of_next_day = datetime.combine(
                date + timedelta(days=1), datetime.min.time()
            )

            if timestamp.tzinfo is not None:
                start_of_next_day = start_of_next_day.replace(tzinfo=timestamp.tzinfo)

            seconds_until_midnight = (start_of_next_day - timestamp).total_seconds()
            time_for_current_day = min(remaining_time, seconds_until_midnight)

            existing_record = AnalyticsDB.get_usage(db, user_id=user_id, date=date)
            already_logged = (
                existing_record.get("time_spent", 0) if existing_record else 0
            )

            time_for_current_day = min(
                time_for_current_day, MAX_SECONDS_PER_DAY - already_logged
            )

            if existing_record:
                AnalyticsDB.update_usage(
                    db,
                    user_id=user_id,
                    date=date,
                    time_spent=already_logged + time_for_current_day,
                    timestamp=timestamp,
                )
            else:
                AnalyticsDB.log_usage(
                    db,
                    user_id=user_id,
                    date=date,
                    time_spent=time_for_current_day,
                    timestamp=timestamp,
                )

            remaining_time -= time_for_current_day

            if remaining_time > 0:
                # Move to the next day, set time to 00:00:00
                distribute_time(start_of_next_day, remaining_time)

        distribute_time(timestamp, time_spent)

        latest_data = (
            AnalyticsDB.get_usage(db, user_id=user_id, date=date.today()) or {}
        )
        return AnalyticsResponse(**latest_data)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/analytics", response_model=list[AnalyticsResponse])
async def get_usage(db: Session = Depends(get_db), authorization: str = Header(None)):
    """
    Fetch all usage analytics for the current user.

    Args:
        current_user (dict): User information derived from the token.

    Returns:
        list[AnalyticsResponse]: A list of all analytics records for the current user.
    """
    current_user = await get_authenticated_user(db, authorization)
    user_id = current_user["user_id"]
    try:
        # Fetch all records for the current user
        analytics_data = AnalyticsDB.get_usage(db, user_id=user_id) or []

        # Return the records as a list of AnalyticsResponse objects
        return [AnalyticsResponse(**data) for data in analytics_data]

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
