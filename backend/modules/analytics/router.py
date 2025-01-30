from fastapi import Depends, APIRouter, HTTPException

from database.dbmanager import AnalyticsDB
from modules.analytics.schemas import AnalyticsRequest, AnalyticsResponse
from middleware import authentication as auth
from datetime import date, datetime

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.post("/log", response_model=AnalyticsResponse)
def log_usage(
        request: AnalyticsRequest,
        current_user: dict = Depends(auth.get_current_user),
):
    user_id = current_user["user_id"]
    try:
        input_date = request.date
        today_date = date.today()
        time_spent = request.time_spent
        timestamp = request.timestamp

        analytics_data = {}

        if input_date == today_date:
            # Process for today's log
            existing_record = AnalyticsDB.get_usage(user_id=user_id, date=input_date)
            if existing_record:
                updated_time_spent = (existing_record.get("time_spent") or 0) + time_spent
                analytics_data = AnalyticsDB.update_usage(
                    user_id=user_id, date=input_date, time_spent=updated_time_spent, timestamp=timestamp
                ) or {}
            else:
                analytics_data = AnalyticsDB.log_usage(
                    user_id=user_id, date=input_date, time_spent=time_spent, timestamp=timestamp
                ) or {}
        else:
            # Process for past dates
            existing_record = AnalyticsDB.get_usage(user_id=user_id, date=input_date)
            midnight = datetime.combine(input_date, datetime.max.time().replace(microsecond=0))
            request_timestamp = datetime.combine(input_date, timestamp.time())

            if request_timestamp > midnight:
                request_timestamp = midnight

            if existing_record:
                remaining_time = (midnight - request_timestamp).seconds
                time_for_input_day = min(time_spent, remaining_time)

                updated_time_spent = (existing_record.get("time_spent") or 0) + time_for_input_day
                analytics_data = AnalyticsDB.update_usage(user_id=user_id, date=input_date,
                                                          time_spent=updated_time_spent,
                                                          timestamp=request_timestamp) or {}
                remaining_time_spent = time_spent - time_for_input_day
            else:
                time_for_input_day = min(time_spent, (midnight - request_timestamp).seconds)
                analytics_data = AnalyticsDB.log_usage(user_id=user_id, date=input_date, time_spent=time_for_input_day,
                                                       timestamp=request_timestamp) or {}
                remaining_time_spent = time_spent - time_for_input_day

            if remaining_time_spent > 0:
                existing_today_record = AnalyticsDB.get_usage(user_id=user_id, date=today_date)
                if existing_today_record:
                    updated_today_time_spent = (existing_today_record.get("time_spent") or 0) + remaining_time_spent
                    analytics_data = AnalyticsDB.update_usage(user_id=user_id, date=today_date,
                                                              time_spent=updated_today_time_spent,
                                                              timestamp=datetime.now()) or {}
                else:
                    analytics_data = AnalyticsDB.log_usage(user_id=user_id, date=today_date,
                                                           time_spent=remaining_time_spent,
                                                           timestamp=datetime.now()) or {}

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
