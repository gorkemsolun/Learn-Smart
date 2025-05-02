from notification_service.app.database.session import Base
from sqlalchemy import Column, DateTime, Integer, String, func


class Condition(Base):
    """
    Represents a checkable condition in the system.
    """

    __tablename__ = "conditions"

    condition_id = Column(Integer, primary_key=True, index=True)
    # Example field; could be JSON or expression
    expression = Column(String, nullable=False)
    last_checked = Column(DateTime(timezone=True), server_default=func.now())
    last_notified = Column(DateTime(timezone=True), nullable=True)

    def to_dict(self):
        return {
            "condition_id": self.condition_id,
            "expression": self.expression,
            "last_checked": self.last_checked,
            "last_notified": self.last_notified,
        }
