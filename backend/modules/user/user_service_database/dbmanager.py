from abc import ABC, abstractmethod
from sqlalchemy import and_

from modules.user.user_service_database.connection import db_connection
from modules.user import authentication as auth

from modules.user.model import User


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
