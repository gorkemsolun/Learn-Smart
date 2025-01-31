from fastapi import APIRouter, UploadFile, Depends, Form, File
from typing import List

from genai_service.app.clients import user
from genai_service.app.genai_client import ChatHistory, ChatClient, ChatFile

router = APIRouter(prefix="/public", tags=["Generative AI - Public API"])

@router.post("/generate/message")
async def send_message(
    message: str = Form(...), 
    history_url: str = Form(None),
    system_prompt: str = Form(None),
    files: List[UploadFile] = File(None),
    file_urls: List[str] = Form(None),
    model: str = Form("google"), 
    current_user: dict = Depends(user.get_current_user)):
    """
    Send a message in a chat and generate a response.

    Args:
        history_url (str): The URL of the chat history.
        message (str): The message to send.
        files (List[UploadFile]): The files to send.
        file_urls (List[str]): The URLs to the uploaded files.
        model (str): The generative AI model to use.
        current_user (dict): The current user.
    """
    assert len(files) == len(file_urls), "The number of files and file URLs must match."

    # TODO: fetch from S3/FileManager
    if history_url is not None:
        with open(history_url, "rb") as file:
            history = ChatHistory.from_binary(file) 
    else:
        history = None

    client = ChatClient.create(model=model, system_prompt=system_prompt)

    # TODO: Check file sizes and reject if too large
    chat_files = []
    if files:
        for file, url in zip(files, file_urls):
            chat_files.append(ChatFile(mimetype=file.content_type, data=file.file, url=url))

    response, history = client.invoke(message, history=history, files=chat_files)
    
    # S3 and FileManager call
    # history.save(history_url)

    return {"response": response, "history": history.messages}
