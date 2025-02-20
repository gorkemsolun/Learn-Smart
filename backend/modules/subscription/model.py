from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, Boolean, func, UniqueConstraint
from sqlalchemy.orm import relationship

from database.connection import db_connection

Base = db_connection.Base


class Subscription(Base):
    """
    Represents a user's subscription in the system.
    """

    __tablename__ = 'subscriptions'

    subscription_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    subscription_tier = Column(String(16), nullable=False)
    start_date = Column(DateTime(timezone=True), server_default=func.now())
    end_date = Column(DateTime(timezone=True), nullable=False)
    auto_renew = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="subscriptions")

    # Ensure a user has only one active subscription at a time
    __table_args__ = (UniqueConstraint('user_id', 'end_date', name='user_subscription_unique'),)

    def to_dict(self):
        """
        Converts the Subscription object to a dictionary.

        Returns:
            dict: A dictionary representation of the Subscription object.
        """

        return {
            "subscription_id": self.subscription_id,
            "user_id": self.user_id,
            "subscription_tier": self.subscription_tier,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "auto_renew": self.auto_renew,
        }
