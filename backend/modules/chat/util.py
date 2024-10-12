import pymupdf, os, io, json, jsonpickle
import google.generativeai as genai
from typing import Optional
from fastapi import HTTPException, UploadFile
from PIL import Image

from tools import generate_hash, splitext
from database.dbmanager import SlideDB
from middleware import FILES_DIR, CHATS_DIR
from middleware.filemanager import FileFactory

from . import MODEL_VERSION, SYSTEM_PROMPT


def get_chat_history_path(chat_id: int):
    """
    Returns the path to the chat history file for the given chat ID.
    """
    return os.path.join(CHATS_DIR, f"chat_{chat_id}_history.txt")


def get_chat_history_metadata_path(chat_id: int):
    """
    Returns the path to the chat history metadata file for the given chat ID.
    """
    return os.path.join(CHATS_DIR, f"chat_{chat_id}_history_metadata.json")


def get_slide_history_path(slide_id: int, page_number: int):
    """
    Returns the path to history file for the given slide ID and page number.
    """
    return os.path.join(CHATS_DIR, f"slide_{slide_id}_page_{page_number}_history.txt")


def get_slide_history_metadata_path(slide_id: int, page_number: int):
    """
    Returns the path to the history metadata file for the given slide ID and page number.
    """
    return os.path.join(CHATS_DIR, f"slide_{slide_id}_page_{page_number}_metadata.json")


def get_chat_files_path(chat_id: int):
    """
    Returns the path to the directory containing uploaded files for the given chat ID.
    """
    return os.path.join(FILES_DIR, f"chat_{chat_id}")


def get_slides_files_path(slide_id: int, page_number: int):
    """
    Returns the path to the directory containing the uploaded files for the given slide ID and page number.
    """
    return os.path.join(FILES_DIR, f"slide_{slide_id}_page_{page_number}")


def get_quizzes_folder_path(chat_id: int):
    return os.path.join(get_chat_files_path(chat_id), "quiz")


def get_flashcards_folder_path(chat_id: int):
    return os.path.join(get_chat_files_path(chat_id), "flashcards")


def init_chat(history_content=None):
    """
    Initializes a chat session with a generative AI model.

    Args:
        history_content (str, optional): A JSON-encoded string representing the chat history. 
                                         If None, an empty history is used.

    Returns:
        model: An instance of the GenerativeModel class with the chat session started.
    """
    history = jsonpickle.decode(history_content) if history_content else []
    model = genai.GenerativeModel(MODEL_VERSION, system_instruction=SYSTEM_PROMPT).start_chat(history=history)
    return model


def save_history(history_path, history):
    """
    Save chat history to a specified file.

    Args:
        history_path (str): The path to the file where the history will be saved.
        history (str): The jsonpickle encoded chat history content to be saved.

    """
    with open(history_path, "w") as history_file:
        history_file.write(history)


def get_slide_content(slide_id: int, page_number: int):
    """
    Returns the content of the slide as a PIL Image with the given slide ID and page number.
    """
    slide = SlideDB.fetch(slide_id=slide_id)
    if not slide:
        return None
    
    slide_path = slide["slides_file_url"]
    doc = pymupdf.open(slide_path)
    page = doc.load_page(page_number - 1) # page_number is 1-based on UI side
    pix = page.get_pixmap()
    
    img_buffer = io.BytesIO(pix.tobytes("png"))  # Save pixmap as PNG to buffer
    img_buffer.seek(0)  # Rewind the buffer to the beginning
    doc.close()
    
    img = Image.open(img_buffer)
    return img


def validate_llm_quiz_response(data):
    """
    Validates the response structure for the generated quiz.
    """
    if not isinstance(data, list):
        return False
    
    for item in data:
        if not isinstance(item, dict):
            return False

        # Validate 'question' key
        if 'question' not in item or not isinstance(item['question'], str):
            return False

        # Validate 'choices' key
        if 'choices' not in item or not isinstance(item['choices'], list):
            return False
        
        # Ensure 'choices' contains 5 elements
        if len(item['choices']) != 5:
            return False
        
        # Validate each choice in 'choices'
        for choice in item['choices']:
            if not isinstance(choice, str):
                return False
        
        # Validate 'answer' key
        if 'answer' not in item or not item['answer'].upper() in ['A', 'B', 'C', 'D', 'E']:
            return False

    return True


def handle_file_upload_for_message(file: UploadFile, chat_id: int, slide_id: Optional[int] = None, page_number: Optional[int] = None):
    """
    Handles the upload of a file for a chat message, optionally associating it with a specific slide and page number.
    Args:
        file (UploadFile): The file to be uploaded.
        chat_id (int): The ID of the chat to which the file is being uploaded.
        slide_id (Optional[int], optional): The ID of the slide to associate the file with. Defaults to None.
        page_number (Optional[int], optional): The page number of the slide to associate the file with. Defaults to None.
    Returns:
        tuple: A tuple containing the path where the file was saved and the content of the uploaded file.
    Raises:
        HTTPException: If there is an error during file upload, a 400 status code HTTPException is raised with the error details.
    """
    filename = file.filename
    name, extension = splitext(filename)
    
    try:
        upload_file = FileFactory()(file=file)
        hashed_file_name = f"{generate_hash(name, strategy='timestamp')}.{extension}"
        if slide_id is not None and page_number is not None:
            dir_path = get_slides_files_path(slide_id, page_number)
        else:
            dir_path = get_chat_files_path(chat_id)
        path = os.path.join(dir_path, hashed_file_name)
        upload_file.save(path)
        path = upload_file.path
        file_content = upload_file.content()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return path, file_content


def update_metadata(metadata_path, new_metadata):
    """
    Updates the metadata file with new metadata. If the file exists, it appends the new metadata to the existing data.
    If the file does not exist, it creates a new file with the new metadata.

    Args:
        metadata_path (str): The path to the metadata file.
        new_metadata (dict): The new metadata to be added.

    Raises:
        HTTPException: If there is an error during loading or saving the metadata, a 500 status code HTTPException is raised with the error details.
    """
    if os.path.exists(metadata_path):
        with open(metadata_path, "r") as metadata_file:
            try:
                data = json.load(metadata_file)
                data.append(new_metadata)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Internal server error occurred during loading history metadata: {str(e)}")
    else:
        data = [new_metadata]
    
    with open(metadata_path, "w") as metadata_file:
        json.dump(data, metadata_file, indent=4)

