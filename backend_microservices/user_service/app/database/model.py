from sqlalchemy import Column, DateTime, Integer, String, func

from user_service.app.database.session import Base

class User(Base):
    """
    Represents a user in the system.

    Attributes:
        user_id (int): The unique identifier for the user.
        nickname (str): The nickname of the user.
        role (str): The role of the user.
        email (str): The email address of the user.
        hashed_password (str): The hashed password of the user.
        created_at (datetime): The timestamp when the user was created.
        courses (list): The list of courses associated with the user.
    """

    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(50), unique=True, index=True, nullable=False)
    role = Column(String(20), nullable=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_icon_fid = Column(Integer, nullable=True, unique=True) # file id

    def to_dict(self):
        """
        Converts the user object to a dictionary.

        Returns:
            dict: A dictionary representation of the user object.
        """
        
        return {
            "user_id": self.user_id,
            "role": self.role,
            "nickname": self.nickname,
            "email": self.email,
            "created_at": self.created_at,
            "hashed_password": self.hashed_password,
            "user_icon_fid": self.user_icon_fid
        }

    # attributes might be added
    # possible feature: email verification and we'd need some more attributes here
