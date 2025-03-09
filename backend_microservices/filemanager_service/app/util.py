import os

from sqlalchemy import text

from filemanager_service.app.database.session import get_db, Base
from filemanager_service.app.database.model import File # required for table creation
from filemanager_service.app import STORAGE_DIR

def init(restart: bool = False):
    os.makedirs(os.path.dirname(STORAGE_DIR), exist_ok=True)
    gen = get_db()
    db = next(gen)

    try:
        if restart:
            print("Dropping tables...")
            db.execute(text("DROP TABLE IF EXISTS files;"))
            
        print("Creating tables...")
        Base.metadata.create_all(bind=db.bind)
        
    finally:
        gen.close() # closes the session

def splitext(filename: str) -> tuple[str, str]:
    """
    Splits the filename and extension of a file.
    input: "file.pdf" | output: ("file", "pdf")
    """
    base_name = os.path.splitext(filename)[0]
    extension = os.path.splitext(filename)[-1][1:]
    return base_name, extension
