import httpx
from fastapi import UploadFile, HTTPException

from chat_service.app.clients import FILEMANAGER_SERVICE_URL, FILEMANAGER_CLIENT_KEY

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
    
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"FileManager service error: {str(e)}"
        )


async def batch_upload(files: list[UploadFile], user_id: int):
    """
    Calls the FileManager service to upload multiple files for a given user.

    Args:
        - files (list): A list of files to upload.
        - user_id (int): The ID of the user to upload the files for.

    Returns:
        - list: A list of file IDs for the uploaded files.
    """
    try:
        file_ids = []
        async with httpx.AsyncClient() as client:
            for file in files:
                response = await client.post(
                    FILEMANAGER_SERVICE_URL,
                    params={"user_id": user_id},
                    headers={"X-API-Key": FILEMANAGER_CLIENT_KEY},
                    files={
                        "file": (file.filename, file.file, file.content_type or "application/octet-stream")
                    }
                )
                response.raise_for_status()  # Raise an exception for HTTP errors
                file_ids.append(response.json().get("file_id"))
        
        return file_ids
    
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"FileManager service error: {str(e)}"
        )


async def download(file_id: int):
    """
    Calls the FileManager service to download a file.

    Args:
        - file_id (int): The ID of the file to download.

    Returns:
        - tuple: A tuple containing the file name and file content.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                FILEMANAGER_SERVICE_URL,
                params={"file_id": file_id},
                headers={"X-API-Key": FILEMANAGER_CLIENT_KEY}
            )
            response.raise_for_status()  # Raise an exception for HTTP errors
        
        return response.content
    
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"FileManager service error: {str(e)}"
        )


async def delete(file_id: int):
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
                FILEMANAGER_SERVICE_URL,
                params={"file_id": file_id},
                headers={"X-API-Key": FILEMANAGER_CLIENT_KEY}
            )
            response.raise_for_status()  # Raise an exception for HTTP errors
        
        return True
    
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"FileManager service error: {str(e)}"
        )


async def batch_delete(file_ids: list[int]):
    """
    Calls the FileManager service to delete multiple files.

    Args:
        - file_ids (list): A list of file IDs to delete.

    Returns:
        - bool: True if all files were deleted successfully.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{FILEMANAGER_SERVICE_URL}/batch",
                params={"file_ids": file_ids},
                headers={"X-API-Key": FILEMANAGER_CLIENT_KEY}
            )
            response.raise_for_status()  # Raise an exception for HTTP errors
        
        return True

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"FileManager service error: {str(e)}"
        )