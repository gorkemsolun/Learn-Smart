import httpx
from fastapi import UploadFile, HTTPException, Header

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
    # Read the file contents into memory
    async with httpx.AsyncClient() as client:
        response = await client.post(
            FILEMANAGER_SERVICE_URL,
            params={"user_id": user_id},
            headers={"X-API-Key": FILEMANAGER_CLIENT_KEY},
            files={
                "file": (file.filename, file.file, file.content_type or "application/octet-stream")
            }
        )
        response.raise_for_status()  # Raise an exception for HTTP errors
    
    file_id = response.json().get("file_id")
    return int(file_id)
