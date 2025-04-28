import os, base64

from typing import List
from fastapi import UploadFile, HTTPException
from sqlalchemy import text

from filemanager_service.app.database.session import get_db, Base
from filemanager_service.app.database.model import File # required for table creation
from filemanager_service.app.database.dbmanager import FileDB
from filemanager_service.app import STORAGE_DIR

def init(restart: bool = False):
    os.makedirs(STORAGE_DIR, exist_ok=True)
    gen = get_db()
    db = next(gen)

    try:
        if restart:
            print("Dropping tables...")
            db.execute(text("DROP TABLE IF EXISTS files;"))
            
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


def encode_base64(file_content: bytes) -> str:
    """
    Encodes a file to base64.
    """
    file_content = base64.b64encode(file_content).decode("utf-8")


def upload_file(db, user_id: int, file: UploadFile):
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
        
        _, ext = splitext(file.filename)
        file_path = os.path.join(STORAGE_DIR, f"{str(file_id)}.{ext}")
        
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


def batch_upload_files(db, user_id: int,
                       files: List[UploadFile]):
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
            _, ext = splitext(file.filename)
            file_path = os.path.join(STORAGE_DIR, f"{str(file_id)}.{ext}")
            
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


def delete_file(db, file_db: dict):
    """
    Delete a file by its ID from local storage.

    Args:
        file_db (dict): The file database entry.

    Returns:
        dict: A dictionary with status and file ID.

    Raises:
        HTTPException: If the file is not found or cannot be deleted.
    """
    try:
        fid = file_db["file_id"]
        _, ext = splitext(file_db["file_name"])
        file_path = os.path.join(STORAGE_DIR, f"{str(fid)}.{ext}")
        
        # Delete from database
        FileDB.delete(db, file_id=fid)
        
        # Delete from local storage if exists
        if os.path.exists(file_path):
            os.remove(file_path)
        
        return {"status": "success", "file_id": fid}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")


def batch_delete_files(db, file_dbs: List[dict]):
    """
    Delete multiple files by their IDs from local storage.

    Args:
        file_dbs (List[dict]): The file database entries.

    Returns:
        dict: A dictionary of success information and the file IDs.

    Raises:
        HTTPException: If there is an error deleting the files.
    """
    deleted_files = []
    for file_db in file_dbs:
        fid = file_db["file_id"]
        try:
            # Delete from database
            FileDB.delete(db, file_id=fid)
            
            # Delete from local storage if exists
            _, ext = splitext(file_db["file_name"])
            file_path = os.path.join(STORAGE_DIR, f"{str(fid)}.{ext}")
            
            if os.path.exists(file_path):
                os.remove(file_path)
                
            deleted_files.append(fid)

        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to delete file {fid}: {str(e)}"
            )

    return {"status": "success", "file_ids": deleted_files}
