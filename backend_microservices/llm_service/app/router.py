from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException
from typing import List

import json

from client import ChatHistory, ChatClient, ChatFile
from util import validate_quiz_format
from . import WEEKLY_STUDY_PLAN_PROMPT, QUIZZES_PROMPT, FLASHCARD_PROMPT

router = APIRouter(prefix="/genai", tags=["Generative AI"])

@router.post("/send_message")
async def send_message(
    message: str = Form(...), 
    history_url: str = Form(None),
    system_prompt: str = Form(None),
    files: List[UploadFile] = File(None),
    file_urls: List[str] = Form(None),
    model: str = Form("google"), 
    current_user: dict = Depends(auth.get_current_user)):
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
    

@router.post("/create/weekly_study_plan")
async def create_weekly_study_plan(
    syllabus: UploadFile = Form(...),
    current_user: dict = Depends(auth.get_current_user)):
    """
    Create a weekly study plan for a course.

    Args:
        syllabus (UploadFile): The course syllabus.
        current_user (dict): The current user.
    """
    client = ChatClient.create(model="google", system_prompt=WEEKLY_STUDY_PLAN_PROMPT)
    response, _ = client.invoke(
        query=" ", 
        files=[ChatFile(mimetype=syllabus.content_type, data=syllabus.file)],
        generation_config={"response_mime_type": "application/json"}
    )
    
    response_dict = json.loads(response) # TODO: Handle JSON parsing errors, i.e. implement validation logic
        
    return response_dict["success"], response_dict["data"]


@router.post("/create/quiz")
async def create_quiz(
    history_urls: List[str] = Form(...),
    current_user: dict = Depends(auth.get_current_user)):
    """
    Create a quiz based on a chat history.

    Args:
        history_urls (List[str]): The URLs of the chat histories.
        current_user (dict): The current user.
    """
    client = ChatClient.create(model="google", system_prompt=QUIZZES_PROMPT)

    # placeholder, fetch from S3/FileManager
    histories: List[ChatHistory] = [ChatHistory.from_binary(open(url, "rb")) for url in history_urls] 
    messages_merged = [message for history in histories for message in history.messages]
    history_merged = ChatHistory(messages=messages_merged)

    response, _ = client.invoke(
        query=" ", 
        history=history_merged,
        generation_config={"response_mime_type": "application/json"}
    )

    response_dict = json.loads(response)
    if not response_dict["success"]:
        raise HTTPException(status_code=500, detail="Failed to generate quiz.")
    
    data = response_dict["data"]
    if not validate_quiz_format(data):
        raise HTTPException(status_code=500, detail="An error occurred while generating the quiz.")
    
    return {"success": True, "quiz": data}


@router.post("/create/flashcards")
async def create_flashcards(
    history_urls: List[str] = Form(...),
    current_user: dict = Depends(auth.get_current_user)):
    """
    Create flashcards based on a chat history.

    Args:
        history_urls (List[str]): The URLs of the chat histories.
        current_user (dict): The current user.
    """
    client = ChatClient.create(model="google", system_prompt=FLASHCARD_PROMPT)

    # placeholder, fetch from S3/FileManager
    histories: List[ChatHistory] = [ChatHistory.from_binary(open(url, "rb")) for url in history_urls] 
    messages_merged = [message for history in histories for message in history.messages]
    history_merged = ChatHistory(messages=messages_merged)

    response, _ = client.invoke(
        query=" ", 
        history=history_merged,
        generation_config={"response_mime_type": "application/json"}
    )

    response_dict = json.loads(response)
    if not response_dict["success"]:
        raise HTTPException(status_code=500, detail="Failed to generate flashcards.")
    
    data = response_dict["data"]
    flashcards = {
        "topics": [item["topic"] for item in data],
        "explanations": [item["explanation"] for item in data]
    }
    
    return {"success": True, "flashcards": flashcards}
    