from pydantic import BaseModel
from datetime import datetime


class NotificationBase(BaseModel):
    """
    Represents the base attributes of a notification.

    Attributes:
        notification_title (str): The title of the notification.
        notification_content (str): The content of the notification.
        notification_is_new (bool): Whether the notification is new.
        notification_sender_id (int): The ID of the sender of the notification.
        notification_receiver_id (int): The ID of the receiver of the notification.
    """

    notification_title: str
    notification_content: str
    notification_is_new: bool
    notification_sender_id: int
    notification_receiver_id: int


class Notification(NotificationBase):
    notification_id: int
    notification_date: datetime

    class Config:
        from_attributes = True


class NotificationCreationRequest(NotificationBase):
    """
    Represents a request to create a new notification.

    Attributes:
        notification_title (str): The title of the notification.
        notification_content (str): The content of the notification.
        notification_is_new (bool): Whether the notification is new.
        notification_sender_id (int): The ID of the sender of the notification.
        notification_receiver_id (int): The ID of the receiver of the notification.
    """

    notification_title: str
    notification_content: str
    notification_is_new: bool
    notification_sender_id: int
    notification_receiver_id: int


class NotificationUpdateRequest(BaseModel):
    """
    Represents a request to update a notification.

    Attributes:
        notification_title (str): The title of the notification.
        notification_content (str): The content of the notification.
        notification_is_new (bool): Whether the notification is new.
        notification_receiver_id (int): The ID of the receiver of the notification.
    """

    notification_title: str
    notification_content: str
    notification_is_new: bool
    notification_receiver_id: int
