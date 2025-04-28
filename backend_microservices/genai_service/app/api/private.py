from fastapi import APIRouter, Depends, Form, Body, UploadFile, HTTPException
from typing import List
import json

import google.generativeai as genai

from genai_service.app.client import ChatClient

from genai_service.app.util import validate_quiz_format, validate_flashcards_format, encode_base64
from genai_service.app.security.auth import verify_api_key
from genai_service.app import (
    WEEKLY_STUDY_PLAN_PROMPT, GOOGLE_MODEL_VERSION
)

router = APIRouter(
    prefix="/private", 
    tags=["Generative AI - Private API"],
    dependencies=[Depends(verify_api_key)]
)

@router.post("/generate/message")
async def send_message(payload: dict = Body(...)):
    """
    Send a message in a chat and generate a response.

    Args:
        history (List[dict]): The chat history.
        system_prompt (str): The system prompt to use.
        model (str): The generative AI model to use. One of "google", "openai" or "anthropic".
        current_user (dict): The current user.
    """
    history = json.loads(payload.get("history", "[]"))
    system_prompt = payload.get("system_prompt")
    model = payload.get("model", "google")

    client = ChatClient.create(model=model, system_prompt=system_prompt)
    response = client.invoke(history=history)

    return response


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
    syllabus_content = encode_base64(syllabus.file.read())
    response = model.generate_content([
        {'mime_type':'application/pdf', 'data': syllabus_content}, 
        WEEKLY_STUDY_PLAN_PROMPT
    ])
    response_dict = json.loads(response.text)
    return {"success": response_dict["success"], "data": response_dict["data"]}


@router.post("/generate/quiz")
async def create_quiz(payload: dict = Body(...)):
    """
    Create a quiz based on a chat history.

    Args:
        history (List[dict]): The chat history.

    Returns:
        dict: The generated quiz.
    """
    history = json.loads(payload.get("history", "[]"))

    client = ChatClient.create(model="google")
    response = client.invoke(
        history=history,
        generation_config={"response_mime_type": "application/json"}
    )

    response_dict = json.loads(response)
    if not response_dict["success"]:
        raise HTTPException(status_code=500, detail=f"{response_dict["data"]}")
    
    data = response_dict["data"]
    if not validate_quiz_format(data):
        raise HTTPException(status_code=500, detail="Quiz format could not be validated.")
    
    return {"success": True, "quiz": data}


@router.post("/generate/flashcards")
async def create_flashcards(payload: dict = Body(...)):
    """
    Create flashcards based on a chat history.

    Args:
        history (List[dict]): The chat history.
        current_user (dict): The current user.
    """
    history = json.loads(payload.get("history", "[]"))

    client = ChatClient.create(model="google")
    response = client.invoke(
        history=history,
        generation_config={"response_mime_type": "application/json"}
    )

    response_dict = json.loads(response)
    if not response_dict["success"]:
        raise HTTPException(status_code=500, detail="Failed to generate flashcards.")
    
    data = response_dict["data"]
    if not validate_flashcards_format(data):
        raise HTTPException(status_code=500, detail="Flashcards format could not be validated.")
    
    return {"success": True, "flashcards": data}
    