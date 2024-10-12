from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint, DateTime, String, func,  Boolean
from sqlalchemy.orm import relationship

from database.connection import db_connection

Base = db_connection.Base

class Chat(Base):
    """
    Represents a chat in the system.
    """

    __tablename__ = 'chats'
    chat_id = Column(Integer, primary_key=True, index=True)
    chat_title = Column(String(150), nullable=False)
    course_id = Column(Integer, ForeignKey('courses.course_id'), nullable=False)
    history_url = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    slides_mode = Column(Boolean, default=False)
    
    # quiz relationships, quiz URLs, might be added here
    slide = relationship("Slide", uselist=False, back_populates="chat") # one-to-one relationship with Slide
    course = relationship("Course", back_populates="chats") # many-to-one relationship with Course

    def to_dict(self):
        """
        Converts the Chat object to a dictionary.

        Returns:
            dict: A dictionary representation of the Chat object.
        """
        
        return {
            "chat_id": self.chat_id,
            "chat_title": self.chat_title,
            "course_id": self.course_id,
            "history_url": self.history_url,
            "slides_mode": self.slides_mode,
            "created_at": self.created_at
        }
    

class Slide(Base):
    """
    Represents the slides in a chat and associated metadata (e.g. the last fetched slide of a user).
    """

    __tablename__ = 'slides'

    # ensure the combination of chat_id and slides_file_name is unique
    __table_args__ = (UniqueConstraint('chat_id', 'slides_file_name', name='_chat_slides_file_name_uc'),)

    slide_id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey('chats.chat_id'))  # the chat ID to which the slides belong
    slides_file_name = Column(String(255), nullable=True)  # slides' original file name, e.g. Lecture_1.pptx
    slides_file_url = Column(String(255), nullable=False, unique=True)  # slides file URL, e.g. ./.../<ffb1e29cc1...>.pptx
    pages_count = Column(Integer, nullable=False)  # the total number of pages in the slides file
    last_slide_number = Column(Integer, nullable=False)  # the last fetched slide number (e.g. page 3 of a slides file)

    chat = relationship("Chat", back_populates="slide")  # one-to-one relationship with Chat

    def to_dict(self):
        """
        Converts the Slide object to a dictionary.

        Returns:
            dict: A dictionary representation of the Slide object.
        """

        return {
            "chat_id": self.chat_id,
            "slides_file_name": self.slides_file_name,
            "slides_file_url": self.slides_file_url,
            "pages_count": self.pages_count,
            "last_slide_number": self.last_slide_number
        }