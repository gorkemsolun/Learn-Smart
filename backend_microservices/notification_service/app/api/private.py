from fastapi import APIRouter, Depends
from notification_service.app.security.auth import verify_api_key
from notification_service.app.tasks import check_and_notify

router = APIRouter(
    prefix="/private",
    tags=["Notification - Private API"],
    dependencies=[Depends(verify_api_key)],
)


@router.post("/trigger")
async def trigger_check():
    """
    Manually trigger the condition check and notification.
    """
    check_and_notify.delay()
    return {"message": "Condition check triggered."}
