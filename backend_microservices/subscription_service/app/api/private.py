from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

from subscription_service.app.security.auth import verify_api_key
from subscription_service.app.database.dbmanager import SubscriptionDB
from subscription_service.app.database.session import get_db

router = APIRouter(
    prefix="/private", 
    tags=["Subscription - Private API"],
    dependencies=[Depends(verify_api_key)]
)

@router.post("/{user_id}")
def log_subscription(
        user_id: int,
        subscription_tier: str,
        subscription_duration: str,
        auto_renew: bool,
        db: get_db = Depends(get_db),
):
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


@router.get("/{user_id}")
def get_subscription(
        user_id: int,
):
    """
    Retrieve the user's active subscription.

    Args:
        current_user (dict): User information derived from the token.

    Returns:
        SubscriptionResponse: The user's subscription details or a message indicating no active subscription.
    """
    try:
        subscription = SubscriptionDB.get_subscription(user_id=user_id) or None
        if not subscription:
            return {"subscription": None, "message": "No active subscription found."}
        subscription

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{user_id}")
def delete_subscription(
        user_id: int,
):
    """
    Delete the user's active subscription.

    Args:
        current_user (dict): User information derived from the token.

    Returns:
        dict: A confirmation message.
    """
    try:
        SubscriptionDB.delete_subscription(user_id=user_id)
        return {"message": "Subscription deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
