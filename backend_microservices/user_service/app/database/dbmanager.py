from sqlalchemy.orm.session import Session
from sqlalchemy import and_

from user_service.app.database.model import User, Analytics
from user_service.app.clients import auth as auth

class UserDB:
    """
    Database interface for the User model.
    """

    @staticmethod
    async def create(db: Session, nickname: str, email: str, password: str, user_icon_fid: int = None):
        """
        Create a new user with the provided credentials and save it in the database.

        Args:
        - db (Session): The database session.
        - nickname (str): The nickname of the user.
        - email (str): The email of the user.
        - password (str): The password of the user. 
        - user_icon_fid (int): The file ID of the user's icon.

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

        hashed_password = await auth.hash_password(password) # communicate with the auth service

        # Create a new user object
        user = User(
            nickname=nickname,
            email=email,
            hashed_password=hashed_password,
            user_icon_fid=user_icon_fid
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
        nickname = kwargs.get("nickname", None)
        email = kwargs.get("email", None)
        user_id = kwargs.get("user_id", None)
        all = kwargs.get("all", False)

        if not any([nickname, email, user_id]):
            raise ValueError("No query parameters provided")

        # Create a list of filters based on the provided query parameters
        filters = []

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
            - nickname (str): The new nickname for the user.
            - email (str): The new email address for the user.
            - password (str): The new password for the user.
            - user_icon_fid (int): The new file ID for the user's icon

        Returns:
        - dict: A dictionary representing the updated user details.

        Raises:
        - ValueError: If the user with the specified ID is not found in the database.
        """
        nickname = kwargs.get("nickname", None)
        email = kwargs.get("email", None)
        password = kwargs.get("password", None)
        fid = kwargs.get("user_icon_fid", None)
        
        if not any([nickname, email, password]):
            raise ValueError("No fields to update provided")

        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise ValueError(f"User with ID {user_id} not found")

        if nickname:
            user.nickname = nickname
        if email:
            user.email = email
        if password:
            user.hashed_password = await auth.hash_password(password) # communicate with the auth service
        if fid:
            user.user_icon_fid = fid

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

class AnalyticsDB:
    """
    Database interface for analytics tracking.
    Tracks and stores daily usage time for each user in the application.
    """

    @staticmethod
    def log_usage(db: Session, **kwargs):
        """
        Logs the usage time for a specific user on a specific date.

        Args:
        - user_id (int): The ID of the user.
        - date (str): The date of the usage in 'YYYY-MM-DD' format.
        - time_spent (int): Time spent in seconds to be added to the log.

        Returns:
        - dict: A dictionary representing the updated analytics log.
        """
        user_id = kwargs.get("user_id")
        date = kwargs.get("date")
        timestamp = kwargs.get("timestamp")
        time_spent = kwargs.get("time_spent")

        analytics_entry = Analytics(user_id=user_id, date=date, time_spent=time_spent, timestamp = timestamp)
        db.add(analytics_entry)

        db.commit()
        db.refresh(analytics_entry)

        return analytics_entry.to_dict()


    @staticmethod
    def get_usage(db: Session, **kwargs):
        """
        Gets usage analytics for a user. Optionally, fetch for a specific date.

        Args:
        - user_id (int): The ID of the user.
        - date (str, optional): The date in 'YYYY-MM-DD' format. If None, fetches all logs for the user.

        Returns:
        - list[dict]: A list of dictionaries representing analytics logs, or a single dictionary if date is specified.
        """
        user_id = kwargs.get("user_id")
        date = kwargs.get("date")

        if date:
            analytics_entry = (
                db.query(Analytics)
                .filter(Analytics.user_id == user_id, Analytics.date == date)
                .first()
            )
            return analytics_entry.to_dict() if analytics_entry else None

        analytics_entries = db.query(Analytics).filter(Analytics.user_id == user_id).all()
        return [entry.to_dict() for entry in analytics_entries]


    @staticmethod
    def update_usage(db: Session, **kwargs):
        """
        Updates the usage time for a specific user on a specific date.

        Args:
        - user_id (int): The ID of the user.
        - date (str): The date of the usage in 'YYYY-MM-DD' format.
        - time_spent (int): New time spent value in seconds.

        Returns:
        - dict: A dictionary representing the updated analytics log.
        """
        user_id = kwargs.get("user_id")
        date = kwargs.get("date")
        time_spent = kwargs.get("time_spent")
        timestamp = kwargs.get("timestamp")

        analytics_entry = (
            db.query(Analytics)
            .filter(Analytics.user_id == user_id, Analytics.date == date)
            .first()
        )

        if not analytics_entry:
            raise ValueError("Analytics entry not found for the specified user and date")

        analytics_entry.time_spent = time_spent
        analytics_entry.timestamp = timestamp

        db.commit()
        db.refresh(analytics_entry)

        return analytics_entry.to_dict()


    @staticmethod
    def delete_usage(db: Session, **kwargs):
        """
        Deletes usage analytics for a user. Optionally, delete for a specific date.

        Args:
        - user_id (int): The ID of the user.
        - date (str, optional): The date in 'YYYY-MM-DD' format. If None, deletes all logs for the user.

        Returns:
        - None
        """
        user_id = kwargs.get("user_id")
        date = kwargs.get("date")

        query = db.query(Analytics).filter(Analytics.user_id == user_id)

        if date:
            query = query.filter(Analytics.date == date)

        query.delete()
        db.commit()
