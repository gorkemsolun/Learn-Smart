import httpx
from fastapi import UploadFile, HTTPException

from course_service.app.clients import FILEMANAGER_SERVICE_URL, FILEMANAGER_CLIENT_KEY

async def upload(file: UploadFile, user_id: int):
    """
    Calls the FileManager service to upload a file for a given user.

    Args:
        - file (UploadFile): The file to upload.
        - user_id (int): The ID of the user to upload the file for.

    Returns:
        - int: The ID of the uploaded file.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{FILEMANAGER_SERVICE_URL}/private/",
                params={"user_id": user_id},
                headers={"X-API-Key": FILEMANAGER_CLIENT_KEY},
                files={
                    "file": (file.filename, file.file, file.content_type or "application/octet-stream")
                }
            )
            response.raise_for_status()  # Raise an exception for HTTP errors
        
        file_id = response.json().get("file_id")
        return int(file_id)
    
    except httpx.RequestError as e:
        """ raise HTTPException(
            status_code=500,
            detail=f"FileManager service error: {str(e)}"
        ) """
        raise e


async def delete(file_id: int | str):
    """
    Calls the FileManager service to delete a file.

    Args:
        - file_id (int): The ID of the file to delete.

    Returns:
        - bool: True if the file was deleted successfully, False otherwise.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{FILEMANAGER_SERVICE_URL}/private/{file_id}",
                headers={"X-API-Key": FILEMANAGER_CLIENT_KEY}
            )
            response.raise_for_status()  # Raise an exception for HTTP errors
        
        return True
    
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Chat service error: {str(e)}"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unknown error occured."
        )
