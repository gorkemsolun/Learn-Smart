from typing import Literal, List
import json, pymupdf

class ChatFile:
    mimetype: str = None  # MIME type of the file
    raw_data: bytes = None  # file data
    fid: int = None  # FID of the file

    def __init__(self, mimetype: str, raw_data: bytes, fid: int = None):
        """
        Initialize a File object.

        Args:
            mimetype (str): The MIME type of the file.
            raw_data (bytes): The file data.
            fid (int): The FID of the file.
        """
        self.mimetype = mimetype
        self.raw_data = raw_data
        self.fid = fid


class ChatMessage:
    def __init__(self, role: Literal["assistant", "user", "developer", "edux"], 
                 content: str, files: List[ChatFile] = None):
        """
        Initialize a ChatMessage object.

        Args:
            role (str): The role of the message sender.
            content (str): The message content.
            files (List[File]): The files sent with the message.
        """
        self.role: Literal["assistant", "user", "developer", "edux"] = role
        self.content: str = content
        self.files: List[ChatFile] = files or []


class ChatHistory:
    """
    Class to store chat history and prepare it for various API clients.
    """

    def __init__(self, messages: List[ChatMessage] = None):
        self.messages = messages or []


    def add_message(self, role: Literal["assistant", "user", "developer", "edux"], 
                    content: str, files: List[ChatFile] = None):
        """
        Add a message to the chat history.
        Args:
            - role (str): The role of the message sender.
            - content (str): The message content.
            - files (List[ChatFile]): The files sent with the message.
        """
        self.messages.append(ChatMessage(role=role, content=content, files=files))


    def openai(self):
        from chat_service.app.util import encode_base64
        """
        Convert the generic chat history into OpenAI API format.
        """
        openai_history = []
        for message in self.messages:
            text = message.content
            
            content = []
            for file in message.files:
                if file.mimetype.startswith("image/"):
                    img_b64 = encode_base64(file.raw_data)
                    content.append({
                        "type": "image_url", 
                        "image_url": f"data:{file.mimetype};base64,{img_b64}"
                    })
                elif file.mimetype.startswith("application/pdf"):
                    # convert pdf into set of images, since OpenAI doesn't support pdf files natively
                    with pymupdf.open(stream=file.raw_data, filetype="pdf") as pdf:
                        for page in pdf:
                            pix = page.get_pixmap()
                            img_b64 = encode_base64(pix.tobytes())
                            content.append({
                                "type": "image_url",
                                "image_url": f"data:image/png;base64,{img_b64}"
                            })
                else:
                    raise ValueError(f"Unsupported file type: {file.mimetype}")

            content.append({
                "type": "text",
                "text": text
            })
            openai_history.append({
                "role": "user" if message.role == "edux" else message.role,
                "content": content
            })

        return openai_history


    def anthropic(self):
        from chat_service.app.util import encode_base64
        """
        Convert the generic chat history into Anthropic API format.
        """
        anthropic_history = []
        for message in self.messages:
            if message.role == "developer":
                continue

            text = message.content

            file_data = []
            for file in message.files:
                if file.mimetype.startswith("image/"):
                    type = "image"
                elif file.mimetype.startswith("application/pdf"):
                    type = "document"
                else:
                    raise ValueError(f"Unsupported file type: {file.mimetype}")

                data = encode_base64(file.raw_data)

                file_data.append({
                    "type": type,
                    "source": {
                        "type": "base64",
                        "media_type": file.mimetype,
                        "data": data
                    }
                })

            anthropic_history.append({
                "role": "user" if message.role == "edux" else message.role,
                "content": file_data.append({   
                    "type": "text",
                    "text": text
                })
            })
        
        return anthropic_history
    

    def google(self):
        from chat_service.app.util import encode_base64
        """
        Convert the generic chat history into Google API format.
        """
        gemini_history = []
        for message in self.messages:
            if message.role == "developer":
                continue

            parts = [message.content]
            for file in message.files:
                data = encode_base64(file.raw_data)
                parts.append({
                    "file_data": {
                        "mime_type": file.mimetype, 
                        "data": data
                    }
                })

            role = ("model" if message.role == "assistant"
                    else "user" if message.role == "edux"
                    else message.role)
            gemini_history.append({"role": role, "parts": parts})

        return gemini_history
    

    @staticmethod
    def from_bytes(file: bytes) -> "ChatHistory":
        """
        Load a ChatHistory object from a byte stream.
        Args:
            - file (bytes): The byte stream to load the ChatHistory object from.
        Returns:
            ChatHistory: The loaded ChatHistory object.
        """
        try:
            json_str = file.decode('utf-8')
            return json.loads(json_str)
        except (UnicodeDecodeError, json.JSONDecodeError) as e:
            raise ValueError(f"Failed to parse JSON data: {str(e)}")
