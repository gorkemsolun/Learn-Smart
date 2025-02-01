from sqlalchemy.orm import Session
from sqlalchemy import and_

from chat_service.app.database.model import Chat, Slide, SlidePage, Quiz, Flashcard

class ChatDB:
    """
    Database interface for the Chat model.
    """

    @staticmethod
    def create(
        db: Session,
        course_id: int,
        chat_title: str,
        history_url: str = None,
        slides_mode: bool = False,
        last_opened_slide_id: int = None,
    ):
        """
        Create a new chat object and save it in the database.

        Parameters:
        - db (Session): The database session.
        - course_id (int): The ID of the course associated with the chat.
        - chat_title (str): The title of the chat.
        - history_url (str, optional): The URL of the chat's history.
        - slides_mode (bool, optional): Indicates whether the chat has slides.
        - last_opened_slide_id (int, optional): The ID of the last opened slide.

        Returns:
        - dict: A dictionary representation of the created chat object.
        """
        chat = Chat(
            course_id=course_id,
            chat_title=chat_title,
            history_url=history_url,
            slides_mode=slides_mode,
            last_opened_slide_id=last_opened_slide_id,
        )

        # save the chat object in the database
        db.add(chat)
        db.commit()
        db.refresh(chat)

        return chat.to_dict()
    

    @staticmethod
    def fetch(db: Session, **kwargs):
        """
        Fetches chat data from the database based on the provided query parameters.

        Args:
            db (Session): The database session.
            chat_id (int): The ID of the chat.
            chat_title (str): The title of the chat.
            course_id (int): The ID of the course.
            all (bool, optional): If True, fetches all matching chat records. If False (default), fetches only the first matching record.

        Returns:
            dict or list: A dictionary representing the fetched chat record if `all` is False and a matching record is found.
                          A list of dictionaries representing all fetched chat records if `all` is True and matching records are found.
                          None if no matching record is found and `all` is False.
                          An empty list if no matching records are found and `all` is True.

        Raises:
            ValueError: If no query parameters are provided.
        """
        chat_id = kwargs.get("chat_id", None)
        chat_title = kwargs.get("chat_title", None)
        course_id = kwargs.get("course_id", None)
        all = kwargs.get("all", False)

        if not any(
            [chat_id, chat_title, course_id]
        ):  # check if any query parameters are provided
            raise ValueError("No query parameters provided")

        # Create a list of filters based on the provided query parameters
        filters = []
        if chat_id:
            filters.append(Chat.chat_id == chat_id)
        if chat_title:
            filters.append(Chat.chat_title == chat_title)
        if course_id:
            filters.append(Chat.course_id == course_id)

        query = db.query(Chat).filter(and_(*filters))  # apply filters to the query
        result = (
            query.all() if all else query.first()
        )  # fetch all chats or just the first one

        if all:
            return (
                [chat.to_dict() for chat in result] if result else []
            )  # return a list of chat dicts

        return (
            result.to_dict() if result else None
        )  # return a single chat dict or None

    @staticmethod
    def update(db: Session, chat_id: int, **kwargs):
        """
        Update the chat details in the database.

        Args:
            db (Session): The database session.
            chat_id (int): The ID of the chat to update.
            **kwargs: Keyword arguments for the fields to update. Possible keyword arguments include:
                - chat_title (str): The new title for the chat.
                - history_url (str): The new history URL for the chat.
                - slides_mode (bool): Enable/disable slides mode of the chat.
                - last_opened_slide_id: The last opened slide's ID of the chat.

        Returns:
            dict: A dictionary representing the updated chat details.

        Raises:
            ValueError: If the chat with the specified ID is not found in the database.
        """
        chat_title = kwargs.get("chat_title", None)
        history_url = kwargs.get("history_url", None)
        slides_mode = kwargs.get("slides_mode", None)
        last_opened_slide_id = kwargs.get("last_opened_slide_id", None)

        chat = db.query(Chat).filter(Chat.chat_id == chat_id).first()
        if not chat:
            raise ValueError(f"Chat with ID {chat_id} not found")

        if chat_title:
            chat.chat_title = chat_title
        if history_url:
            chat.history_url = history_url
        if slides_mode is not None:
            chat.slides_mode = slides_mode
        if last_opened_slide_id:
            chat.last_opened_slide_id = last_opened_slide_id

        db.commit()
        db.refresh(chat)

        return chat.to_dict()

    @staticmethod
    def delete(db: Session, **kwargs):
        """
        Deletes a chat from the database.

        Args:
        - db (Session): The database session.
        - **kwargs: Additional keyword arguments for specifying query parameters.
            - chat_id (int): The ID of the chat to be deleted.
            - course_id (int): The ID of the course associated with the chat to be deleted.
            - all (bool): Flag indicating whether to delete all matching chats or just the first one. Default is False.

        """
        chat_id = kwargs.get("chat_id", None)
        course_id = kwargs.get("course_id", None)
        all = kwargs.get("all", False)

        if not any([chat_id, course_id]):
            raise ValueError("No query parameters provided")

        # Create a list of filters based on the provided query parameters
        filters = []
        if chat_id:
            filters.append(Chat.chat_id == chat_id)
        if course_id:
            filters.append(Chat.course_id == course_id)

        query = db.query(Chat).filter(and_(*filters))
        result = query.all() if all else [query.first()]

        if not result:
            return []

        ret = [] # list to store the deleted chat objects
        for chat in result:
            ret.append(chat.to_dict())
            db.delete(chat)
        db.commit()

        return ret
    

class SlideDB:
    """
    Database interface for the Slide model.
    """

    @staticmethod
    def create(
        db: Session,
        chat_id: int,
        course_id: int,
        slides_file_name: str,
        slides_file_url: str,
        pages_count: int,
        last_slide_number: int,
    ):
        """
        Create a new slide object and save it in the database.

        Parameters:
        - db (Session): The database session.
        - chat_id (int): The ID of the chat associated with the slides.
        - slides_file_name (str): The filename of the slides.
        - slides_file_url (str): The URL of the slides.
        - pages_count (int): The total number of pages in the slides file.
        - last_slide_number (int): The last fetched slide number.

        Returns:
        - dict: A dictionary representation of the created slide object.
        """
        slide = Slide(
            chat_id=chat_id,
            course_id=course_id,
            slides_file_name=slides_file_name,
            slides_file_url=slides_file_url,
            pages_count=pages_count,
            last_slide_number=last_slide_number,
        )

        # save the slide object in the database
        db.add(slide)
        db.commit()
        db.refresh(slide)

        return slide.to_dict()

    @staticmethod
    def fetch(db: Session, **kwargs):
        """
        Fetches slide data from the database based on the provided query parameters.

        Args:
            - db (Session): The database session.
            - slide_id (int): The ID of the slide.
            - chat_id (int): The ID of the chat associated with the slide.
            - course_id (int): The ID of the course associated with the slide.
            - slides_file_name (str): The filename of the slides.
            - slides_file_url (str): The URL of the slides.
            - pages_count (int): The total number of pages in the slides file.
            - last_slide_number (int): The last fetched slide number.
            - all (bool): Flag indicating whether to fetch all matching slide records. Default is False.

        Returns:
            - dict or list: A dictionary representing the fetched slide record if `all` is False and a matching record is found.
                            A list of dictionaries representing all fetched slide records if `all` is True and matching records are found.
                            None if no matching record is found and `all` is False.
                            An empty list if no matching records are found and `all` is True.

        Raises:
            - ValueError: If no query parameters are provided.
        """
        slide_id = kwargs.get("slide_id", None)
        chat_id = kwargs.get("chat_id", None)
        course_id = kwargs.get("course_id", None)
        slides_file_name = kwargs.get("slides_file_name", None)
        slides_file_url = kwargs.get("slides_file_url", None)
        pages_count = kwargs.get("pages_count", None)
        last_slide_number = kwargs.get("last_slide_number", None)
        all = kwargs.get("all", False)

        if not any(
            [slide_id, chat_id, course_id, slides_file_name,
             slides_file_url, pages_count, last_slide_number]
        ):
            raise ValueError("No query parameters provided")

        # Create a list of filters based on the provided query parameters
        filters = []
        if slide_id:
            filters.append(Slide.slide_id == slide_id)
        if chat_id:
            filters.append(Slide.chat_id == chat_id)
        if course_id:
            filters.append(Slide.course_id == course_id)
        if slides_file_name:
            filters.append(Slide.slides_file_name == slides_file_name)
        if slides_file_url:
            filters.append(Slide.slides_file_url == slides_file_url)
        if pages_count:
            filters.append(Slide.pages_count == pages_count)
        if last_slide_number:
            filters.append(Slide.last_slide_number == last_slide_number)
        
        query = db.query(Slide).filter(and_(*filters))
        result = query.all() if all else query.first()

        if all:
            return [slide.to_dict() for slide in result] if result else []
        return result.to_dict() if result else None

    @staticmethod
    def update(db: Session, slide_id: int, **kwargs):
        """
        Update the slide details in the database.

        Args:
            - db (Session): The database session.
            - slide_id (int): The ID of the slide to update.
            - **kwargs: Keyword arguments for the fields to update. Possible keyword arguments include:
                - slides_file_name (str): The new filename for the slide.
                - slides_file_url (str): The new URL for the slide.
                - last_slide_number (int): The new last fetched slide number.

        Returns:
            - dict: A dictionary representing the updated slide details.

        Raises:
            - ValueError: If the slide with the specified ID is not found in the database.
        """
        slides_file_name = kwargs.get("slides_file_name", None)
        slides_file_url = kwargs.get("slides_file_url", None)
        last_slide_number = kwargs.get("last_slide_number", None)

        slide = db.query(Slide).filter(Slide.slide_id == slide_id).first()
        if not slide:
            raise ValueError(f"No slide with ID {slide_id} found")

        if slides_file_name:
            slide.slides_file_name = slides_file_name
        if slides_file_url:
            slide.slides_file_url = slides_file_url
        if last_slide_number:
            slide.last_slide_number = last_slide_number

        db.commit()
        db.refresh(slide)

        return slide.to_dict()
        
    @staticmethod
    def delete(db: Session, **kwargs):
        """
        Deletes a slide from the database.

        Args:
        - db (Session): The database session.
        - **kwargs: Additional keyword arguments for specifying query parameters.
            - slide_id (int): The ID of the slide to be deleted.
            - chat_id (int): The ID of the chat associated with the slide to be deleted.
            - course_id (int): The ID of the course associated with the slide to be deleted.
            - all (bool): Flag indicating whether to delete all matching slides or just the first one. Default is False.

        Returns:
        - list: A list of dictionaries representing the deleted slides.
        """
        slide_id = kwargs.get("slide_id", None)
        chat_id = kwargs.get("chat_id", None)
        course_id = kwargs.get("course_id", None)
        all = kwargs.get("all", False)

        if not any([slide_id, chat_id, course_id]):
            raise ValueError("No query parameters provided")

        filters = []
        if slide_id:
            filters.append(Slide.slide_id == slide_id)
        if chat_id:
            filters.append(Slide.chat_id == chat_id)
        if course_id:
            filters.append(Slide.course_id == course_id)

        query = db.query(Slide).filter(and_(*filters))
        result = query.all() if all else [query.first()]

        if not result:
            return []
        
        ret = [] # list to store the deleted slide objects
        for slide in result:
            ret.append(slide.to_dict())
            db.delete(slide)
        
        db.commit()

        return ret
    

class SlidePageDB:
    """
    Database interface for the SlidePage model.
    """

    @staticmethod
    def create(db: Session, slide_id: int, page_number: int, 
               content_fid: int, chat_history_fid: int):
        """
        Create a new slide page object and save it in the database.

        Args:
        - db (Session): The database session.
        - slide_id (int): The ID of the slide associated with the page.
        - page_number (int): The page number of the slide.
        - chat_history_fid (int): The chat history file ID.

        Returns:
        - dict: A dictionary representation of the created slide page object.
        """
        slide_page = SlidePage(
            slide_id=slide_id,
            page_number=page_number,
            content_fid=content_fid,
            chat_history_fid=chat_history_fid
        )

        db.add(slide_page)
        db.commit()
        db.refresh(slide_page)

        return slide_page.to_dict()

    @staticmethod
    def fetch(db: Session, **kwargs):
        """
        Fetches slide page data from the database based on the provided query parameters.

        Args:
        - db (Session): The database session.
        - page_id (int): The ID of the slide page.
        - slide_id (int): The ID of the slide associated with the page.
        - all (bool): Flag indicating whether to fetch all matching slide page records. Default is False.

        Returns:
        - dict or list: A dictionary representing the fetched slide page record if `all` is False and a matching record is found.
                        A list of dictionaries representing all fetched slide page records if `all` is True and matching records are found.
                        None if no matching record is found and `all` is False.
                        An empty list if no matching records are found and `all` is True.
        """
        page_id = kwargs.get("page_id", None)
        slide_id = kwargs.get("slide_id", None)
        all = kwargs.get("all", False)

        if not any([page_id, slide_id]):
            raise ValueError("No query parameters provided")

        filters = []
        if page_id:
            filters.append(SlidePage.page_id == page_id)
        if slide_id:
            filters.append(SlidePage.slide_id == slide_id)

        query = db.query(SlidePage).filter(and_(*filters))
        result = query.all() if all else query.first()

        if all:
            return [page.to_dict() for page in result] if result else []
        
        return result.to_dict() if result else None
    

    @staticmethod
    def update(db: Session, page_id: int, **kwargs):
        """
        Update the slide page details in the database.

        Args:
        - db (Session): The database session.
        - page_id (int): The ID of the slide page to update.
        - **kwargs: Keyword arguments for the fields to update. Possible keyword arguments include:
            - content_fid (int): The new content file ID.
            - chat_history_fid (int): The new chat history file ID.

        Returns:
        - dict: A dictionary representing the updated slide page details.

        Raises:
        - ValueError: If the slide page with the specified ID is not found in the database.
        """
        content_fid = kwargs.get("content_fid", None)
        chat_history_fid = kwargs.get("chat_history_fid", None)

        page = db.query(SlidePage).filter(SlidePage.page_id == page_id).first()
        if not page:
            raise ValueError(f"No slide page with ID {page_id} found")

        if content_fid:
            page.content_fid = content_fid
        if chat_history_fid:
            page.chat_history_fid = chat_history_fid

        db.commit()
        db.refresh(page)

        return page.to_dict()


    @staticmethod
    def delete(db: Session, **kwargs):
        """
        Deletes a slide page from the database.

        Args:
        - db (Session): The database session.
        - **kwargs: Additional keyword arguments for specifying query parameters.
            - page_id (int): The ID of the slide page to be deleted.
            - slide_id (int): The ID of the slide associated with the page to be deleted.
            - all (bool): Flag indicating whether to delete all matching slide pages or just the first one. Default is False.

        Returns:
        - list: A list of dictionaries representing the deleted slide pages.
        """
        page_id = kwargs.get("page_id", None)
        slide_id = kwargs.get("slide_id", None)
        all = kwargs.get("all", False)

        if not any([page_id, slide_id]):
            raise ValueError("No query parameters provided")

        filters = []
        if page_id:
            filters.append(SlidePage.page_id == page_id)
        if slide_id:
            filters.append(SlidePage.slide_id == slide_id)

        query = db.query(SlidePage).filter(and_(*filters))
        result = query.all() if all else [query.first()]

        if not result:
            return []
        
        ret = []
        for page in result:
            ret.append(page.to_dict())
            db.delete(page)

        db.commit()

        return ret

class QuizDB:
    """
    Database interface for the Quiz model.
    """

    @staticmethod
    def create(db: Session, 
               chat_id: int, 
               course_id: int,
               quiz_file_name: str,
               quiz_file_url: str,
               num_questions: int):
        """
        Create a new quiz object and save it in the database.

        Args:
        - db (Session): The database session.
        - chat_id (int): The ID of the chat associated with the quiz.
        - course_id (int): The ID of the course associated with the quiz.
        - quiz_file_name (str): The title of the quiz.
        - quiz_file_url (str): The URL of the quiz file.
        - num_questions (int): The number of questions in the quiz.

        Returns:
        - dict: A dictionary representation of the created quiz object.
        """
        quiz = Quiz(
            chat_id=chat_id,
            course_id=course_id,
            quiz_file_name=quiz_file_name,
            quiz_file_url=quiz_file_url,
            num_questions=num_questions
        )

        db.add(quiz)
        db.commit()
        db.refresh(quiz)

        return quiz.to_dict()

    @staticmethod
    def fetch(db: Session, **kwargs):
        """
        Fetches quiz data from the database based on the provided query parameters.

        Args:
        - db (Session): The database session.
        - quiz_id (int): The ID of the quiz.
        - chat_id (int): The ID of the chat associated with the quiz.
        - course_id (int): The ID of the course associated with the quiz.
        - quiz_file_name (str): The filename of the quiz.
        - quiz_file_url (str): The URL of the quiz file.
        - all (bool): Flag indicating whether to fetch all matching quiz records. Default is False.

        Returns:
        - dict or list: A dictionary representing the fetched quiz record if `all` is False and a matching record is found.
                        A list of dictionaries representing all fetched quiz records if `all` is True and matching records are found.
                        None if no matching record is found and `all` is False.
                        An empty list if no matching records are found and `all` is True.

        Raises:
        - ValueError: If no query parameters are provided.
        """
        quiz_id = kwargs.get("quiz_id", None)
        chat_id = kwargs.get("chat_id", None)
        course_id = kwargs.get("course_id", None)
        quiz_file_name = kwargs.get("quiz_file_name", None)
        quiz_file_url = kwargs.get("quiz_file_url", None)
        all = kwargs.get("all", False)

        if not any([quiz_id, chat_id, course_id, quiz_file_name, quiz_file_url]):
            raise ValueError("No query parameters provided")

        filters = []
        if quiz_id:
            filters.append(Quiz.quiz_id == quiz_id)
        if chat_id:
            filters.append(Quiz.chat_id == chat_id)
        if course_id:
            filters.append(Quiz.course_id == course_id)
        if quiz_file_name:
            filters.append(Quiz.quiz_file_name == quiz_file_name)
        if quiz_file_url:
            filters.append(Quiz.quiz_file_url == quiz_file_url)

        query = db.query(Quiz).filter(and_(*filters))
        result = query.all() if all else query.first()

        if all:
            return [quiz.to_dict() for quiz in result] if result else []
        
        return result.to_dict() if result else None
    

    @staticmethod
    def update(db: Session, quiz_id: int, **kwargs):
        """
        Update the quiz details in the database.

        Args:
        - db (Session): The database session.
        - quiz_id (int): The ID of the quiz to update.
        - **kwargs: Keyword arguments for the fields to update. Possible keyword arguments include:
            - quiz_file_name (str): The new title for the quiz.
            - quiz_file_url (str): The new URL for the quiz file.

        Returns:
        - dict: A dictionary representing the updated quiz details.

        Raises:
        - ValueError: If the quiz with the specified ID is not found in the database.
        """
        quiz_file_name = kwargs.get("quiz_file_name", None)
        quiz_file_url = kwargs.get("quiz_file_url", None)

        quiz = db.query(Quiz).filter(Quiz.quiz_id == quiz_id).first()
        if not quiz:
            raise ValueError(f"No quiz with ID {quiz_id} found")

        if quiz_file_name:
            quiz.quiz_file_name = quiz_file_name
        if quiz_file_url:
            quiz.quiz_file_url = quiz_file_url

        db.commit()
        db.refresh(quiz)

        return quiz.to_dict()
    

    @staticmethod
    def delete(db: Session, **kwargs):
        """
        Deletes a quiz from the database. Important note: This method does not delete the quiz file from the storage.

        Args:
        - db (Session): The database session.
        - **kwargs: Additional keyword arguments for specifying query parameters.
            - quiz_id (int): The ID of the quiz to be deleted.
            - chat_id (int): The ID of the chat associated with the quiz to be deleted.
            - course_id (int): The ID of the course associated with the quiz to be deleted.
            - all (bool): Flag indicating whether to delete all matching quizzes or just the first one. Default is False.

        Returns:
        - list: A list of dictionaries representing the deleted quizzes.
        """
        quiz_id = kwargs.get("quiz_id", None)
        chat_id = kwargs.get("chat_id", None)
        course_id = kwargs.get("course_id", None)
        all = kwargs.get("all", False)

        if not any([quiz_id, chat_id, course_id]):
            raise ValueError("No query parameters provided")

        filters = []
        if quiz_id:
            filters.append(Quiz.quiz_id == quiz_id)
        if chat_id:
            filters.append(Quiz.chat_id == chat_id)
        if course_id:
            filters.append(Quiz.course_id == course_id)

        query = db.query(Quiz).filter(and_(*filters))
        result = query.all() if all else [query.first()]

        if not result:
            return []
        
        ret = [] # list to store the deleted quiz objects
        for quiz in result:
            ret.append(quiz.to_dict())
            db.delete(quiz)
        
        db.commit()

        return ret
    

class FlashcardDB:
    """
    Database interface for the Flashcard model.
    """

    @staticmethod
    def create(db: Session, 
               chat_id: int, 
               course_id: int,
               flashcard_file_name: str,
               flashcard_file_url: str,
               num_flashcards: int):
        """
        Create a new flashcard object and save it in the database.

        Args:
        - db (Session): The database session.
        - chat_id (int): The ID of the chat associated with the flashcard.
        - course_id (int): The ID of the course associated with the flashcard.
        - flashcard_file_name (str): The title of the flashcard.
        - flashcard_file_url (str): The URL of the flashcard file.
        - num_flashcards (int): The number of flashcards in the set.

        Returns:
        - dict: A dictionary representation of the created flashcard object.
        """
        flashcard = Flashcard(
            chat_id=chat_id,
            course_id=course_id,
            flashcard_file_name=flashcard_file_name,
            flashcard_file_url=flashcard_file_url,
            num_flashcards=num_flashcards
        )

        db.add(flashcard)
        db.commit()
        db.refresh(flashcard)

        return flashcard.to_dict()


    @staticmethod
    def fetch(db: Session, **kwargs):
        """
        Fetches flashcard data from the database based on the provided query parameters.

        Args:
        - db (Session): The database session.
        - flashcard_id (int): The ID of the flashcard.
        - chat_id (int): The ID of the chat associated with the flashcard.
        - course_id (int): The ID of the course associated with the flashcard.
        - flashcard_file_name (str): The filename of the flashcard.
        - flashcard_file_url (str): The URL of the flashcard file.
        - all (bool): Flag indicating whether to fetch all matching flashcard records. Default is False.

        Returns:
        - dict or list: A dictionary representing the fetched flashcard record if `all` is False and a matching record is found.
                        A list of dictionaries representing all fetched flashcard records if `all` is True and matching records are found.
                        None if no matching record is found and `all` is False.
                        An empty list if no matching records are found and `all` is True.
        """
        flashcard_id = kwargs.get("flashcard_id", None)
        chat_id = kwargs.get("chat_id", None)
        course_id = kwargs.get("course_id", None)
        flashcard_file_name = kwargs.get("flashcard_file_name", None)
        flashcard_file_url = kwargs.get("flashcard_file_url", None)
        all = kwargs.get("all", False)

        if not any([flashcard_id, chat_id, course_id, flashcard_file_name, flashcard_file_url]):
            raise ValueError("No query parameters provided")

        filters = []
        if flashcard_id:
            filters.append(Flashcard.flashcard_id == flashcard_id)
        if chat_id:
            filters.append(Flashcard.chat_id == chat_id)
        if course_id:
            filters.append(Flashcard.course_id == course_id)
        if flashcard_file_name:
            filters.append(Flashcard.flashcard_file_name == flashcard_file_name)
        if flashcard_file_url:
            filters.append(Flashcard.flashcard_file_url == flashcard_file_url)

        query = db.query(Flashcard).filter(and_(*filters))
        result = query.all() if all else query.first()

        if all:
            return [flashcard.to_dict() for flashcard in result] if result else []
        
        return result.to_dict() if result else None
    

    @staticmethod
    def update(db: Session, flashcard_id: int, **kwargs):
        """
        Update the flashcard details in the database.

        Args:
        - db (Session): The database session.
        - flashcard_id (int): The ID of the flashcard to update.
        - **kwargs: Keyword arguments for the fields to update. Possible keyword arguments include:
            - flashcard_file_name (str): The new title for the flashcard.
            - flashcard_file_url (str): The new URL for the flashcard file.

        Returns:
        - dict: A dictionary representing the updated flashcard details.

        Raises:
        - ValueError: If the flashcard with the specified ID is not found in the database.
        """
        flashcard_file_name = kwargs.get("flashcard_file_name", None)
        flashcard_file_url = kwargs.get("flashcard_file_url", None)

        flashcard = db.query(Flashcard).filter(Flashcard.flashcard_id == flashcard_id).first()
        if not flashcard:
            raise ValueError(f"No flashcard with ID {flashcard_id} found")

        if flashcard_file_name:
            flashcard.flashcard_file_name = flashcard_file_name
        if flashcard_file_url:
            flashcard.flashcard_file_url = flashcard_file_url

        db.commit()
        db.refresh(flashcard)

        return flashcard.to_dict()
    

    @staticmethod
    def delete(db: Session, **kwargs):
        """
        Deletes a flashcard from the database. Important note: This method does not delete the flashcard file from the storage.

        Args:
        - db (Session): The database session.
        - **kwargs: Additional keyword arguments for specifying query parameters.
            - flashcard_id (int): The ID of the flashcard to be deleted.
            - chat_id (int): The ID of the chat associated with the flashcard to be deleted.
            - course_id (int): The ID of the course associated with the flashcard to be deleted.
            - all (bool): Flag indicating whether to delete all matching flashcards or just the first one. Default is False.

        Returns:
        - list: A list of dictionaries representing the deleted flashcards.
        """
        flashcard_id = kwargs.get("flashcard_id", None)
        chat_id = kwargs.get("chat_id", None)
        course_id = kwargs.get("course_id", None)
        all = kwargs.get("all", False)

        if not any([flashcard_id, chat_id, course_id]):
            raise ValueError("No query parameters provided")

        filters = []
        if flashcard_id:
            filters.append(Flashcard.flashcard_id == flashcard_id)
        if chat_id:
            filters.append(Flashcard.chat_id == chat_id)
        if course_id:
            filters.append(Flashcard.course_id == course_id)

        query = db.query(Flashcard).filter(and_(*filters))
        result = query.all() if all else [query.first()]

        if not result:
            return []
        
        ret = [] # list to store the deleted flashcard objects
        for flashcard in result:
            ret.append(flashcard.to_dict())
            db.delete(flashcard)
        
        db.commit()

        return ret
