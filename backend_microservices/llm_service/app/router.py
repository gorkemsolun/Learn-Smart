from fastapi import APIRouter, Depends, Form, File, UploadFile
from typing import List

from model import ChatHistory, ChatClient, ChatFile

router = APIRouter(prefix="/genai", tags=["Generative AI"])

@router.post("/send_message")
async def send_message(
    history_url: str = Form(...),
    message: str = Form(...), 
    files: List[UploadFile] = File(None),
    model: str = Form("google"), 
    current_user: dict = Depends(auth.get_current_user)):
    """
    Send a message in a chat and generate a response.

    Args:
        history_url (str): The URL of the chat history.
        message (str): The message to send.
        files (List[UploadFile]): The files to send.
        model (str): The generative AI model to use.
        current_user (dict): The current user.
    """
    # TODO: fetch from S3/FileManager
    with open(history_url, "rb") as f:
        chat_history = f
    history = ChatHistory.from_binary(chat_history) 

    client = ChatClient.create(model=model, system_prompt=None) # TODO: IMPLEMENT SYSTEM PROMPTS

    chat_files = []
    for file in files:
        chat_files.append(ChatFile(name=file.content_type, data=file.file.read()))

    response, history = client.invoke(history, message, chat_files)
    
    # S3 and FileManager call
    # history.save(history_url)

    return {"response": response}
    