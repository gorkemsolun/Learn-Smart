import os

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from .filemanager_client_auth import fm_get_current_user
from middleware.filemanager import FileFactory
from modules.user.model import User
from middleware import FILES_DIR
from tools import generate_hash, splitext

router = APIRouter(prefix="/files", tags=["Files"])

@router.post("/")
def upload_file(file: UploadFile = File(...), current_user: User = Depends(fm_get_current_user)):
    """
    Uploads a file to the server.

    Args:
        file (UploadFile): The file to be uploaded.
        current_user (User): The current authenticated user.

    Returns:
        dict: A dictionary containing the status of the upload and the filename.

    Raises:
        HTTPException: If there is an error during the upload process.

    TODO: This endpoint is not likely to be used. To be replaced (e.g. upload syllabus and send API call to LLM).
    """
    filename = file.filename
    name, extension = splitext(filename) # split name and extension, e.g. myfile.pdf -> (myfile, pdf)

    try:
        file = FileFactory()(file=file)

        # Generate a unique filename, while preserving the original filename for retrieval
        hashed_fname = f"{generate_hash(name, strategy="uuid")}_{name}.{extension}" # e.g. <hashed_name>_<actual_name>.pdf

        os.makedirs(f"{FILES_DIR}/user_{current_user['user_id']}", exist_ok=True) # create a directory for the user's files, e.g. syllabus
        path = os.path.join(FILES_DIR, f"user_{current_user['user_id']}", hashed_fname) # construct the file path

        file.save(path) # save the file in file system

        return {"status": "File uploaded successfully.", "filename": filename}
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    

# TODO: the following function makes no sense at the moment.
# after the auth. mechanism is added, this function should be modified such that
# the users should be able to delete their own files.
@router.delete("/{filename}")
def delete_file(filename: str, current_user: User = Depends(fm_get_current_user)):
    """
    Delete a file with the given filename.

    Args:
        filename (str): The name of the file to be deleted.
        current_user (User): The current authenticated user (used for authentication).

    Returns:
        dict: A dictionary containing the deleted filename.

    Raises:
        HTTPException: If the file is not found or if there is a value error.
    """

    try:
        file = FileFactory()(path=filename)
        file.delete()
        return {"filename": filename}
    
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found.")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    
@router.get("/{filename}")
def get_file(filename: str, current_user: User = Depends(fm_get_current_user)):
# TODO: file with its content should be returned
    pass
