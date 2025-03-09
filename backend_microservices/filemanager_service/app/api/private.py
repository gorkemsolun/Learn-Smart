import os, io
from typing import List
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from fastapi.responses import StreamingResponse

from filemanager_service.app.security.auth import verify_api_key
from filemanager_service.app.database.session import get_db
from filemanager_service.app.database.dbmanager import FileDB
import filemanager_service.app.remote.s3lib as s3lib
from filemanager_service.app import STORAGE_DIR

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

    try:
        # Create database entry
        file_db = FileDB.create(db, user_id, file.filename, file.content_type)
        file_id = file_db["file_id"]
        
        # Save file to local storage
        file_path = os.path.join(STORAGE_DIR, str(file_id))
        
        # Write file content
        content = file.file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        return {"status": "success", "file_id": file_id}
        
    except Exception as e:
        # If anything fails, clean up DB entry
        if 'file_db' in locals():
            try:
                FileDB.delete(db, file_id=file_db["file_id"])
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")


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
    processed_files = []  # Track both DB entries and file paths
    
    try:
        for file in files:
            # Create database entry
            file_db = FileDB.create(db, user_id, file.filename, file.content_type)
            file_id = file_db["file_id"]
            
            # Save file to local storage
            file_path = os.path.join(STORAGE_DIR, str(file_id))
            
            # Write file content
            content = file.file.read()
            with open(file_path, "wb") as f:
                f.write(content)

            file_ids.append(file_id)
            processed_files.append({"file_id": file_id, "path": file_path})
                
    except Exception as e:
        # Clean up any files that were processed in this batch
        for processed in processed_files:
            # Delete the file from storage
            try:
                if os.path.exists(processed["path"]):
                    os.remove(processed["path"])
            except Exception:
                pass
                
            # Delete the database entry
            try:
                FileDB.delete(db, file_id=processed["file_id"])
            except Exception:
                pass
                
        raise HTTPException(status_code=500, detail=f"Failed to upload files: {str(e)}")

    return {"status": "success", "file_ids": file_ids}


@router.get("/")
def download_file(file_id: int, db: FileDB = Depends(get_db)):
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
    
    fid = file_db["file_id"]
    file_path = os.path.join(STORAGE_DIR, str(fid))
    
    if os.path.exists(file_path):
        return StreamingResponse(
            open(file_path, "rb"),
            media_type=file_db["mime_type"],
            headers={"Content-Disposition": f"attachment; filename={file_db['file_name']}"}
        )


@router.delete("/")
def delete_file(file_id: int, db: FileDB = Depends(get_db)):
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
    
    try:
        fid = file_db["file_id"]
        file_path = os.path.join(STORAGE_DIR, str(fid))
        
        # Delete from database
        FileDB.delete(db, file_id=fid)
        
        # Delete from local storage if exists
        if os.path.exists(file_path):
            os.remove(file_path)
        
        return {"status": "success", "file_id": fid}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")


@router.delete("/batch")
def batch_delete_files(file_ids: List[int], db: FileDB = Depends(get_db)):
    """
    Delete multiple files by their IDs from local storage.

    Args:
        file_ids (List[int]): The IDs of the files to delete.

    Returns:
        dict: A dictionary of success information and the file IDs.

    Raises:
        HTTPException: If there is an error deleting the files.
    """
    deleted_files = []
    for fid in file_ids:
        file_db = FileDB.fetch(db, file_id=fid)
        if not file_db:
            raise HTTPException(status_code=404, detail=f"File with ID {fid} not found")
        
        try:
            # Delete from database
            FileDB.delete(db, file_id=fid)
            
            # Delete from local storage if exists
            file_path = os.path.join(STORAGE_DIR, str(fid))
            if os.path.exists(file_path):
                os.remove(file_path)
                
            deleted_files.append(fid)

        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to delete file {fid}: {str(e)}"
            )

    return {"status": "success", "file_ids": deleted_files}
