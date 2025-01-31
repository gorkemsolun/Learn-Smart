from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, Request, HTTPException

from database.dbmanager import CourseDB

from database.session import get_db

router = APIRouter(prefix="/courses/private", tags=["Course"])

ALLOWED_IPS = ["127.0.0.1:8003"] # USER_SERVICE_IP, MOVE TO .ENV

def ip_restriction(request: Request):
    client_ip = request.client.host
    if client_ip not in ALLOWED_IPS:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid IP address")
    return client_ip


@router.get("/courses/{user_id}")
async def get_courses(user_id: int, db: Session = Depends(get_db), ip: str = Depends(ip_restriction)):
        """
        Get current user's courses.
    
        Args:
            current_user (dict): The current user.
    
        Returns:
            list: A list of courses.
        """
        courses = CourseDB.fetch(db, user_id=user_id, all=True)
        return courses