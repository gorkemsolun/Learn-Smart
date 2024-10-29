from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, func, UniqueConstraint
from sqlalchemy.orm import relationship

from database.connection import db_connection

Base = db_connection.Base

class Course(Base):
    """
    Represents a course in the system.
    """

    __tablename__ = 'courses'

    course_id = Column(Integer, primary_key=True, index=True)
    course_name = Column(String(255), nullable=False) # e.g. Operating Systems
    course_code = Column(String(16)) # e.g. CS 342
    course_description = Column(String(1024), nullable=True)
    course_syllabus_url = Column(String(255), nullable=True)
    course_study_plan_url = Column(String(255), nullable=True)
    course_icon_url = Column(String(255), nullable=True) # nullable for now (generate an image for the course in the future)
    user_id = Column(Integer, ForeignKey('users.user_id'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="courses")
    chats = relationship("Chat", back_populates="course")

    # Add a unique constraint for user_id and course_code
    __table_args__ = (UniqueConstraint('user_id', 'course_code', name='user_course_unique'),)

    def to_dict(self):
        """
        Converts the Course object to a dictionary.

        Returns:
            dict: A dictionary representation of the Course object.
        """
        
        return {
            "course_id": self.course_id,
            "course_name": self.course_name,
            "course_description": self.course_description,
            "course_code": self.course_code,
            "user_id": self.user_id,
            "course_syllabus_url": self.course_syllabus_url,
            "course_study_plan_url": self.course_study_plan_url,
            "course_icon_url": self.course_icon_url
        }