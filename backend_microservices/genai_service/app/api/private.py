from fastapi import APIRouter, Depends, Form, UploadFile, HTTPException
from typing import List
import json

import google.generativeai as genai

from genai_service.app.client import ChatClient

from genai_service.app.util import validate_quiz_format, encode_base64
from genai_service.app.security.auth import verify_api_key
from genai_service.app import (
    WEEKLY_STUDY_PLAN_PROMPT, QUIZZES_PROMPT, FLASHCARD_PROMPT, GOOGLE_MODEL_VERSION
)


router = APIRouter(
    prefix="/private", 
    tags=["Generative AI - Private API"],
    dependencies=[Depends(verify_api_key)]
)


@router.post("/generate/weekly_study_plan")
async def create_weekly_study_plan(syllabus: UploadFile = Form(...)):
    """
    Create a weekly study plan for a course.

    Args:
        syllabus (UploadFile): The course syllabus.
        current_user (dict): The current user.
    """
    model = genai.GenerativeModel(
        model_name=GOOGLE_MODEL_VERSION,
        # system_instruction=... TODO: replace with an actual system prompt
        generation_config={"response_mime_type": "application/json"}
    )
    syllabus_content = encode_base64(await syllabus.file.read())
    response = model.generate_content([
        {'mime_type':'application/pdf', 'data': syllabus_content}, 
        WEEKLY_STUDY_PLAN_PROMPT
    ])
    response_dict = json.loads(response)
    return {"success": response_dict["success"], "data": response_dict["data"]}


@router.post("/generate/quiz")
async def create_quiz(history_urls: List[str] = Form(...)):
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


@router.post("/generate/flashcards")
async def create_flashcards(history_urls: List[str] = Form(...)):
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
    