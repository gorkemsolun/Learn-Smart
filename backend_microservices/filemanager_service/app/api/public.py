from typing import List
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends

from filemanager_service.app.clients import user
from filemanager_service.app.database.session import get_db
from filemanager_service.app.database.dbmanager import FileDB
from filemanager_service.app import util

router = APIRouter(
    prefix="/public", 
    tags=["File Management - Public API"],
)

@router.post("/")
def upload_file(user_id: int,
                file: UploadFile = File(...), 
                current_user = Depends(user.get_current_user),
                db = Depends(get_db)):
    """
    Upload a file to the server.

    Args:
        user_id (int): The ID of the user uploading the file.
        file (UploadFile): The file to be uploaded.

    Returns:
        dict: A dictionary of success information and the file's ID.

    Raises:
        HTTPException: If there is an error uploading the file.
    """
    if current_user["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized to upload file")
    return util.upload_file(db, user_id, file)


@router.post("/batch")
def batch_upload_files(user_id: int,
                       files: List[UploadFile] = File(...),
                       current_user = Depends(user.get_current_user),
                       db = Depends(get_db)):
    """
    Upload multiple files to the server.

    Args:
        user_id (int): The ID of the user uploading the files.
        files (List[UploadFile]): The files to be uploaded.

    Returns:
        dict: A dictionary of success information and the file IDs.

    Raises:
        HTTPException: If there is an error uploading the files.
    """
    if current_user["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized to upload file")
    return util.batch_upload_files(db, user_id, files)


@router.get("/{file_id}")
def get_file(file_id: int, 
             current_user = Depends(user.get_current_user), 
             db = Depends(get_db)):
    """
    Retrieve the URL of a file by its ID.

    Args:
        file_id (int): The ID of the file to retrieve.

    Returns:
        dict: A dictionary with the file's URL.

    Raises:
        HTTPException: If the file is not found.
    """
    file_db = FileDB.fetch(db, file_id=file_id)
    if not file_db:
        raise HTTPException(status_code=404, detail="File not found")
    
    if current_user["user_id"] != file_db["user_id"]:
        raise HTTPException(status_code=403, detail="Unauthorized to access file")
    
    filename = file_db["file_name"]
    _, ext = util.splitext(filename)

    return {
        "file_url": f"http://localhost:8004/files/{str(file_id)}.{ext}",
        "file_name": filename,
        "mime_type": file_db["mime_type"]
    }


@router.delete("/")
def delete_file(file_id: int, 
                current_user = Depends(user.get_current_user),
                db = Depends(get_db)):
    """
    Delete a file by its ID from local storage.

    Args:
        file_id (int): The ID of the file to delete.

    Returns:
        dict: A dictionary with status and file ID.

    Raises:
        HTTPException: If the file is not found or cannot be deleted.
    """
    file_db = FileDB.fetch(db, file_id=file_id)
    if not file_db:
        raise HTTPException(status_code=404, detail="File not found")
    
    if current_user["user_id"] != file_db["user_id"]:
        raise HTTPException(status_code=403, detail="Unauthorized to delete file")
    
    return util.delete_file(db, file_db)


@router.delete("/batch")
def batch_delete_files(file_ids: List[int], 
                       current_user = Depends(user.get_current_user),
                       db = Depends(get_db)):
    """
    Delete multiple files by their IDs from local storage.

    Args:
        file_ids (List[int]): The IDs of the files to delete.

    Returns:
        dict: A dictionary of success information and the file IDs.

    Raises:
        HTTPException: If there is an error deleting the files.
    """
    file_dbs = [FileDB.fetch(db, file_id=fid) for fid in file_ids]
    if not all(file_dbs):
        raise HTTPException(status_code=404, detail="File not found")
    
    if not all(current_user["user_id"] == file_db["user_id"] for file_db in file_dbs):
        raise HTTPException(status_code=403, detail="Unauthorized to delete file")
    
    return util.batch_delete_files(db, file_dbs)
