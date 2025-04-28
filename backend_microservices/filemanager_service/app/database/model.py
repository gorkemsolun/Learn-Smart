from sqlalchemy import Column, DateTime, Integer, String, func

from filemanager_service.app.database.session import Base

class File(Base):
    """
    Represents a file in the system.
    """

    __tablename__ = "files"

    file_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    file_name = Column(String(100), nullable=False)
    mime_type = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        """
        Converts the file object to a dictionary.
        """
        return {
            "file_id": self.file_id,
            "user_id": self.user_id,
            "file_name": self.file_name,
            "mime_type": self.mime_type,
            "created_at": self.created_at
        }
