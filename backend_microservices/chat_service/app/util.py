from typing import Optional, Tuple, List
import asyncio
import tempfile
import os, base64, pickle
import uuid
from sqlalchemy import text

from fastapi import HTTPException, UploadFile

from chat_service.app.model import ChatHistory, ChatFile
from chat_service.app.clients import filemanager, course, genai
from chat_service.app.database.session import get_db, Base
from chat_service.app.database.dbmanager import ChatDB


def init(restart: bool = False):
    gen = get_db()
    db = next(gen)

    try:
        if restart:
            print("Dropping tables...")
            db.execute(text("DROP TABLE IF EXISTS chats;"))
            
        Base.metadata.create_all(bind=db.bind)
        
    finally:
        gen.close() # closes the session


async def convert_pptx_to_pdf(pptx_content: bytes) -> bytes:
    """
    Converts a PPTX file to PDF using LibreOffice.
    Args:
        pptx_content (bytes): The content of the PPTX file to be converted.

    Returns:
        bytes: The content of the converted PDF file.
    """
    pptx_temp_path: Optional[str] = None
    pdf_path: Optional[str] = None
    
    try:
        # Create temporary PPTX file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pptx') as pptx_temp:
            pptx_temp.write(pptx_content)
            pptx_temp_path = pptx_temp.name

        output_dir = tempfile.gettempdir()
        
        # Convert using LibreOffice
        process = await asyncio.create_subprocess_exec(
            'libreoffice', '--headless', '--convert-to', 'pdf',
            '--outdir', output_dir, pptx_temp_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise RuntimeError(f"PPTX to PDF conversion failed: {stderr.decode()}")

        # Get path of converted PDF
        pdf_path = splitext(pptx_temp_path)[0] + '.pdf'
        if not os.path.exists(pdf_path):
            raise RuntimeError("Converted PDF file not found")

        # Read PDF content
        with open(pdf_path, 'rb') as pdf_file:
            return pdf_file.read()
            
    finally:
        # Cleanup temporary files
        if pptx_temp_path and os.path.exists(pptx_temp_path):
            os.remove(pptx_temp_path)
        if pdf_path and os.path.exists(pdf_path):
            os.remove(pdf_path)


def splitext(filename: str) -> tuple[str, str]:
    """
    Splits the filename and extension of a file.
    input: "file.pdf" | output: ("file", "pdf")
    """
    base_name = os.path.splitext(filename)[0]
    extension = os.path.splitext(filename)[-1][1:]
    return base_name, extension


async def get_authorized_chat_and_course(db, chat_id: int, user_id: int) -> tuple[dict, dict]:
    """
    Fetches the chat and course information for the given chat ID and course ID, and verifies the user ID.

    Args:
        chat_id (int): The ID of the chat to fetch.
        user_id (int): The ID of the user to verify.

    Raises:
        HTTPException: If the chat or course is not found (404) or if the user is not authorized to access the course (403).

    Returns:
        tuple: A tuple containing dictionaries of chat and course information.
    """
    chat = ChatDB.fetch(db, chat_id=chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    
    course_dict = await course.get_course(course_id=chat["course_id"])
    if not course_dict:
        raise HTTPException(status_code=404, detail="Course not found.")
    
    if course_dict["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden.")
    
    return chat, course_dict


async def load_chat_history(history_fid=None) -> ChatHistory:
    """
    Loads the chat history from a history file ID.

    Args:
        history_fid (Optional[str]): The file ID of the chat history.

    Returns:
        ChatHistory: The loaded chat history.
    """
    if history_fid:
        history_bytes = await filemanager.download(file_id=history_fid)
        return ChatHistory.from_bytes(history_bytes)
    
    return ChatHistory() # Create new history if not given


async def save_chat_history(history: ChatHistory, user_id: int) -> str:
    """
    Saves the chat history to a JSON file and uploads it to the FileManager service.

    Args:
        history (ChatHistory): The chat history to save.
        user_id (int): The ID of the user to save the history for.

    Returns:
        str: The file ID of the uploaded chat history file.
    """
    """
    Saves the chat history using pickle serialization.
    """
    with tempfile.NamedTemporaryFile(
        mode='w+b', suffix='.pkl', delete=True
    ) as tf:
        # Use pickle to serialize the entire object structure
        pickle.dump(history, tf)
        tf.flush()
        tf.seek(0)
        
        history_file = UploadFile(
            filename=f"chat_history_{uuid.uuid4()}.pkl",
            file=tf,
        )
        
        return await filemanager.upload(file=history_file, user_id=user_id)


async def handle_chat_message(
    history_fid: Optional[int],
    files: List[UploadFile],
    text: str,
    model: str,
    user_id: int
) -> Tuple[str, str]:
    """
    Processes a chat message by sending it to the AI model and updating the chat history.

    Args:
        history_fid (Optional[str]): The file ID of the chat history.
        files (List[UploadFile]): The list of uploaded files.
        text (str): The text message from the user.
        model (str): The generative AI model to use.
        authorization (str): The authorization token.
        user_id (int): The ID of the user.

    Returns:
        Tuple[str, str]: A tuple containing the new history file ID and the AI response.
    """
    # Load or create chat history
    history = await load_chat_history(history_fid)

    # Handle file uploads and message creation
    if files:
        file_ids = await filemanager.batch_upload(files=files, user_id=user_id)

        chat_files = []
        for file, fid in zip(files, file_ids):
            await file.seek(0)  # Reset file pointer
            chat_files.append(ChatFile(
                mimetype=file.content_type,
                raw_data=await file.read(),
                fid=fid
            ))
    else:
        chat_files = None
    
    # Add messages and generate response
    history.add_message(role="user", content=text, files=chat_files)

    response = await genai.send_message(history=history, model=model)
    history.add_message(role="assistant", content=response)

    # Save updated history
    new_history_fid = await save_chat_history(history, user_id)
    
    # Cleanup old history file
    if history_fid:
        try:
            await filemanager.delete(file_id=history_fid)
        except:
            pass
    
    return new_history_fid, response


def encode_base64(file: bytes) -> str:
    """
    Encode an image file as a base64 string.
    Args:
        - file (BinaryIO): The file object to encode.
    """
    return base64.b64encode(file).decode("utf-8")
