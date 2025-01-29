from sqlalchemy import Column, ForeignKey, Integer,  PrimaryKeyConstraint, Date
from sqlalchemy.orm import relationship

from database.connection import db_connection

Base = db_connection.Base
class Analytics(Base):
    """
    Model for tracking daily user analytics, with a composite primary key of user_id and date.
    """

    __tablename__ = "analytics"

    user_id = Column(Integer, ForeignKey('users.user_id'))
    date = Column(Date, nullable=False, index=True)
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
            "time_spent": self.time_spent,
        }