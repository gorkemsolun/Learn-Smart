import os
import io
from PIL import Image
from sqlalchemy import text
from fastapi import UploadFile

from course_service.app.database.session import get_db, Base
from course_service.app.database.model import Course # required for table creation

def init(restart: bool = False):
    gen = get_db()
    db = next(gen)

    try:
        if restart:
            # drop "users" table
            print("Dropping tables...")
            db.execute(text("DROP TABLE IF EXISTS users;"))
            
        # create "users" table
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


def validate_file_extension(filename, valid_extensions: list[str]):
    """
    Validates the extension of a file by checking it against a list of valid extensions.

    Args:
        - filename (str): The name of the file.
        - valid_extensions (list): A list of valid extensions.

    Returns:
        - bool: Whether the extension is valid.
    """
    ext = splitext(filename)[1].lower()
    return (ext in [extension.lower() for extension in valid_extensions]) # whether the extension is in the list


async def resize_image(file: UploadFile, size=(256, 256)) -> UploadFile:
    """
    Resizes an image to the specified size.

    Args:
        - file (UploadFile): The image file to resize.
        - size (tuple): The new size of the image.

    Returns:
        - UploadFile: The resized image file.
    """
    # Read the file into memory
    contents = await file.read()
    
    # Open image with PIL
    image = Image.open(io.BytesIO(contents))
    
    # Convert to RGB (to ensure compatibility with JPEG and other formats)
    image = image.convert("RGB")
    
    # Resize the image
    image = image.resize(size, Image.ANTIALIAS)
    
    # Save to a BytesIO buffer
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")  # Change format if needed
    buffer.seek(0)
    
    # Create a new UploadFile object
    return UploadFile(filename=file.filename, file=buffer, content_type=file.content_type)
