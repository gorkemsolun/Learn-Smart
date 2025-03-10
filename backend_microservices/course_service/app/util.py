import os, io, tempfile
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
            db.execute(text("DROP TABLE IF EXISTS courses;"))
            
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


# TODO: Might be a bad idea, instead check mimetypes
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


async def resize_image(upload_file: UploadFile, size: tuple = (512, 256)) -> UploadFile:
    """
    Resizes an image from an UploadFile and returns a new UploadFile with the resized image.

    :param upload_file: The uploaded image file.
    :param size: The target size (width, height) for resizing. Default is (256, 256).
    :return: Resized UploadFile.
    """
    # Read file contents
    contents = await upload_file.read()
    
    # Open the image using PIL
    image = Image.open(io.BytesIO(contents))

    # Convert to RGB to ensure compatibility with different formats
    image = image.convert("RGB")
    
    # Resize the image
    image = image.resize(size, Image.Resampling.LANCZOS)

    # Save to a temporary buffer
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")  # Change format if needed
    buffer.seek(0)

    # Create a temporary file
    temp = tempfile.SpooledTemporaryFile()
    temp.write(buffer.getvalue())
    temp.seek(0)

    # Create a new UploadFile instance
    resized_upload_file = UploadFile(
        filename=upload_file.filename, 
        file=temp
    )

    return resized_upload_file