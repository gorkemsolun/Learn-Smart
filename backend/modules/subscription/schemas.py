from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database.connection import db_connection

Base = db_connection.Base

class SubscriptionRequest(BaseModel):
    """
    Schema for incoming subscription requests.

    Attributes:
        subscription_tier (str): The subscription tier (basic, edux premium, edux elite).
        subscription_duration (str): The subscription duration (monthly, yearly).
        auto_renew (bool): Whether the subscription should auto-renew.
    """
    subscription_tier: str
    subscription_duration: str
    auto_renew: bool

class SubscriptionResponse(BaseModel):
    """
    Schema for outgoing subscription responses.

    Attributes:
        subscription_id (Optional[int]): The unique ID of the subscription.
        user_id (Optional[int]): The ID of the user associated with the subscription.
        subscription_tier (Optional[str]): The subscription tier.
        start_date (Optional[datetime]): The start date of the subscription.
        end_date (Optional[datetime]): The end date of the subscription.
        auto_renew (Optional[bool]): Whether the subscription auto-renews.
    """
    subscription_id: Optional[int]
    user_id: Optional[int]
    subscription_tier: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    auto_renew: Optional[bool]
