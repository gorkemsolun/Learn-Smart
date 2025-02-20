from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session

from database import DATABASE_URL

class DatabaseConnection:
    """
    A singleton class that represents a connection to the database.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseConnection, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """
        Initializes the database connection by creating the engine, session factory, and base.
        """
        self.engine = create_engine(
            DATABASE_URL,
            pool_size=20,
            max_overflow=10,
            pool_timeout=30
        ) # create the database engine

        self.SessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=self.engine
        ) # create a session factory

        self.session_factory = scoped_session(self.SessionLocal) # create a thread-local scoped session
        self.Base = declarative_base() # create a base class for the models

    def create_tables(self):
        """
        Creates the database tables based on the defined models.
        """
        self.Base.metadata.create_all(bind=self.engine)
    
    def drop_tables(self):
        """
        Drops the database tables based on the defined models.
        """
        with self as connection:
            connection.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
            connection.execute(text("DROP TABLE IF EXISTS slides;"))
            connection.execute(text("DROP TABLE IF EXISTS chats;"))
            connection.execute(text("DROP TABLE IF EXISTS courses;"))
            connection.execute(text("DROP TABLE IF EXISTS users;"))
            connection.execute(text("DROP TABLE IF EXISTS notifications;"))
            connection.execute(text("DROP TABLE IF EXISTS analytics;"))
            connection.execute(text("DROP TABLE IF EXISTS subscriptions;"))

    def __enter__(self):
        """
        Enters a context manager and returns a session object.
        """
        self.session = self.session_factory()
        return self.session
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        Exits the context manager and commits or rolls back the transaction.
        """
        try:
            if exc_type:
                self.session.rollback() # rollback the transaction if an exception occurred
            else:
                self.session.commit() # commit the transaction if no exceptions occurred
        finally:
            self.session.close() # close the session
            self.session_factory.remove() # remove the session from the factory


# Create a global singleton instance
db_connection = DatabaseConnection()