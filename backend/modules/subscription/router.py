from fastapi import APIRouter, Depends, HTTPException
from database.dbmanager import SubscriptionDB
from modules.subscription.schemas import SubscriptionRequest, SubscriptionResponse
from middleware import authentication as auth
from datetime import datetime, timedelta

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


@router.post("/log", response_model=SubscriptionResponse)
def log_subscription(
        request: SubscriptionRequest,
        current_user: dict = Depends(auth.get_current_user),
):
    user_id = current_user["user_id"]
    try:
        start_date = datetime.now()
        if request.subscription_duration == "monthly":
            end_date = start_date + timedelta(days=30)
        elif request.subscription_duration == "yearly":
            end_date = start_date + timedelta(days=365)
        else:
            raise HTTPException(status_code=400, detail="Invalid subscription duration. Use 'monthly' or 'yearly'.")

        existing_subscription = SubscriptionDB.get_subscription(user_id=user_id)

        if existing_subscription:
            updated_subscription = SubscriptionDB.update_subscription(
                user_id=user_id,
                subscription_tier=request.subscription_tier,
                auto_renew=request.auto_renew,
                start_date=start_date,
                end_date=end_date,
            )
            return SubscriptionResponse(**updated_subscription)

        subscription = SubscriptionDB.create_subscription(
            user_id=user_id,
            subscription_tier=request.subscription_tier,
            start_date=start_date,
            end_date=end_date,
            auto_renew=request.auto_renew
        )
        return SubscriptionResponse(**subscription)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=SubscriptionResponse)
def get_subscription(
        current_user: dict = Depends(auth.get_current_user),
):
    """
    Retrieve the user's active subscription.

    Args:
        current_user (dict): User information derived from the token.

    Returns:
        SubscriptionResponse: The user's subscription details or a message indicating no active subscription.
    """
    user_id = current_user["user_id"]
    try:
        subscription = SubscriptionDB.get_subscription(user_id=user_id) or None
        if not subscription:
            return {"subscription": None, "message": "No active subscription found."}
        return SubscriptionResponse(**subscription)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/delete")
def delete_subscription(
        current_user: dict = Depends(auth.get_current_user),
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
        SubscriptionDB.delete_subscription(user_id=user_id)
        return {"message": "Subscription deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
