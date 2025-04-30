from sqlalchemy import (
    Column, DateTime, Integer, String, func, ForeignKey, Date, PrimaryKeyConstraint
)
from sqlalchemy.orm import relationship

from user_service.app.database.session import Base

class User(Base):
    """
    Represents a user in the system.

    Attributes:
        user_id (int): The unique identifier for the user.
        nickname (str): The nickname of the user.
        email (str): The email address of the user.
        hashed_password (str): The hashed password of the user.
        created_at (datetime): The timestamp when the user was created.
        courses (list): The list of courses associated with the user.
    """

    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_icon_fid = Column(Integer, nullable=True) # file id

    analytics = relationship("Analytics", back_populates="user")

    def to_dict(self):
        """
        Converts the user object to a dictionary.

        Returns:
            dict: A dictionary representation of the user object.
        """
        
        return {
            "user_id": self.user_id,
            "nickname": self.nickname,
            "email": self.email,
            "created_at": self.created_at,
            "hashed_password": self.hashed_password,
            "user_icon_fid": self.user_icon_fid
        }

    # attributes might be added
    # possible feature: email verification and we'd need some more attributes here


class Analytics(Base):
    """
    Model for tracking daily user analytics, with a composite primary key of user_id and date.
    """

    __tablename__ = "analytics"

    user_id = Column(Integer, ForeignKey('users.user_id'))
    date = Column(Date, nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    time_spent = Column(Integer, nullable=False, default=0)

    user = relationship("User", back_populates="analytics")

    __table_args__ = (
        PrimaryKeyConstraint("user_id", "date", name="pk_user_date"),
    )

    def to_dict(self):
        """
        Converts the Analytics object into a dictionary.

        Returns:
        - dict: A dictionary representation of the object.
        """
        return {
            "user_id": self.user_id,
            "date": self.date.isoformat(),
            "timestamp": self.timestamp.isoformat(),
            "time_spent": self.time_spent,
        }
