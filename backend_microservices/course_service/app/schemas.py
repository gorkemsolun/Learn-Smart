from pydantic import BaseModel
from typing import Optional

class CourseCreationRequest(BaseModel):
    """
    Represents a request to create a new course.

    Attributes:
        course_name (str): The name of the course. # Example: Operating Systems
        course_code (str): The code of the course. # Example: CS 342
        course_description (str): The course_description of the course.
    """
    course_name: str
    course_code: str
    course_description: Optional[str] = None


class CourseUpdateRequest(BaseModel):
    """
    Represents a request to update a course.

    Attributes:
        course_name (str): The name of the course. # Example: Operating Systems
        course_code (str): The code of the course. # Example: CS 342
        course_description (str): The course_description of the course.
    """
    course_name: Optional[str] = None
    course_code: Optional[str] = None
    course_description: Optional[str] = None
