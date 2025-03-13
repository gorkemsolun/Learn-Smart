import os
from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from fastapi.responses import StreamingResponse

from filemanager_service.app.security.auth import verify_api_key
from filemanager_service.app.database.session import get_db
from filemanager_service.app.database.dbmanager import FileDB
import filemanager_service.app.util as util
from filemanager_service.app import STORAGE_DIR

router = APIRouter(
    prefix="/private", 
    tags=["File Management - Private API"],
    dependencies=[Depends(verify_api_key)]
)

class FileDeleteRequest(BaseModel):
    file_ids: list[int]

@router.post("/")
def upload_file(user_id: int,
                file: UploadFile = File(...), 
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
    return util.upload_file(db, user_id, file)


@router.post("/batch")
def batch_upload_files(user_id: int,
                       files: List[UploadFile] = File(...),
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
    return util.batch_upload_files(db, user_id, files)


@router.get("/")
def download_file(file_id: int, db = Depends(get_db)):
    """
    Retrieve a file by its ID.

    Args:
        file_id (int): The ID of the file to retrieve.

    Returns:
        StreamingResponse: A streaming response with the file data.

    Raises:
        HTTPException: If the file is not found.
    """
    file_db = FileDB.fetch(db, file_id=file_id)
    if not file_db:
        raise HTTPException(status_code=404, detail="File not found")
    
    fid = file_db["file_id"]
    _, ext = util.splitext(file_db["file_name"])
    file_path = os.path.join(STORAGE_DIR, f"{str(fid)}.{ext}")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found in storage")
    
    # Use context manager to ensure file is closed properly
    def iterfile():
        with open(file_path, "rb") as f:
            yield from f
    
    return StreamingResponse(
        iterfile(),
        media_type=file_db["mime_type"],
        headers={"Content-Disposition": f"attachment; filename={file_db['file_name']}"}
    )


@router.delete("/")
def delete_file(file_id: int, db = Depends(get_db)):
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
    
    return util.delete_file(db, file_db)


@router.delete("/batch")
def batch_delete_files(request: FileDeleteRequest, db = Depends(get_db)):
    """
    Delete multiple files by their IDs from local storage.

    Args:
        file_ids (List[int]): The IDs of the files to delete.

    Returns:
        dict: A dictionary of success information and the file IDs.

    Raises:
        HTTPException: If there is an error deleting the files.
    """
    file_dbs = [FileDB.fetch(db, file_id=fid) for fid in request.file_ids]
    return util.batch_delete_files(db, file_dbs)
