from fastapi import Depends, APIRouter, HTTPException

from database.dbmanager import AnalyticsDB
from modules.analytics.schemas import AnalyticsRequest, AnalyticsResponse
from middleware import authentication as auth
from datetime import date

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.post("/log", response_model=AnalyticsResponse)
def log_usage(
    request: AnalyticsRequest,
    current_user: dict = Depends(auth.get_current_user),
):
    """
    Log or update usage analytics for the current user.

    If the input date is today:
        - Add the specified time to the existing record if it exists.
        - Otherwise, create a new record for today.
    For non-today dates:
        - Create a new record with the specified time.

    Args:
        request (AnalyticsRequest): The analytics data to log (includes date and time spent).
        current_user (dict): User information derived from the token.

    Returns:
        AnalyticsResponse: The updated or newly created analytics data.
    """
    user_id = current_user["user_id"]
    try:
        # Parse the input date and get today's date
        input_date = request.date
        today_date = date.today()

        if input_date == today_date:
            # Check if a record for today already exists
            existing_record = AnalyticsDB.get_usage(user_id=user_id, date=request.date)

            if existing_record:
                # Add the time spent to the existing record
                updated_time_spent = (existing_record.get("time_spent") or 0) + request.time_spent
                analytics_data = AnalyticsDB.update_usage(
                    user_id=user_id,
                    date=request.date,
                    time_spent=updated_time_spent,
                )
            else:
                # Create a new record for today
                analytics_data = AnalyticsDB.log_usage(user_id=user_id, date=request.date, time_spent=request.time_spent)

        else:
            # Create a new record for a date other than today
            analytics_data = AnalyticsDB.log_usage(user_id=user_id, date=request.date, time_spent=request.time_spent)

        return AnalyticsResponse(**analytics_data)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=list[AnalyticsResponse])
def get_usage(
        current_user: dict = Depends(auth.get_current_user),
):
    """
    Fetch all usage analytics for the current user.

    Args:
        current_user (dict): User information derived from the token.

    Returns:
        list[AnalyticsResponse]: A list of all analytics records for the current user.
    """
    user_id = current_user["user_id"]
    try:
        # Fetch all records for the current user
        analytics_data = AnalyticsDB.get_usage(user_id=user_id) or []

        # Return the records as a list of AnalyticsResponse objects
        return [AnalyticsResponse(**data) for data in analytics_data]

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# There is no delete user but in case it will happen I added this function
@router.delete("/delete")
def delete_usage(
    date: str = None,
    current_user: dict = Depends(auth.get_current_user),
):
    """
    Delete usage analytics for the current user.

    Args:
        date (str, optional): The date of the analytics to delete in 'YYYY-MM-DD' format.
        current_user (dict): User information derived from the token.

    Returns:
        dict: A confirmation message.
    """
    user_id = current_user["user_id"]
    try:
        AnalyticsDB.delete_usage(user_id=user_id, date=date)
        return {"message": "Analytics record(s) deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
