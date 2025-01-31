from sqlalchemy.orm.session import Session
from sqlalchemy import and_

from model import User
from user_service.app.clients import auth as auth_client
class UserDB:
    """
    Database interface for the User model.
    """

    @staticmethod
    async def create(db: Session, nickname: str, email: str, password: str):
        """
        Create a new user with the provided credentials and save it in the database.

        Args:
        - db (Session): The database session.
        - nickname (str): The nickname of the user.
        - email (str): The email of the user.
        - password (str): The password of the user. 

        Returns:
        - dict: A dictionary representation of the created user object.
        Raises:
        - ValueError: If a user with the same email or nickname already exists.
        """
        # Check if a user with the same email or nickname already exists
        user_by_email = UserDB.fetch(db, email=email)
        user_by_nickname = UserDB.fetch(db, nickname=nickname)

        if user_by_email or user_by_nickname:
            raise ValueError("User with provided credentials already registered")

        hashed_password = await auth_client.hash_password(password) # communicate with the auth service

        # Create a new user object
        user = User(
            nickname=nickname,
            email=email,
            hashed_password=hashed_password
        )

        # save the user object in the database
        db.add(user)
        db.commit()
        db.refresh(user)

        return user.to_dict()

    @staticmethod
    def fetch(db: Session, **kwargs):
        """
        Fetches user(s) from the database based on the provided query parameters.

        Args:
            - db (Session): The database session.
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
    async def update(db: Session, user_id: int, **kwargs):
        """
        Update the user details in the database.

        Args:
        - db (Session): The database session.
        - user_id (int): The ID of the user to update.
        - **kwargs: Keyword arguments for the fields to update. Possible keyword arguments include:
            - role (str): The new role for the user.
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
            user.hashed_password = await auth_client.hash_password(password) # communicate with the auth service

        db.commit()
        db.refresh(user)

        return user.to_dict()
        

    @staticmethod
    def delete(db: Session, **kwargs):
        """
        Deletes a user from the database.

        Args:
        - db (Session): The database session.
        - **kwargs: Additional keyword arguments for specifying query parameters.
        """
        
        pass