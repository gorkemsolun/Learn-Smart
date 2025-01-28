from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint, DateTime, String, func,  Boolean
from sqlalchemy.orm import relationship
from database.session import Base 

class Chat(Base):
    """
    Represents a chat in the system.
    """

    __tablename__ = 'chats'
    chat_id = Column(Integer, primary_key=True, index=True)
    chat_title = Column(String(150), nullable=False)
    course_id = Column(Integer, nullable=False)
    history_url = Column(String(255))
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
            "history_url": self.history_url,
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
    slides_file_url = Column(String(255), nullable=False, unique=True)  # slides file URL, e.g. ./.../<ffb1e29cc1...>.pptx
    pages_count = Column(Integer, nullable=False)  # the total number of pages in the slides file
    last_slide_number = Column(Integer, nullable=False)  # the last fetched slide number (e.g. page 3 of a slides file)

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
            "slides_file_url": self.slides_file_url,
            "pages_count": self.pages_count,
            "last_slide_number": self.last_slide_number
        }
    
class Quiz(Base):
    """
    Represents a quiz in the system.
    """

    __tablename__ = 'quizzes'

    quiz_id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, nullable=False)  # the chat ID to which the quiz belongs
    course_id = Column(Integer, nullable=False)  # the course ID to which the quiz belongs
    quiz_file_name = Column(String(150), nullable=False) # quiz title (e.g. filename)
    quiz_file_url = Column(String(255), nullable=False, unique=True)  # quiz file URL, e.g. ./.../<ffb1e29cc1...>.json
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
            "quiz_file_name": self.quiz_file_name,
            "quiz_file_url": self.quiz_file_url,
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
    flashcard_file_name = Column(String(150), nullable=False) # flashcard title (e.g. filename)
    flashcard_file_url = Column(String(255), nullable=False, unique=True)  # flashcard file URL, e.g. ./.../<ffb1e29cc1...>.json
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
            "flashcard_file_name": self.flashcard_file_name,
            "flashcard_file_url": self.flashcard_file_url,
            "num_flashcards": self.num_flashcards,
            "created_at": self.created_at
        }
