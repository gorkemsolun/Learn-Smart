from sqlalchemy.orm.session import Session
from sqlalchemy import and_

from filemanager_service.app.database.model import File

class FileDB:
    """
    Database interface for the File model.
    """

    @staticmethod
    def create(db: Session, user_id: int, file_name: str, mime_type: str):
        """
        Creates a new file in the database.

        Args:
            db (Session): The database session.
            user_id (int): The user ID of the file owner.
            file_name (str): The name of the file.
            mime_type (str): The MIME type of the file.

        Returns:
            dict: A dictionary containing the file information.
        """
        file = File(user_id=user_id, file_name=file_name, mime_type=mime_type)
        db.add(file)
        db.commit()
        db.refresh(file)
        return file.to_dict()


    @staticmethod
    def fetch(db: Session, **kwargs):
        """
        Fetches file(s) from the database based on the provided query parameters.

        Args:
            db (Session): The database session.
            **kwargs: Keyword arguments representing the query parameters.
                Possible query parameters include:
                - user_id (int): The ID of the user who owns the file.
                - file_id (int): The ID of the file.
                - all (bool): Flag indicating whether to fetch all files or just the first one. Default is False.

        Returns:
            If `all` is True, returns a list of file dictionaries. Each dictionary represents a file and contains the file's attributes.
            If `all` is False, returns a single file dictionary or None if no file is found.

        Raises:
            ValueError: If no query parameters are provided.
        """
        user_id = kwargs.get("user_id", None)
        file_id = kwargs.get("file_id", None)
        all = kwargs.get("all", False)

        if not any([user_id, file_id]):
            raise ValueError("No query parameters provided")

        # Create a list of filters based on the provided query parameters
        filters = []

        if user_id:
            filters.append(File.user_id == user_id)
        if file_id:
            filters.append(File.file_id == file_id)

        query = db.query(File).filter(and_(*filters))  # apply filters to the query
        result = (
            query.all() if all else query.first()
        )  # fetch all files or just the first one

        if all:
            return (
                [file.to_dict() for file in result] if result else []
            )
        
        return result.to_dict() if result else None


    @staticmethod
    def update(db: Session, file_id: int, **kwargs):
        """
        Updates a file in the database based on the provided query parameters.

        Args:
            db (Session): The database session.
            file_id (int): The ID of the file to update.
            **kwargs: Keyword arguments representing the query parameters.
                Possible query parameters include:
                - file_name (str): The new name of the file.

        Returns:
            dict: A dictionary containing the updated file information.

        Raises:
            ValueError: If no query parameters are provided.
        """
        file = db.query(File).filter(File.file_id == file_id).first()

        if not file:
            raise ValueError("File not found")

        file_name = kwargs.get("file_name", None)

        if not file_name:
            raise ValueError("No update parameters provided")
        else:
            file.file_name = file_name

        db.commit()
        db.refresh(file)

        return file.to_dict()
        

    @staticmethod
    def delete(db: Session, **kwargs):       
        """
        Deletes a file from the database based on the provided query parameters.
        
        Args:
            db (Session): The database session.
            **kwargs: Keyword arguments representing the query parameters.
                Possible query parameters include:
                - user_id (int): The ID of the user who owns the file(s).
                - file_id (int): The ID of the file to delete.
                - all (bool): Flag indicating whether to delete all files that match the query parameters. Default is False.

        Returns:
            dict: A dictionary containing the details of the deleted file.

        Raises:
            ValueError: If no query parameters are provided.
        """
        user_id = kwargs.get("user_id", None)
        file_id = kwargs.get("file_id", None)
        all = kwargs.get("all", False)

        if not any([user_id, file_id]):
            raise ValueError("No query parameters provided")

        # Create a list of filters based on the provided query parameters
        filters = []

        if user_id:
            filters.append(File.user_id == user_id)

        if file_id:
            filters.append(File.file_id == file_id)

        query = db.query(File).filter(and_(*filters))
        result = query.all() if all else [query.first()]

        if not result:
            return []
        
        ret = [] # list to store the deleted chat objects
        for file in result:
            ret.append(file.to_dict())
            db.delete(file)
        db.commit()

        return ret
