from typing import List, BinaryIO
import pickle

import google.generativeai as genai
import openai, anthropic

from util import encode_base64
from . import ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY

# TODO: Implement system prompt logic

class ChatFile:
    mimetype: str = None  # MIME type of the file
    binary: BinaryIO = None  # Binary file data

    def __init__(self, mimetype: str, binary: BinaryIO):
        """
        Initialize a File object.

        Args:
            mimetype (str): The MIME type of the file.
            binary (BinaryIO): The binary file data.
        """
        self.mimetype = mimetype
        self.binary = binary


class ChatHistory:
    """
    Class to store chat history and prepare it for various API clients.
    """

    def __init__(self):
        self.history = []


    def add_message(self, role: str, content: str, files: List[ChatFile] = None):   
        self.history.append({
            "role": role,
            "content": content,
            "files": files or []
        })


    def openai(self):
        openai_history = []
        for message in self.history:
            text = message["content"]
            
            file_data = []
            for file in message["files"]: 
                if file.mimetype.startswith("image/"):
                    data = [{
                        "type": "image_url", 
                        "image_url": f"data:{file.mimetype};base64,{encode_base64(file.binary)}"
                    }]
                elif file.mimetype.startswith("application/pdf"):
                    # For OpenAI, convert PDF pages to images, then encode them as base64
                    # TODO: Revisit after S3 and FileManager are implemented
                    import pymupdf
                    pdf = pymupdf.open(stream=file.binary, filetype="pdf")
                    data = []
                    for page in pdf:
                        pix = page.get_pixmap()
                        data.append({
                            "type": "image_url",
                            "image_url": f"data:image/png;base64,{encode_base64(pix.tobytes())}"
                        })
                    pdf.close()
                else:
                    raise ValueError(f"Unsupported file type: {file.mimetype}")
                
                file_data.extend(data)

            content = file_data.append({
                "type": "text",
                "text": text
            })
            openai_history.append({
                "role": message["role"],
                "content": content
            })

        return openai_history


    def anthropic(self):
        anthropic_history = []
        for message in self.history:
            text = message["content"]

            file_data = []
            for file in message["files"]:
                if file.mimetype.startswith("image"):
                    type = "image"
                elif file.mimetype.startswith("application/pdf"):
                    type = "document"
                else:
                    raise ValueError(f"Unsupported file type: {file.mimetype}")

                data = encode_base64(file.binary)

                file_data.append({
                    "type": type,
                    "source": {
                        "type": "base64",
                        "media_type": file.mimetype,
                        "data": data
                    }
                })

            anthropic_history.append({
                "role": message["role"],
                "content": file_data.append({   
                    "type": "text",
                    "text": text
                })
            })
        
        return anthropic_history
    

    def google(self):
        gemini_history = []
        for message in self.history:

            parts = [message["content"]]
            for file in message["files"]:
                data = encode_base64(file.binary)
                parts.append({
                    "file_data": {
                        "mime_type": file.mimetype, 
                        "data": data
                    }
                })

            role = "model" if message["role"] == "assistant" else message["role"]
            gemini_history.append({"role": role, "parts": parts})

        return gemini_history
    

    @staticmethod
    def from_binary(file: BinaryIO) -> "ChatHistory":
        """
        Load a chat history from a binary file object.
        Args:
            - file (BinaryIO): The file object to load the chat history from.
        """
        return pickle.load(file)


class ChatClientBase:
    """
    Wrapper class with memory (history) for various API clients.
    """
    def __init__(self, model: str, system_prompt: str):
        self.client = None
        self.model = model
        self.system_prompt = system_prompt

    def invoke(self, history: ChatHistory, query: str,
               files: List[ChatFile] = None, max_tokens: int = 2500) -> str:
        raise NotImplementedError


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

    def invoke(self, history: ChatHistory, query: str, 
               files: List[ChatFile] = None, max_tokens: int = 2500) -> str:
        """
        Send a message to the Anthropic API and return the response.
        Args:
            - history (ChatHistory): The chat history.
            - query (str): The message to send.
            - files (List[File]): The files to send.
            - max_tokens (int): The maximum number of tokens to generate.
        
        Returns:
            - content (str): The response from the API.
            - history (ChatHistory): The updated chat history.
        """      
        history.add_message(role="user", content=query, files=files)
        response = self.client.messages.create(
            model=self.model,
            messages=history.anthropic(),
            max_tokens=max_tokens
        )
        content = response.content[0].text
        history.add_message(role="assistant", content=content)

        return content, history


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

    def invoke(self, history: ChatHistory, query: str, 
               files: List[ChatFile] = None, max_tokens: int = 2500) -> str:
        """
        Send a message to the OpenAI API and return the response.
        Args:
            - history (ChatHistory): The chat history.
            - query (str): The message to send.
            - files (List[File]): The files to send.
            - max_tokens (int): The maximum number of tokens to generate.
        
        Returns:
            - content (str): The response from the API.
            - history (ChatHistory): The updated chat history
        """
        history.add_message(role="user", content=query, files=files)
        response = self.client.chat.completions.create(
            model=self.model,
            messages=history.openai(),
            max_tokens=max_tokens
        )
        content = response.choices[0].message.content
        history.add_message(role="assistant", content=content)

        return content, history
    

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
        genai.configure(api_key=GOOGLE_API_KEY)
        self.client = genai.GenerativeModel(model_name=model)

    def invoke(self, history: ChatHistory, query: str, 
               files: List[ChatFile] = None, max_tokens: int = 2500) -> str:
        """
        Send a message to the Google API and return the response.
        Args:
            - history (ChatHistory): The chat history.
            - query (str): The message to send.
            - files (List[File]): The files to send.
            - max_tokens (int): The maximum number of tokens to generate.

        Returns:
            - content (str): The response from the API.
            - history (ChatHistory): The updated chat history.
        """
        parts = [query]
        for file in files:
            data = encode_base64(file.binary)
            parts.append({
                "file_data": {
                    "mime_type": file.mimetype, 
                    "data": data
                }
            })
        response = self.client.start_chat(
            history=history.google()
        ).send_message({"role": "user", "parts": parts}, max_tokens=max_tokens)

        history.add_message(role="user", content=query, files=files)
        content = response.text

        history.add_message(role="assistant", content=content)
        return content, history


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
            return AnthropicChatClient(model, system_prompt)
        elif model == "openai":
            return OpenAIChatClient(model, system_prompt)
        elif model == "google":
            return GoogleChatClient(model, system_prompt)
        else:
            raise ValueError(f"Unsupported model: {model}")
