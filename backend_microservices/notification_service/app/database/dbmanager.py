from notification_service.app.database.model import Condition
from sqlalchemy.orm import Session


class ConditionDB:
    """
    Database interface for condition storage.
    """

    @staticmethod
    def get_all_conditions(db: Session):
        return [cond.to_dict() for cond in db.query(Condition).all()]

    @staticmethod
    def update_condition(db: Session, condition_id: int, **kwargs):
        cond = (
            db.query(Condition).filter(Condition.condition_id == condition_id).first()
        )
        if not cond:
            return None
        for key, value in kwargs.items():
            setattr(cond, key, value)
        db.commit()
        db.refresh(cond)
        return cond.to_dict()
