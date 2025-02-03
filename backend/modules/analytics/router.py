from fastapi import Depends, APIRouter, HTTPException

from database.dbmanager import AnalyticsDB
from modules.analytics.schemas import AnalyticsRequest, AnalyticsResponse
from middleware import authentication as auth
from datetime import date, datetime, timedelta

router = APIRouter(prefix="/analytics", tags=["Analytics"])


from datetime import datetime, timedelta, timezone

@router.post("/log", response_model=AnalyticsResponse)
def log_usage(
        request: AnalyticsRequest,
        current_user: dict = Depends(auth.get_current_user),
):
    user_id = current_user["user_id"]
    try:
        timestamp = request.timestamp
        time_spent = request.time_spent
        max_seconds_per_day = 86_400
        def distribute_time(user_id, timestamp, remaining_time):
            date = timestamp.date()

            start_of_next_day = datetime.combine(date + timedelta(days=1), datetime.min.time())

            if timestamp.tzinfo is not None:
                start_of_next_day = start_of_next_day.replace(tzinfo=timestamp.tzinfo)

            seconds_until_midnight = (start_of_next_day - timestamp).total_seconds()
            time_for_current_day = min(remaining_time, seconds_until_midnight)

            existing_record = AnalyticsDB.get_usage(user_id=user_id, date=date)
            already_logged = existing_record.get("time_spent", 0) if existing_record else 0

            time_for_current_day = min(time_for_current_day, max_seconds_per_day - already_logged)

            if existing_record:
                AnalyticsDB.update_usage(user_id=user_id, date=date,
                                         time_spent=already_logged + time_for_current_day,
                                         timestamp=timestamp)
            else:
                AnalyticsDB.log_usage(user_id=user_id, date=date,
                                      time_spent=time_for_current_day,
                                      timestamp=timestamp)

            remaining_time -= time_for_current_day

            if remaining_time > 0:
                # Move to the next day, set time to 00:00:00
                distribute_time(user_id, start_of_next_day, remaining_time)

        distribute_time(user_id, timestamp, time_spent)

        latest_data = AnalyticsDB.get_usage(user_id=user_id, date=date.today()) or {}
        return AnalyticsResponse(**latest_data)

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
