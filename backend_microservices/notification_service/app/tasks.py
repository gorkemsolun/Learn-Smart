from notification_service.app.celery_app import celery_app
from notification_service.app.util import check_condition, send_notification


@celery_app.task
def check_and_notify():
    """
    Periodically checks the condition and sends a notification if met.
    """
    condition_met, message = check_condition()
    if condition_met and message:
        send_notification(message)
