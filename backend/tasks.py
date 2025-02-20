from database.dbmanager import SubscriptionDB
from datetime import datetime, timedelta
from celery_app import celery_app

@celery_app.task
def process_subscriptions():
    """Check subscriptions and renew/delete accordingly."""
    subscriptions = SubscriptionDB.get_all_subscriptions()

    for sub in subscriptions:
        if sub["end_date"] <= datetime.now():
            if sub["auto_renew"]:
                new_end_date = datetime.now() + timedelta(days=30 if sub["subscription_tier"] == "monthly" else 365)
                SubscriptionDB.update_subscription(
                    user_id=sub["user_id"],
                    subscription_tier=sub["subscription_tier"],
                    auto_renew=sub["auto_renew"],
                    start_date=datetime.now(),
                    end_date=new_end_date,
                )
            else:
                SubscriptionDB.delete_subscription(user_id=sub["user_id"])

