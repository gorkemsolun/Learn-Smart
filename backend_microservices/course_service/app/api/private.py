from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from course_service.app.database.dbmanager import CourseDB
from course_service.app.database.session import get_db
from course_service.app.security.auth import verify_api_key

router = APIRouter(
    prefix="/private", 
    tags=["Course - Private API"],
    dependencies=[Depends(verify_api_key)]
)

@router.get("/courses/{user_id}")
async def get_courses(user_id: int, db: Session = Depends(get_db)):
        """
        Get current user's courses.
    
        Args:
            current_user (dict): The current user.
    
        Returns:
            list: A list of courses.
        """
        courses = CourseDB.fetch(db, user_id=user_id, all=True)
        return courses
