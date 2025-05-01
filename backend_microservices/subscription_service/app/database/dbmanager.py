from sqlalchemy.orm import Session

from subscription_service.app.database.model import Subscription

class SubscriptionDB:
    """
    Database interface for subscription management.
    Handles creation, updating, retrieval, and deletion of user subscriptions.
    """

    @staticmethod
    def create_subscription(db: Session, **kwargs):
        user_id = kwargs.get("user_id")
        subscription_tier = kwargs.get("subscription_tier")
        start_date = kwargs.get("start_date")
        end_date = kwargs.get("end_date")
        auto_renew = kwargs.get("auto_renew")

        subscription_entry = Subscription(
            user_id=user_id,
            subscription_tier=subscription_tier,
            start_date=start_date,
            end_date=end_date,
            auto_renew=auto_renew
        )
        db.add(subscription_entry)
        db.commit()
        db.refresh(subscription_entry)
        return subscription_entry.to_dict()

    @staticmethod
    def get_subscription(db: Session, user_id: int):
        subscription_entry = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        return subscription_entry.to_dict() if subscription_entry else None

    @staticmethod
    def update_subscription(db: Session, **kwargs):
        user_id = kwargs.get("user_id")
        subscription_tier = kwargs.get("subscription_tier")
        start_date = kwargs.get("start_date")
        end_date = kwargs.get("end_date")
        auto_renew = kwargs.get("auto_renew")

        subscription_entry = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        if not subscription_entry:
            raise ValueError("No active subscription found for the user.")

        subscription_entry.subscription_tier = subscription_tier
        subscription_entry.auto_renew = auto_renew
        subscription_entry.start_date= start_date
        subscription_entry.end_date = end_date

        db.commit()
        db.refresh(subscription_entry)
        return subscription_entry.to_dict()

    @staticmethod
    def delete_subscription(db: Session, user_id: int):
        subscription_entry = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        if subscription_entry:
            db.delete(subscription_entry)
            db.commit()

    @staticmethod
    def get_all_subscriptions(db: Session):
        """Retrieve all subscriptions from the database."""
        subscriptions = db.query(Subscription).all()
        return [subscription.to_dict() for subscription in subscriptions]
