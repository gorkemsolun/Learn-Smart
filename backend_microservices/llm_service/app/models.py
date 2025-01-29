from typing import List, Dict
import base64

import google.generativeai as genai
import openai, anthropic

from util import encode_base64
from . import ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY

class File:
    mimetype = None # MIME type of the file
    url = None # URL where the file is stored


class ChatHistory:
    """
    Class to store chat history and prepare it for various API clients.
    """

    def __init__(self):
        self.history = []

    def add_message(self, role: str, content: str, files: List = None):   
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
                if file.mimetype.startswith("image"):
                    data = {
                        "type": "image_url", 
                        "image_url": f"data:{file.mimetype};base64,{encode_base64(file.url)}"
                    }
                elif file.mimetype.startswith("application/pdf"):
                    # convert PDF pages to images, encode them as base64
                    # TODO: Revisit after S3 and FileManager are implemented
                    import pymupdf
                    pdf = pymupdf.open(file.url)
                    data = []
                    for page in pdf:
                        data.append({
                            "type": "image_url",
                            "image_url": f"data:image/png;base64,{encode_base64(page.render())}"
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

                data = encode_base64(file.url)

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
                data = encode_base64(file.url)
                parts.append({
                    "file_data": {
                        "mime_type": file.mimetype, 
                        "data": data
                    }
                })

            role = "model" if message["role"] == "assistant" else message["role"]
            gemini_history.append({"role": role, "parts": parts})

        return gemini_history

class ChatClient:
    """
    Wrapper class with memory (history) for various API clients.
    """
    def __init__(self, model: str, system_prompt: str):
        self.client = None
        self.model = model
        self.system_prompt = system_prompt

    def invoke(self, query: str, max_tokens: int) -> str:
        raise NotImplementedError


class AnthropicChatClient(ChatClient):
    """
    Wrapper class with memory for the Anthropic API client.
    """
    def __init__(self, model: str, system_prompt: str):
        super().__init__(model, system_prompt)
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    def invoke(self, history: ChatHistory, query: str, 
               files: List[File] = None, max_tokens: int = 2500) -> str:
        # Anthropic has native support for PDF files
        # https://docs.anthropic.com/en/docs/build-with-claude/pdf-support#process-pdfs-with-claude
        
        history.add_message(role="user", content=query, files=files)
        response = self.client.messages.create(
            model=self.model,
            messages=history.anthropic(),
            max_tokens=max_tokens
        )
        content = response.content[0].text
        history.add_message(role="assistant", content=content)

        return content, history


class OpenAIChatClient(ChatClient):
    """
    Wrapper class with memory for the OpenAI API client.
    """
    def __init__(self, model: str, system_prompt: str):
        super().__init__(model, system_prompt)
        self.client = openai.OpenAI(api_key=OPENAI_API_KEY)

    def invoke(self, history: ChatHistory, query: str, 
               files: List[File] = None, max_tokens: int = 2500) -> str:
        history.add_message(role="user", content=query, files=files)
        response = self.client.chat.completions.create(
            model=self.model,
            messages=history.openai(),
            max_tokens=max_tokens
        )
        content = response.choices[0].message.content
        history.add_message(role="assistant", content=content)

        return content, history
    

class GoogleChatClient(ChatClient):
    """
    Wrapper class with memory for the Google API client.
    """
    def __init__(self, model: str, system_prompt: str):
        super().__init__(model, system_prompt)
        genai.configure(api_key=GOOGLE_API_KEY)
        self.client = genai.GenerativeModel(model_name=model)

    def invoke(self, history: ChatHistory, query: str, files: List[File] = None, 
               max_tokens: int = 2500) -> str:
        parts = [query]
        for file in files:
            data = encode_base64(file.url)
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
