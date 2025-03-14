from typing import List

import google.generativeai as genai
import openai
import anthropic

from genai_service.app import (
    ANTHROPIC_API_KEY, OPENAI_API_KEY, 
    GOOGLE_MODEL_VERSION, ANTHROPIC_MODEL_VERSION, OPENAI_MODEL_VERSION,
    SYSTEM_PROMPT
)

class ChatClientBase:
    """
    Wrapper class with memory (history) for various API clients.
    """
    def __init__(self, model: str, system_prompt: str = None):
        self.client = None
        self.model = model
        self.system_prompt = system_prompt or SYSTEM_PROMPT


    def invoke(self, history: List[dict], max_tokens: int = 2500,
               generation_config = None):
        """
        Send a message to the API and return the response.
        """
        raise NotImplementedError("invoke() method must be called from a subclass.")


class AnthropicChatClient(ChatClientBase):
    """
    Wrapper class with memory for the Anthropic API client.
    """
    def __init__(self, model: str, system_prompt: str = None):
        """
        Initialize the client with the API key.
        Args:
            - model (str): The model to use.
            - system_prompt (str): The system prompt to use.
        """
        super().__init__(model, system_prompt)
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


    def invoke(self, history: List[dict], max_tokens: int = 2500) -> str:
        """
        Send a message to the Anthropic API and return the response.
        Args:
            - history (List[dict]): The chat history.
            - max_tokens (int): The maximum number of tokens to generate.
        
        Returns:
            - content (str): The response from the API.
        """ 
        response = self.client.messages.create(
            model=self.model,
            system=self.system_prompt,
            messages=history,
            max_tokens=max_tokens
        )
        content = response.content[0].text
        return content


class OpenAIChatClient(ChatClientBase):
    """
    Wrapper class with memory for the OpenAI API client.
    """
    def __init__(self, model: str, system_prompt: str = None):
        """
        Initialize the client with the API key.
        Args:
            - model (str): The model to use.
            - system_prompt (str): The system prompt to use.
        """
        super().__init__(model, system_prompt)
        self.client = openai.OpenAI(api_key=OPENAI_API_KEY)


    def invoke(self, history: List[dict], max_tokens: int = 2500) -> str:
        """
        Send a message to the OpenAI API and return the response.
        Args:
            - history (List[dict]): The chat history.
            - max_tokens (int): The maximum number of tokens to generate.
        
        Returns:
            - content (str): The response from the API.
        """
        history.insert(0, {"role": "developer", "content": self.system_prompt})

        response = self.client.chat.completions.create(
            model=self.model,
            messages=history,
            max_tokens=max_tokens
        )
        content = response.choices[0].message.content
        return content
    

class GoogleChatClient(ChatClientBase):
    """
    Wrapper class with memory for the Google API client.
    """
    def __init__(self, model: str, system_prompt: str = None):
        """
        Initialize the client with the API key.
        Args:
            - model (str): The model to use.
            - system_prompt (str): The system prompt to use.
        """
        super().__init__(model, system_prompt)


    def invoke(self, history: List[dict], max_tokens: int = 2500,
               generation_config = None) -> str:
        """
        Send a message to the Google API and return the response.
        Args:
            - history (List[dict]): The chat history.
            - max_tokens (int): The maximum number of tokens to generate.
            - generation_config (dict): The generation configuration (for structured responses).

        Returns:
            - content (str): The response from the API.
        """
        if not generation_config:
            generation_config = genai.GenerationConfig(
                max_output_tokens=max_tokens
            )

        model = genai.GenerativeModel(
            model_name=self.model,
            system_instruction=self.system_prompt,
            generation_config=generation_config,
        )

        response = model.start_chat(history=history).send_message(" ") # empty message to trigger chat completion
        content = response.text
        return content

class ChatClient:
    """
    Factory class to create chat clients based on the model.
    """
    @staticmethod
    def create(model: str, system_prompt: str = None) -> ChatClientBase:
        """
        Create a chat client based on the model.
        Args:
            - model (str): The model to use. Supported models are "anthropic", "openai", and "google".
            - system_prompt (str): The system prompt to use.
        """
        if model == "anthropic":
            return AnthropicChatClient(ANTHROPIC_MODEL_VERSION, system_prompt)
        elif model == "openai":
            return OpenAIChatClient(OPENAI_MODEL_VERSION, system_prompt)
        elif model == "google":
            return GoogleChatClient(GOOGLE_MODEL_VERSION, system_prompt)
        else:
            raise ValueError(f"Unsupported model: {model}")
