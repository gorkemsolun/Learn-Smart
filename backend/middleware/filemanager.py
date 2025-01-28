"""
TODO:
After migration to AWS S3, modify the save and delete methods in the FileManager 
classes to interact with the S3 bucket instead of the local file system.
"""

from io import BytesIO
import os
import pymupdf
from docx import Document
from fastapi import File, UploadFile
from abc import ABC, abstractmethod
from PIL import Image
from tools import splitext, convert_pptx_to_pdf
from middleware import BUCKET_NAME
import boto3
from botocore.exceptions import ClientError


s3_client = boto3.client("s3")

def check_object_exists(bucket_name, object_key):
    try:
        s3_client.head_object(Bucket=bucket_name, Key=object_key)
        return True  # Object exists
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            return False  # Object does not exist

def upload_to_s3(path: str, file: UploadFile = File(...), bucket_name=BUCKET_NAME):
    """
    Uploads an UploadFile to an S3 bucket.

    Args:
        path (str): S3 Object key 
        file (UploadFile): The uploaded file object.
        bucket_name (str): The S3 bucket name.

    Returns:
        dict: A success message with the file's key in S3.
    """
    try:
        s3_key = path

        # Upload the file to S3
        s3_client.upload_fileobj(file.file, bucket_name, s3_key)

    except:
        raise

def delete_object(path, bucket_name=BUCKET_NAME):
    try:
        response = s3_client.delete_object(Bucket=bucket_name, Key=path)
    except Exception as e:
        raise

class S3StreamWrapper:
    def __init__(self, key, s3_client=s3_client, bucket_name=BUCKET_NAME):
        """
        Wrap an S3 object for random-access reading.
        
        Args:
            bucket_name (str): Name of the S3 bucket.
            key (str): Object key in the bucket.
            s3_client: Boto3 S3 client instance.
        """
        self.bucket_name = bucket_name
        self.key = key
        self.s3_client = s3_client
        self.position = 0  # Current pointer position
        
        # Get the total size of the object
        response = s3_client.head_object(Bucket=bucket_name, Key=key)
        self.file_size = response['ContentLength']

    def read(self, size=-1):
        """
        Read data from the S3 object.
        
        Args:
            size (int): Number of bytes to read. Default is -1 (read all).
        
        Returns:
            bytes: The data read.
        """
        if size == -1:  # Read all remaining data
            size = self.file_size - self.position
        
        # Ensure we don't read beyond the file
        end_byte = min(self.position + size - 1, self.file_size - 1)
        
        # Fetch the specified byte range from S3
        response = self.s3_client.get_object(
            Bucket=self.bucket_name,
            Key=self.key,
            Range=f"bytes={self.position}-{end_byte}"
        )
        
        data = response['Body'].read()
        self.position += len(data)  # Update the position
        return data

    def seek(self, offset, whence=0):
        """
        Move the pointer to a specific position.
        
        Args:
            offset (int): Offset to move the pointer to.
            whence (int): Reference point (0=beginning, 1=current, 2=end).
        """
        if whence == 0:  # From start of the file
            self.position = offset
        elif whence == 1:  # From current position
            self.position += offset
        elif whence == 2:  # From end of the file
            self.position = self.file_size + offset
        else:
            raise ValueError("Invalid value for whence.")
        
        # Ensure position stays within bounds
        self.position = max(0, min(self.position, self.file_size))

    def tell(self):
        """
        Get the current pointer position.
        
        Returns:
            int: Current position in the file.
        """
        return self.position

    def close(self):
        """
        Close the wrapper (noop for this case).
        """
        pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.close()
        
class BaseFile(ABC):
    """
    Base class for file management.

    Attributes:
        file (UploadFile): The file to be managed.
        path (str): The path where the file is saved.

    Methods:
        save(path: str): Save the file to the specified path.
        delete(): Delete the file.
        content(): Abstract method to get the content of the file.
        get(): Abstract method to get the file.
    """

    class ResourceWrapper:
        """
        A context manager that wraps a resource and provides additional functionality.

        This class allows you to use a resource as a context manager, ensuring that the resource
        is properly closed when exiting the context. It also provides a way to access attributes
        of the resource directly.

        Usage:
        ```
        file = FileFactory()(path="file.pdf")
        with file.get() as pdf:
            # do something

        DON'T use file.resource directly as the resource may not be closed properly.
        ```

        Attributes:
            resource: The resource object to be wrapped.
        """

        def __init__(self, resource):
            self.resource = resource

        def __enter__(self):
            return self.resource

        def __exit__(self, exc_type, exc_val, exc_tb):
            if hasattr(self.resource, 'close'):
                self.resource.close()

        def __getattr__(self, attr):
            return getattr(self.resource, attr)

    def __init__(self, file: UploadFile = None, path: str = None):
        self.file = file
        self.path = path

    def save(self, path: str, bucket_name=BUCKET_NAME):
        """
        Save the file to the specified path.

        Args:
            path (str): The path where the file should be saved.

        Raises:
            OSError: If the file already exists in the specified path.
            ValueError: If no file is provided to be saved.
        """
        if self.path:
            return
        
        if check_object_exists(bucket_name=BUCKET_NAME, object_key=path):
            raise FileExistsError(f"The file '{path}' already exists in bucket '{bucket_name}'.")
       
        if not self.file:
            raise ValueError("No file provided to be saved.")
        
        try:
            upload_to_s3(path, self.file)
        except:
            raise
        
        self.path = path

    def delete(self):
        """
        Delete the file.

        If the file does not exist or no path is set, this method does nothing.
        """
        if not self.path:
            return
        if not check_object_exists(bucket_name=BUCKET_NAME, object_key=self.path):
            return

        delete_object(path=self.path)

        self.path = None

    @abstractmethod
    def content(self):
        """
        Abstract method to get the content of the file.

        This method should be implemented in the derived classes.
        """
        pass

    @abstractmethod
    def get(self):
        """
        Abstract method to get the file.

        This method should be implemented in the derived classes.
        """
        pass


class GenericFile(BaseFile):
    """
    Represents a generic file.

    Args:
        file (UploadFile, optional): The uploaded file. Defaults to None.
        path (str, optional): The path to the file. Defaults to None.

    Attributes:
        file (UploadFile): The uploaded file.
        path (str): The path to the file.

    Methods:
        content(): Returns the content of the file.
        get(): Returns the file as a ResourceWrapper object.
    """
    def __init__(self, file: UploadFile = None, path: str = None):
        super().__init__(file, path)

    def content(self):
        raise RuntimeError("Cannot call content() on generic files.")

    def get(self):
        raise RuntimeError("Cannot call get() on generic files.")


class ImageFile(BaseFile):
    """
    Represents an image file.

    Args:
        file (UploadFile, optional): The uploaded file object. Defaults to None.
        path (str, optional): The path to the file. Defaults to None.

    Raises:
        ValueError: If the content type or extension of the file is not supported.

    Attributes:
        file (UploadFile): The uploaded file object.
        path (str): The path to the file.

    Methods:
        save: Saves the image file with optional resizing.
        content: Returns the content of the image file.
        get: Returns the image file as a ResourceWrapper object.
    """

    def __init__(self, file: UploadFile = None, path: str = None):
        ext = splitext(file.filename if file else path if path else "")[1] # extension of the file
        if ext.lower() not in ["png", "jpeg", "jpg"]:
            raise ValueError("Unsupported extension: " + ext)
        if file and file.content_type not in ["image/png", "image/jpeg", "image/jpg"]:
            raise ValueError("Unsupported content type: " + file.content_type)
        super().__init__(file, path)

    def save(self, path: str, bucket_name=BUCKET_NAME, size: tuple = (256, 256)):
        """
        Saves the image file to S3 with resizing.

        Args:
            path (str): The S3 key (path) to save the image file.
            bucket_name (str): The name of the S3 bucket.
            size (tuple, optional): The desired size of the image. Defaults to (256, 256).
        """
        if not self.file:
            raise ValueError("No file provided to save.")

        if check_object_exists(bucket_name, path):
            raise FileExistsError(f"The file '{path}' already exists in bucket '{bucket_name}'.")


        try:
            with Image.open(self.file.file) as img:
                img.thumbnail(size)  
                
                buffer = BytesIO()  # Buffer to store the resized image
                
                img.save(buffer, format=img.format)  
                buffer.seek(0)  # Reset buffer pointer
                
                self.file = buffer
                super().save(path=path)
            

        except Exception as e:
            raise RuntimeError(f"Failed to process or save the image: {e}")

    def content(self):
        """
        Returns the content of the image file.

        Returns:
            Image: The image object representing the content of the file.

        Raises:
            ValueError: If no file is provided.
        """
        if not self.path and not self.file:
            raise ValueError("No file provided.")
        if self.path:            
            return Image.open(self.path)
        
        return Image.open(self.file.file)
    
    def get(self):
        """
        Returns the image file as a ResourceWrapper object.

        Returns:
            ResourceWrapper: The image file wrapped in a ResourceWrapper object.
        """
        img = Image.open(self.path)
        return self.ResourceWrapper(img)
    

class PresentationFile(BaseFile):
    """
    Represents a presentation file.

    Args:
        file (UploadFile, optional): The uploaded file. Defaults to None.
        path (str, optional): The path to the file. Defaults to None.

    Raises:
        ValueError: If the content type or extension of the file is not supported.

    Attributes:
        file (UploadFile): The uploaded file.
        path (str): The path to the file.

    Methods:
        content(): Extracts the text content from the presentation file.
        get(): Retrieves the presentation resource.

    """

    def __init__(self, file: UploadFile = None, path: str = None):
        ext = splitext(file.filename if file else path if path else "")[1]
        if ext.lower() != "pptx":
            raise ValueError("Unsupported extension: " + ext)
        if file and file.content_type != "application/vnd.openxmlformats-officedocument.presentationml.presentation":
            raise ValueError("Unsupported content type: " + file.content_type)
        super().__init__(file, path)
        self.converted_to_pdf = False

    def content(self):
        """
        Extracts the text content from the presentation file.

        Returns:
            str: The extracted text content.

        Raises:
            ValueError: If no file is provided.

        """

        if not self.path and not self.file:
            raise ValueError("No file provided.")

        assert self.converted_to_pdf, "The presentation file must be converted to PDF with .save() first."
        with pymupdf.open(self.path) as doc:
            return chr(12).join([page.get_text() for page in doc])
    
    def get(self):
        """
        Retrieves the presentation resource.

        Returns:
            ResourceWrapper: The presentation resource.

        """
        assert self.converted_to_pdf, "The presentation file must be converted to PDF with .save() first."
        doc = pymupdf.open(self.path)
        return self.ResourceWrapper(doc)
    
    def save(self, path: str):
        """
        Saves the presentation file as a PDF file.

        Args:
            path (str): The path to save the presentation file.

        """
        super().save(path)
        new_path = convert_pptx_to_pdf(path)
        self.file.filename = os.path.basename(new_path)
        self.path = new_path

        with open(new_path, "rb") as file:
            self.file.file = file 
        
        self.converted_to_pdf = True
    

class PDFFile(BaseFile):
    """
    Represents a PDF file.

    Args:
        file (UploadFile, optional): The uploaded file object. Defaults to None.
        path (str, optional): The path to the file. Defaults to None.

    Raises:
        ValueError: If the content type or extension of the file is not supported.

    Attributes:
        file (UploadFile): The uploaded file object.
        path (str): The path to the file.

    Methods:
        content(): Returns the content of the PDF file as text.
        get(): Returns a resource wrapper for the PDF file.

    """

    def __init__(self, file: UploadFile = None, path: str = None):
        ext = splitext(file.filename if file else path if path else "")[1]
        if ext.lower() != "pdf":
            raise ValueError("Unsupported extension: " + ext)
        if file and file.content_type != "application/pdf":
            raise ValueError("Unsupported content type: " + file.content_type)
        super().__init__(file, path)

    def content(self):
        """
        Returns the content of the PDF file as text.

        Returns:
            str: The content of the PDF file.

        Raises:
            ValueError: If no file is provided.

        """
        if not self.path and not self.file:
            raise ValueError("No file provided.")
        
        # TODO: if file size is not too large and there aren't many pages, convert to images
        # TODO: we may also need OCR here, for scanned PDFs
        # TODO: Do testing with contents
        if self.path:
            with pymupdf.open(self.path) as doc:
                return chr(12).join([page.get_text() for page in doc])
        
        # TODO: find a solution for large pdf files such as books
        with pymupdf.open(stream=BytesIO(self.file.file.read()), filetype="pdf") as doc:
            return chr(12).join([page.get_text() for page in doc])

    def get(self):
        """
        Returns a resource wrapper for the PDF file.

        Returns:
            ResourceWrapper: A resource wrapper for the PDF file.

        """
        doc = pymupdf.open(self.path)
        return self.ResourceWrapper(doc)
    

class WordFile(BaseFile):
    """
    Represents a Word file.

    Args:
        file (UploadFile, optional): The uploaded file. Defaults to None.
        path (str, optional): The file path. Defaults to None.

    Raises:
        ValueError: If the content type or extension is unsupported.

    Attributes:
        file (UploadFile): The uploaded file.
        path (str): The file path.

    Methods:
        content: Returns the content of the Word file.
        get: Returns a resource wrapper for the Word file.
    """

    def __init__(self, file: UploadFile = None, path: str = None):
        ext = splitext(file.filename if file else path if path else "")[1]
        if ext.lower() != "docx":
            raise ValueError("Unsupported extension: " + ext)
        if file and file.content_type != "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            raise ValueError("Unsupported content type: " + file.content_type)
        super().__init__(file, path)

    # TODO: not tested with a docx file
    def content(self):
        """
        Returns the content of the Word file.

        Returns:
            str: The content of the Word file.
        
        Raises:
            ValueError: If no file is provided.
        """
        if not self.path and not self.file:
            raise ValueError("No file provided.")
        
        if self.path:
            doc = Document(self.path)
        else:
            doc = Document(BytesIO(self.file.file.read()))
        # TODO: Do testing
        return chr(12).join([para.text for para in doc.paragraphs])

    def get(self):
        """
        Returns a resource wrapper for the Word file.

        Returns:
            ResourceWrapper: The resource wrapper for the Word file.
        """
        doc = Document(self.path)
        return self.ResourceWrapper(doc)
    

class FileFactory:
    """
    A factory class for creating different types of files based on their extensions.
    """
    def __init__(self):
        self.file_types = {
            "pdf": PDFFile,
            "pptx": PresentationFile,
            "docx": WordFile,
            "png": ImageFile,
            "jpg": ImageFile,
            "jpeg": ImageFile
        }

    def __call__(self, file: UploadFile = None, path: str = None):
        extension = splitext(path if path else file.filename if file else "")[1].lower()
        if extension not in self.file_types:
            return GenericFile(file=file, path=path)
        return self.file_types[extension](file=file, path=path) # delegate the creation of the file to the corresponding class
