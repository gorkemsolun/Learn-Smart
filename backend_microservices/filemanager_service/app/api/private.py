from typing import List
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from fastapi.responses import StreamingResponse

from filemanager_service.app.database.session import get_db
from filemanager_service.app.database.dbmanager import FileDB

from filemanager_service.app.security.auth import verify_api_key

import s3lib

router = APIRouter(
    prefix="/private", 
    tags=["File Management - Private API"],
    dependencies=[Depends(verify_api_key)]
)

@router.post("/")
def upload_file(user_id: int,
                file: UploadFile = File(...), 
                db: FileDB = Depends(get_db)):
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

    file_db = FileDB.create(db, user_id, file.filename, file.content_type)
    s3lib.upload_to_s3(file_db["file_id"], file)

    return {"status": "success", "file_id": file_db["file_id"]}


@router.post("/batch")
def batch_upload_files(user_id: int,
                       files: List[UploadFile] = File(...),
                       db: FileDB = Depends(get_db)):
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
    file_ids = []
    for file in files:
        file_db = FileDB.create(db, user_id, file.filename, file.content_type)
        s3lib.upload_to_s3(file_db["file_id"], file)
        file_ids.append(file_db["file_id"])

    return {"status": "success", "file_ids": file_ids}


@router.get("/")
def fetch_file(file_id: int = None, db: FileDB = Depends(get_db)):
    """
    Retrieve a file by its ID.

    Args:
        file_id (int): The ID of the file to retrieve.

    Returns:
        FileResponse: The response model containing the file's information.

    Raises:
        HTTPException: If the file is not found.
    """
    file_db = FileDB.fetch(db, file_id=file_id)
    if not file_db:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        fid = file_db["file_id"]
        file_stream = s3lib.download_from_s3(fid)
        return StreamingResponse(
            file_stream, media_type=file_db["mime_type"],
            headers={"Content-Disposition": f"attachment; filename={file_db['file_name']}"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to download file")


@router.delete("/")
def delete_file(file_id: int = None, db: FileDB = Depends(get_db)):
    """
    Delete a file by its ID.

    Args:
        file_id (int): The ID of the file to delete.

    Returns:
        FileResponse: The response model containing the file's information.

    Raises:
        HTTPException: If the file is not found.
    """
    file_db = FileDB.fetch(db, file_id=file_id)
    if not file_db:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        fid = file_db["file_id"]
        FileDB.delete(db, file_id=fid)
        s3lib.delete_object(fid)
        return {"status": "success", "file_id": fid}

    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete file")
