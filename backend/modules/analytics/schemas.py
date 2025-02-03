from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class AnalyticsRequest(BaseModel):
    """
    Schema for incoming analytics requests.

    Attributes:
        date (date): The date of the usage in 'YYYY-MM-DD' format.
        time_spent (int): The time spent in seconds.
    """
    date: date
    time_spent: int
    timestamp: datetime


class AnalyticsResponse(BaseModel):
    """
    Schema for outgoing analytics responses.

    Attributes:
        date (Optional[date]): The date of the usage in 'YYYY-MM-DD' format.
        time_spent (Optional[int]): The total time spent in seconds.
    """
    date: Optional[date]
    time_spent: Optional[int]
    timestamp: Optional[datetime]
