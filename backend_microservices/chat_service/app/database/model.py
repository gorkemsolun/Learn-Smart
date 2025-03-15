from sqlalchemy import Column, Integer, UniqueConstraint, DateTime, String, Boolean, ForeignKey, func
from sqlalchemy.orm import relationship
from datetime import datetime
from chat_service.app.database.session import Base 

class Chat(Base):
    """
    Represents a chat in the system.
    """

    __tablename__ = 'chats'
    chat_id = Column(Integer, primary_key=True, index=True)
    chat_title = Column(String(150), nullable=False)
    course_id = Column(Integer, nullable=False)
    history_fid = Column(Integer, nullable=True) # null if no messages in the chat yet, or the chat is in slides mode
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    slides_mode = Column(Boolean, default=False)
    last_opened_slide_id = Column(Integer, nullable=True)  # the last opened slide ID

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
            "history_fid": self.history_fid,
            "slides_mode": self.slides_mode,
            "created_at": self.created_at,
            "last_opened_slide_id": self.last_opened_slide_id
        }
    

class Slide(Base):
    """
    Represents the slides in a chat and associated metadata (e.g. the last fetched slide of a user).
    """

    __tablename__ = 'slides'

    # ensure the combination of chat_id and slides_file_name is unique
    __table_args__ = (UniqueConstraint('chat_id', 'slides_file_name', name='_chat_slides_file_name_uc'),)

    slide_id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, nullable=False)  # the chat ID to which the slides belong
    course_id = Column(Integer, nullable=False)  # the course ID to which the slides belong
    slides_file_name = Column(String(255), nullable=False)  # slides' original file name, e.g. Lecture_1.pptx
    slides_fid = Column(Integer, nullable=False)  # slides file ID
    pages_count = Column(Integer, nullable=False)  # the total number of pages in the slides file
    last_opened_page_number = Column(Integer, nullable=False)  # the last fetched page ID (e.g. page ID: 3 of a slides file)

    pages = relationship("SlidePage", back_populates="slide", cascade="all, delete-orphan")

    def to_dict(self):
        """
        Converts the Slide object to a dictionary.

        Returns:
            dict: A dictionary representation of the Slide object.
        """

        return {
            "slide_id": self.slide_id,
            "chat_id": self.chat_id,
            "course_id": self.course_id,
            "slides_file_name": self.slides_file_name,
            "slides_fid": self.slides_fid,
            "pages_count": self.pages_count,
            "last_opened_page_number": self.last_opened_page_number
        }
    

class SlidePage(Base):
    """
    Represents a page in a slide.
    """
    __tablename__ = 'slide_pages'
    
    slide_id = Column(Integer, ForeignKey('slides.slide_id'), primary_key=True)
    page_number = Column(Integer, primary_key=True)
    content_fid = Column(Integer, nullable=False) # File ID of the page content (since the page content is stored as a file)
    chat_history_fid = Column(Integer, nullable=False) # File ID of the chat history for the page
    
    # Relationship to parent Slide
    slide = relationship("Slide", back_populates="pages")

    def to_dict(self):
        """
        Converts the SlidePage object to a dictionary.

        Returns:
            dict: A dictionary representation of the SlidePage object.
        """

        return {
            "slide_id": self.slide_id,
            "page_number": self.page_number,
            "content_fid": self.content_fid,
            "chat_history_fid": self.chat_history_fid
        }
    

class Quiz(Base):
    """
    Represents a quiz in the system.
    """

    __tablename__ = 'quizzes'

    quiz_id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, nullable=False)  # the chat ID to which the quiz belongs
    course_id = Column(Integer, nullable=False)  # the course ID to which the quiz belongs
    quiz_title = Column(
        String(150), 
        nullable=False,
        default=lambda: f"Quiz {datetime.now().strftime('%B %d, %Y at %I:%M:%S %p')}"
    )
    quiz_fid = Column(Integer, nullable=False)  # quiz file ID
    num_questions = Column(Integer, nullable=False)  # the number of questions in the quiz
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        """
        Converts the Quiz object to a dictionary.

        Returns:
            dict: A dictionary representation of the Quiz object.
        """

        return {
            "quiz_id": self.quiz_id,
            "chat_id": self.chat_id,
            "course_id": self.course_id,
            "quiz_title": self.quiz_title,
            "quiz_fid": self.quiz_fid,
            "num_questions": self.num_questions,
            "created_at": self.created_at
        }
    

class Flashcard(Base):
    """
    Represents a flashcard in the system.
    """

    __tablename__ = 'flashcards'

    flashcard_id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, nullable=False)  # the chat ID to which the flashcard belongs
    course_id = Column(Integer, nullable=False)  # the course ID to which the flashcard belongs
    flashcard_title = Column(String(150), nullable=False) # flashcard title
    flashcard_fid = Column(Integer, nullable=False)  # flashcard file ID
    num_flashcards = Column(Integer, nullable=False)  # the number of flashcards in the set
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        """
        Converts the Flashcard object to a dictionary.

        Returns:
            dict: A dictionary representation of the Flashcard object.
        """

        return {
            "flashcard_id": self.flashcard_id,
            "chat_id": self.chat_id,
            "course_id": self.course_id,
            "flashcard_title": self.flashcard_title,
            "flashcard_fid": self.flashcard_fid,
            "num_flashcards": self.num_flashcards,
            "created_at": self.created_at
        }
