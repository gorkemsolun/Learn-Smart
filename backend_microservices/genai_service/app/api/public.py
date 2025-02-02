from fastapi import APIRouter, Depends, Form
from typing import List

from genai_service.app.clients import user
from backend_microservices.genai_service.app.client import ChatClient

router = APIRouter(prefix="/public", tags=["Generative AI - Public API"])

@router.post("/generate/message")
async def send_message(
    history: List[dict] = Form(None),
    system_prompt: str = Form(None),
    model: str = Form("google"), # google, openai, or anthropic
    current_user: dict = Depends(user.get_current_user)):
    """
    Send a message in a chat and generate a response.

    Args:
        history (List[dict]): The chat history.
        system_prompt (str): The system prompt to use.
        model (str): The generative AI model to use.
        current_user (dict): The current user.
    """

    client = ChatClient.create(model=model, system_prompt=system_prompt)
    response = client.invoke(history=history)

    return {"status": "success", "response": response}
