from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta

from subscription_service.app.database.dbmanager import SubscriptionDB
from subscription_service.app.clients.user import get_current_user
from subscription_service.app.database.session import get_db

router = APIRouter(prefix="/public", tags=["Subscription - Public API"])

class SubscriptionData(BaseModel):
    subscription_tier: str
    subscription_duration: str
    auto_renew: bool

@router.post("/")
def log_subscription(
        subscription_data: SubscriptionData,
        current_user: dict = Depends(get_current_user),
        db: get_db = Depends(get_db),
):
    user_id = current_user["user_id"]
    subscription_tier = subscription_data.subscription_tier
    subscription_duration = subscription_data.subscription_duration
    auto_renew = subscription_data.auto_renew
    try:
        start_date = datetime.now()
        if subscription_duration == "monthly":
            end_date = start_date + timedelta(days=30)
        elif subscription_duration == "yearly":
            end_date = start_date + timedelta(days=365)
        else:
            raise HTTPException(status_code=400, detail="Invalid subscription duration. Use 'monthly' or 'yearly'.")

        existing_subscription = SubscriptionDB.get_subscription(db, user_id=user_id)

        if existing_subscription:
            updated_subscription = SubscriptionDB.update_subscription(
                db, 
                user_id=user_id,
                subscription_tier=subscription_tier,
                auto_renew=auto_renew,
                start_date=start_date,
                end_date=end_date,
            )
            return updated_subscription

        subscription = SubscriptionDB.create_subscription(
            db, 
            user_id=user_id,
            subscription_tier=subscription_tier,
            start_date=start_date,
            end_date=end_date,
            auto_renew=auto_renew
        )
        return subscription

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/")
def get_subscription(
        current_user: dict = Depends(get_current_user),
        db: get_db = Depends(get_db),
):
    """
    Retrieve the user's active subscription.

    Args:
        current_user (dict): User information derived from the token.

    Returns:
        SubscriptionResponse: The user's subscription details or a message indicating no active subscription.
    """
    user_id = current_user["user_id"]
    subscription = SubscriptionDB.get_subscription(db, user_id=user_id) or None
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found.")

    return subscription


@router.delete("/")
def delete_subscription(
        current_user: dict = Depends(get_current_user),
        db: get_db = Depends(get_db),
):
    """
    Delete the user's active subscription.

    Args:
        current_user (dict): User information derived from the token.

    Returns:
        dict: A confirmation message.
    """
    user_id = current_user["user_id"]
    try:
        SubscriptionDB.delete_subscription(db, user_id=user_id)
        return {"message": "Subscription deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
