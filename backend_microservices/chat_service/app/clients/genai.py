from fastapi import HTTPException
import httpx
import json

from chat_service.app.clients import GENAI_SERVICE_URL, GENAI_CLIENT_KEY
from chat_service.app.model import ChatHistory

async def send_message(history: ChatHistory, model: str, 
                       system_prompt: str = None) -> dict:
    """
    Send a message in a chat and generate a response.

    Args:
        history (ChatHistory): The chat history.
        system_prompt (str): The system prompt to use.
        model (str): The generative AI model to use.
    """
    if model == "google":
        history_dict = history.google()
    elif model == "openai":
        history_dict = history.openai()
    elif model == "anthropic":
        history_dict = history.anthropic()
    else:
        raise ValueError("Invalid model specified.")
    
    try:
        payload = {
            "history": json.dumps(history_dict), # Convert dict to JSON string
            "system_prompt": system_prompt,
            "model": model
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GENAI_SERVICE_URL}/private/generate/message",
                headers={
                    "X-API-Key": GENAI_CLIENT_KEY,
                    "Content-Type": "application/json"
                    },
                json=payload,
                timeout=None
            )
            response.raise_for_status()
            return response.json()
            
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=500,
            detail=f"GenAI service error: {str(e)}"
        )


async def generate_quiz(history: ChatHistory) -> dict:
    """
    Create a quiz based on a chat history.

    Args:
        history (ChatHistory): The chat history.

    Returns:
        dict: The generated quiz.
    """
    try:
        payload = {
            "history": json.dumps(history.google())
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GENAI_SERVICE_URL}/private/generate/quiz",
                headers={
                    "X-API-Key": GENAI_CLIENT_KEY,
                    "Content-Type": "application/json"
                    },
                json=payload,
                timeout=None
            )
            response.raise_for_status()
            return response.json().get("quiz")
            
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=500,
            detail=f"GenAI service error: {str(e)}"
        )


async def generate_flashcards(history: ChatHistory) -> dict:
    """
    Create flashcards based on a chat history.

    Args:
        history (ChatHistory): The chat history.

    Returns:
        dict: The generated flashcards.
    """
    try:
        payload = {
            "history": json.dumps(history.google())
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GENAI_SERVICE_URL}/private/generate/flashcards",
                headers={
                    "X-API-Key": GENAI_CLIENT_KEY,
                    "Content-Type": "application/json"
                    },
                json=payload,
                timeout=None
            )
            response.raise_for_status()
            return response.json().get("flashcards")
            
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=500,
            detail=f"GenAI service error: {str(e)}"
        )
