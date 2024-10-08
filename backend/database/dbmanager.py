from abc import ABC, abstractmethod
from sqlalchemy import and_

from database.connection import db_connection
from middleware import authentication as auth

from modules.user.model import User
from modules.chat.model import Chat
from modules.course.model import Course
from modules.notification.model import Notification


class DatabaseInterface(ABC):
    """
    Interface for the database manager.
    """

    @staticmethod
    @abstractmethod
    def create(obj):
        """
        Creates a new object in the database.

        Args:
        - obj: The object to be created.

        Returns:
        - The created object.

        Raises:
        - NotImplementedError: This method should be implemented by subclasses.

        """
        pass

    @staticmethod
    @abstractmethod
    def fetch(**kwargs):
        """
        Abstract method for fetching data from the database.

        Args:
        - **kwargs: Additional keyword arguments for specifying query parameters.

        Returns:
        - None

        Raises:
        - NotImplementedError: This method should be implemented by subclasses.
        """
        pass

    @staticmethod
    @abstractmethod
    def update(obj):
        """
        Updates an object in the database.

        Args:
        - obj: The object to be updated.

        Returns:
        - The updated object.

        Raises:
        - NotImplementedError: This method should be implemented by subclasses.

        """
        pass

    @staticmethod
    @abstractmethod
    def delete(**kwargs):
        """
        Deletes records from the database based on the provided criteria.

        Args:
        - **kwargs: Keyword arguments representing the criteria for deletion.

        Returns:
        - None

        Raises:
        - NotImplementedError: This method should be implemented by subclasses.
        """
        pass


class UserDB(DatabaseInterface):
    """
    Database interface for the User model.
    """

    @staticmethod
    def create(nickname: str, email: str, password: str):
        """
        Create a new user with the provided credentials and save it in the database.

        Args:
        - nickname (str): The nickname of the user.
        - email (str): The email of the user.
        - password (str): The password of the user.

        Returns:
        - dict: A dictionary representation of the created user object.
        Raises:
        - ValueError: If a user with the same email or nickname already exists.
        """
        # Check if a user with the same email or nickname already exists
        user_by_email = UserDB.fetch(email=email)
        user_by_nickname = UserDB.fetch(nickname=nickname)

        if user_by_email or user_by_nickname:
            raise ValueError("User with provided credentials already registered")

        # Create a new user object
        user = User(
            nickname=nickname,
            email=email,
            hashed_password=auth.hash_password(password),
        )

        # save the user object in the database
        with db_connection as db:
            db.add(user)
            db.commit()
            db.refresh(user)

            return user.to_dict()

    @staticmethod
    def fetch(**kwargs):
        """
        Fetches user(s) from the database based on the provided query parameters.

        Args:
            **kwargs: Keyword arguments representing the query parameters.
                Possible query parameters include:
                - role (str): The role of the user.
                - nickname (str): The nickname of the user.
                - email (str): The email of the user.
                - user_id (int): The ID of the user.
                - all (bool): Flag indicating whether to fetch all users or just the first one. Default is False.

        Returns:
            If `all` is True, returns a list of user dictionaries. Each dictionary represents a user and contains the user's attributes.
            If `all` is False, returns a single user dictionary or None if no user is found.

        Raises:
            ValueError: If no query parameters are provided.
        """
        role = kwargs.get("role", None)
        nickname = kwargs.get("nickname", None)
        email = kwargs.get("email", None)
        user_id = kwargs.get("user_id", None)
        all = kwargs.get("all", False)

        if not any([role, nickname, email, user_id]):
            raise ValueError("No query parameters provided")

        # Create a list of filters based on the provided query parameters
        filters = []

        if role:
            filters.append(User.role == role)
        if nickname:
            filters.append(User.nickname == nickname)
        if email:
            filters.append(User.email == email)
        if user_id:
            filters.append(User.user_id == user_id)

        with db_connection as db:
            query = db.query(User).filter(and_(*filters))  # apply filters to the query
            result = (
                query.all() if all else query.first()
            )  # fetch all users or just the first one

            if all:
                return (
                    [user.to_dict() for user in result] if result else []
                )  # return a list of user dicts

            return (
                result.to_dict() if result else None
            )  # return a single user dict or None

    @staticmethod
    def update(user_id: int, **kwargs):
        """
        Update the user details in the database.

        Args:
        - user_id (int): The ID of the user to update.
        - **kwargs: Keyword arguments for the fields to update. Possible keyword arguments include:
            - name (str): The new name for the user.
            - nickname (str): The new nickname for the user.
            - email (str): The new email address for the user.
            - password (str): The new password for the user.

        Returns:
        - dict: A dictionary representing the updated user details.

        Raises:
        - ValueError: If the user with the specified ID is not found in the database.
        """
        role = kwargs.get("role", None)
        nickname = kwargs.get("nickname", None)
        email = kwargs.get("email", None)
        password = kwargs.get("password", None)
        
        if not any([role, nickname, email, password]):
            raise ValueError("No fields to update provided")

        with db_connection as db:
            user = db.query(User).filter(User.user_id == user_id).first()
            if not user:
                raise ValueError(f"User with ID {user_id} not found")
            if role:
                user.role = role
            if nickname:
                user.nickname = nickname
            if email:
                user.email = email
            if password:
                user.hashed_password = auth.hash_password(password)

            db.commit()
            db.refresh(user)

            return user.to_dict()
        

    @staticmethod
    def delete(**kwargs):
        """
        Deletes a user from the database.

        Args:
        - **kwargs: Additional keyword arguments for specifying query parameters.

        """
        pass


class ChatDB(DatabaseInterface):
    """
    Database interface for the Chat model.
    """

    @staticmethod
    def create(
        course_id: int,
        chat_title: str,
        history_url: str = None,
        slides_mode: bool = False,
        slides_fname: str = None,
        slides_furl: str = None,
    ):
        """
        Create a new chat object and save it in the database.

        Parameters:
        - course_id (int): The ID of the course associated with the chat.
        - chat_title (str): The title of the chat.
        - history_url (str, optional): The URL of the chat's history.
        - slides_mode (bool, optional): Indicates whether the chat has slides.
        - slides_fname (str, optional): The filename of the chat's slides.
        - slides_furl (str, optional): The URL of the chat's slides.

        Returns:
        - dict: A dictionary representation of the created chat object.
        """
        chat = Chat(
            course_id=course_id,
            chat_title=chat_title,
            history_url=history_url,
            slides_mode=slides_mode,
            slides_fname=slides_fname,
            slides_furl=slides_furl,
        )

        # save the chat object in the database
        with db_connection as db:
            db.add(chat)
            db.commit()
            db.refresh(chat)

            return chat.to_dict()

    @staticmethod
    def fetch(**kwargs):
        """
        Fetches chat data from the database based on the provided query parameters.

        Args:
            chat_id (int): The ID of the chat.
            course_id (int): The ID of the course.
            created_at (datetime, optional): The date and time the chat
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
        course_id = kwargs.get("course_id", None)
        created_at = kwargs.get("created_at", None)
        all = kwargs.get("all", False)

        if not any(
            [chat_id, course_id, created_at]
        ):  # check if any query parameters are provided
            raise ValueError("No query parameters provided")

        # Create a list of filters based on the provided query parameters
        filters = []
        if chat_id:
            filters.append(Chat.chat_id == chat_id)
        if course_id:
            filters.append(Chat.course_id == course_id)
        if created_at:
            filters.append(Chat.created_at == created_at)

        with db_connection as db:
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
    def update(chat_id: int, **kwargs):
        """
        Update the chat details in the database.

        Args:
            chat_id (int): The ID of the chat to update.
            **kwargs: Keyword arguments for the fields to update. Possible keyword arguments include:
                - chat_title (str): The new title for the chat.
                - history_url (str): The new history URL for the chat.
                - slides_fname (str): The new slides filename for the chat.
                - slides_furl (str): The new slides file URL for the chat.

        Returns:
            dict: A dictionary representing the updated chat details.

        Raises:
            ValueError: If the chat with the specified ID is not found in the database.
        """
        chat_title = kwargs.get("chat_title", None)
        history_url = kwargs.get("history_url", None)
        slides_mode = kwargs.get("slides_mode", None)
        slides_fname = kwargs.get("slides_fname", None)  # get the new slides filename
        slides_furl = kwargs.get("slides_furl", None)  # get the new slides file URL

        with db_connection as db:
            chat = db.query(Chat).filter(Chat.chat_id == chat_id).first()
            if not chat:
                raise ValueError(f"Chat with ID {chat_id} not found")

            if chat_title:
                chat.chat_title = chat_title
            if history_url:
                chat.history_url = history_url
            if slides_fname is not None:
                chat.slides_fname = slides_fname
            if slides_furl is not None:
                chat.slides_furl = slides_furl
            if slides_mode is not None:
                chat.slides_mode = slides_mode

            db.commit()
            db.refresh(chat)

            return chat.to_dict()

    @staticmethod
    def delete(**kwargs):
        """
        Deletes a chat from the database.

        Args:
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

        with db_connection as db:
            query = db.query(Chat).filter(and_(*filters))
            result = query.all() if all else [query.first()]

            if not result:
                return []

            ret = []
            for chat in result:
                ret.append(chat.to_dict())
                db.delete(chat)
            db.commit()

        return ret


class CourseDB(DatabaseInterface):
    """
    Database interface for the Course model.
    """

    @staticmethod
    def create(
        course_name: str, course_code: str, course_description: str, user_id: int
    ):
        """
        Create a new course in the database.

        Args:
            course_name (str): The name of the course.
            course_code (str): The code of the course.
            course_description (str): The description of the course.
            user_id (int): The ID of the user who owns the course.

        Returns:
            dict: A dictionary representing the created course.

        Raises:
            ValueError: If a course with the provided name already exists for the user.
        """
        course = CourseDB.fetch(course_code=course_code, user_id=user_id)
        if course:
            raise ValueError(f"Course {course_code} already exists for user {user_id}")

        course = Course(
            course_name=course_name,
            course_code=course_code,
            course_description=course_description,
            user_id=user_id,
        )  # create a new course object

        # save the user object in the database
        with db_connection as db:
            db.add(course)
            db.commit()
            db.refresh(course)

            return course.to_dict()

    @staticmethod
    def fetch(**kwargs):
        """
        Fetches course information from the database based on the provided query parameters.

        Args:
            course_id (int): The ID of the course.
            course_name (str): The name of the course.
            course_code (str): The code of the course.
            user_id (int): The ID of the user.
            all (bool, optional): If True, fetches all matching courses. If False (default), fetches only the first matching course.

        Returns:
            dict or list: A dictionary representing the fetched course information if `all` is False, or a list of dictionaries representing multiple courses if `all` is True. Returns None if no matching course is found.

        Raises:
            ValueError: If no query parameters are provided.
        """
        course_id = kwargs.get("course_id", None)
        course_name = kwargs.get("course_name", None)
        user_id = kwargs.get("user_id", None)
        course_code = kwargs.get("course_code", None)
        all = kwargs.get("all", False)

        if not any(
            [course_id, course_name, user_id, course_code]
        ):  # check if any query parameters are provided
            raise ValueError("No query parameters provided")

        # Create a list of filters based on the provided query parameters
        filters = []
        if course_id:
            filters.append(Course.course_id == course_id)
        if course_name:
            filters.append(Course.course_name == course_name)
        if user_id:
            filters.append(Course.user_id == user_id)
        if course_code:
            filters.append(Course.course_code == course_code)

        with db_connection as db:
            query = db.query(Course).filter(
                and_(*filters)
            )  # apply filters to the query
            result = (
                query.all() if all else query.first()
            )  # fetch all courses or just the first one

            if all:
                return (
                    [course.to_dict() for course in result] if result else []
                )  # return a list of course dicts

            return (
                result.to_dict() if result else None
            )  # return a single course dict or None

    @staticmethod
    def update(course_id: int, **kwargs):
        """
        Update the course details in the database.

        Args:
            course_id (int): The ID of the course to update.
            **kwargs: Keyword arguments for the fields to update. Possible keyword arguments include:
                - course_name (str): The new name for the course.
                - course_code (str): The new code for the course.
                - course_description (str): The new course_description for the course.
                - course_syllabus_url (str): The new syllabus URL for the course.
                - course_icon_url (str): The new image URL for the course.

        Returns:
            dict: A dictionary representing the updated course details.

        Raises:
            ValueError: If the course with the specified ID is not found in the database.
        """
        course_name: str = kwargs.get("course_name", None)
        course_code: str = kwargs.get("course_code", None)
        course_description: str = kwargs.get("course_description", None)
        course_syllabus_url: str = kwargs.get("course_syllabus_url", None)
        course_icon_url: str = kwargs.get("course_icon_url", None)
        course_study_plan_url: str = kwargs.get("course_study_plan_url", None)

        with db_connection as db:
            course: Course = (
                db.query(Course).filter(Course.course_id == course_id).first()
            )
            if not course:
                raise ValueError(f"Course with ID {course_id} not found")

            if course_name:
                course.course_name = course_name
            if course_code:  # must be unique per user
                query_result = (
                    db.query(Course)
                    .filter(
                        Course.course_code == course_code,
                        Course.user_id == course.user_id,
                        Course.course_id != course.course_id,
                    )
                    .first()
                )
                if query_result:
                    raise ValueError(f"Course with code {course_code} already exists")
                course.course_code = course_code
            if course_description is not None:
                course.course_description = course_description
            if course_syllabus_url is not None:
                course.course_syllabus_url = course_syllabus_url
            if course_icon_url is not None:
                course.course_icon_url = course_icon_url
            if course_study_plan_url is not None:
                course.course_study_plan_url = course_study_plan_url

            db.commit()
            db.refresh(course)

            return course.to_dict()

    @staticmethod
    def delete(**kwargs):
        """
        Deletes a course from the database.

        Args:
        - **kwargs: Additional keyword arguments for specifying query parameters.
            - course_id (int): The ID of the course to be deleted.
            - course_name (str): The name of the course to be deleted.
            - user_id (int): The ID of the user who owns the course to be deleted.
            - course_code (str): The code of the course to be deleted.
            - all (bool): Flag indicating whether to delete all matching courses or just the first one. Default is False.

        Returns:
        - list: A list of dictionaries representing the deleted courses.
        """
        course_id = kwargs.get("course_id", None)
        course_name = kwargs.get("course_name", None)
        user_id = kwargs.get("user_id", None)
        course_code = kwargs.get("course_code", None)
        all = kwargs.get("all", False)

        if not any(
            [course_id, course_name, user_id, course_code]
        ):  # check if any query parameters are provided
            raise ValueError("No query parameters provided")

        # Create a list of filters based on the provided query parameters
        filters = []
        if course_id:
            filters.append(Course.course_id == course_id)
        if course_name:
            filters.append(Course.course_name == course_name)
        if user_id:
            filters.append(Course.user_id == user_id)
        if course_code:
            filters.append(Course.course_code == course_code)

        with db_connection as db:
            query = db.query(Course).filter(and_(*filters))
            result = query.all() if all else [query.first()]
            if not result:
                return []

            ret = []
            for course in result:
                ret.append(course.to_dict())
                db.delete(course)
            db.commit()

        return ret


class NotificationDB(DatabaseInterface):
    """
    Database interface for the Notification model.
    """

    @staticmethod
    def create(
        notification_title: str,
        notification_content: str,
        notification_is_new: bool,
        notification_sender_id: int,
        notification_receiver_id: int,
    ):
        """
        Create a new notification in the database.

        Args:
            - notification_title (str): The title of the notification.
            - notification_content (str): The content of the notification.
            - notification_sender_id (int): The ID of the sender of the notification.
            - notification_receiver_id (int): The ID of the receiver of the notification.

        Returns:
            - dict: A dictionary representation of the created notification object.
        """

        notification = Notification(
            notification_title=notification_title,
            notification_content=notification_content,
            notification_is_new=notification_is_new,
            notification_sender_id=notification_sender_id,
            notification_receiver_id=notification_receiver_id,
        )

        with db_connection as db:
            db.add(notification)
            db.commit()
            db.refresh(notification)

            return notification.to_dict()

    @staticmethod
    def fetch(**kwargs):
        """
        Fetches notification data from the database based on the provided query parameters.

        Args:
            - notification_id (int): The ID of the notification.
            - notification_title (str): The title of the notification.
            - notification_content (str): The content of the notification.
            - notification_is_new (bool): The status of the notification.
            - notification_sender_id (int): The ID of the sender of the notification.
            - notification_receiver_id (int): The ID of the receiver of the notification.
            - all (bool): Flag indicating whether to fetch all matching notifications or just the first one. Default is False.

        Returns:
            - dict or list: A dictionary representing the fetched notification record if `all` is False and a matching record is found.
                            A list of dictionaries representing all fetched notification records if `all` is True and matching records are found.
                            None if no matching record is found and `all` is False.
                            An empty list if no matching records are found and `all` is True.

        Raises:
            - ValueError: If no query parameters are provided.
        """
        notification_id = kwargs.get("notification_id", None)
        notification_title = kwargs.get("notification_title", None)
        notification_content = kwargs.get("notification_content", None)
        notification_is_new = kwargs.get("notification_is_new", None)
        notification_sender_id = kwargs.get("notification_sender_id", None)
        notification_receiver_id = kwargs.get("notification_receiver_id", None)
        all = kwargs.get("all", False)

        if (
            not any(
                [
                    notification_id,
                    notification_title,
                    notification_content,
                    notification_is_new,
                    notification_sender_id,
                    notification_receiver_id,
                ]
            )
            and notification_id != 0
        ):
            raise ValueError("No query parameters provided")

        filters = []
        if notification_id:
            filters.append(Notification.notification_id == notification_id)
        if notification_title:
            filters.append(Notification.notification_title == notification_title)
        if notification_content:
            filters.append(Notification.notification_content == notification_content)
        if notification_is_new is not None:
            filters.append(Notification.notification_is_new == notification_is_new)
        if notification_sender_id:
            filters.append(
                Notification.notification_sender_id == notification_sender_id
            )
        if notification_receiver_id:
            filters.append(
                Notification.notification_receiver_id == notification_receiver_id
            )

        with db_connection as db:
            query = db.query(Notification).filter(and_(*filters))
            result = query.all() if all else query.first()

            if all:
                return (
                    [notification.to_dict() for notification in result]
                    if result
                    else []
                )

            return result.to_dict() if result else None

    @staticmethod
    def update(notification_id: int, **kwargs):
        """
        Update the notification details in the database.

        Args:
            - notification_id (int): The ID of the notification to update.
            - **kwargs: Keyword arguments for the fields to update. Possible keyword arguments include:
                - notification_title (str): The new title for the notification.
                - notification_content (str): The new content for the notification.
                - notification_is_new (bool): The new status of the notification.
                - notification_sender_id (int): The new sender ID for the notification.
                - notification_receiver_id (int): The new receiver ID for the notification.

        Returns:
            - dict: A dictionary representing the updated notification details.

        Raises:
            - ValueError: If the notification with the specified ID is not found in the database.
        """
        notification_title = kwargs.get("notification_title", None)
        notification_content = kwargs.get("notification_content", None)
        notification_is_new = kwargs.get("notification_is_new", None)
        notification_sender_id = kwargs.get("notification_sender_id", None)
        notification_receiver_id = kwargs.get("notification_receiver_id", None)

        with db_connection as db:
            notification = (
                db.query(Notification)
                .filter(Notification.notification_id == notification_id)
                .first()
            )
            if not notification:
                raise ValueError(f"Notification with ID {notification_id} not found")

            if notification_title:
                notification.notification_title = notification_title
            if notification_content:
                notification.notification_content = notification_content
            if notification_is_new is not None:
                notification.notification_is_new = notification_is_new
            if notification_sender_id:
                notification.notification_sender_id = notification_sender_id
            if notification_receiver_id:
                notification.notification_receiver_id = notification_receiver_id

            db.commit()
            db.refresh(notification)

            return notification.to_dict()

    @staticmethod
    def delete(**kwargs):
        """
        Deletes a notification from the database.

        Args:
        - **kwargs: Additional keyword arguments for specifying query parameters.
            - notification_id (str): The ID of the notification to be deleted.
            - notification_title (str): The title of the notification to be deleted.
            - notification_content (str): The content of the notification to be deleted.
            - notification_is_new (bool): The status of the notification to be deleted.
            - notification_sender_id (int): The ID of the sender of the notification to be deleted.
            - notification_receiver_id (int): The ID of the receiver of the notification to be deleted.
            - all (bool): Flag indicating whether to delete all matching notifications or just the first one. Default is False.

        Returns:
        - list: A list of dictionaries representing the deleted notifications.
        """
        notification_id = kwargs.get("notification_id", None)
        notification_title = kwargs.get("notification_title", None)
        notification_content = kwargs.get("notification_content", None)
        notification_is_new = kwargs.get("notification_is_new", None)
        notification_sender_id = kwargs.get("notification_sender_id", None)
        notification_receiver_id = kwargs.get("notification_receiver_id", None)
        all = kwargs.get("all", False)

        if (
            not any(
                [
                    notification_id,
                    notification_title,
                    notification_content,
                    notification_is_new,
                    notification_sender_id,
                    notification_receiver_id,
                ]
            )
            and notification_id != 0
        ):
            raise ValueError("No query parameters provided")

        # Create a list of filters based on the provided query parameters
        filters = []
        if notification_id:
            filters.append(Notification.notification_id == notification_id)
        if notification_title:
            filters.append(Notification.notification_title == notification_title)
        if notification_content:
            filters.append(Notification.notification_content == notification_content)
        if notification_is_new is not None:
            filters.append(Notification.notification_is_new == notification_is_new)
        if notification_sender_id:
            filters.append(
                Notification.notification_sender_id == notification_sender_id
            )
        if notification_receiver_id:
            filters.append(
                Notification.notification_receiver_id == notification_receiver_id
            )

        with db_connection as db:
            query = db.query(Notification).filter(and_(*filters))
            result = query.all() if all else [query.first()]
            if not result:
                return []

            ret = []
            for notification in result:
                ret.append(notification.to_dict())
                db.delete(notification)
            db.commit()

        return ret
