from typing import Optional
import asyncio
import tempfile
import pymupdf, os, io, json, jsonpickle, base64
from PIL import Image

from fastapi import HTTPException, UploadFile

from chat_service.app.clients import course
from chat_service.app.database.dbmanager import SlideDB, ChatDB

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


def get_authorized_chat_and_course(chat_id: int, user_id: int):
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
    chat = ChatDB.fetch(chat_id=chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    
    course_dict = course.get_course(course_id=chat["course_id"])
    if not course_dict:
        raise HTTPException(status_code=404, detail="Course not found.")
    
    if course_dict["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden.")
    
    return chat, course_dict


def init_chat(history_content=None):
    """
    Initializes a chat session with a generative AI model.

    Args:
        history_content (str, optional): A jsonpickle-encoded string representing the chat history. 
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
    page_number is 1-based, not 0-based.
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


def get_formatted_history(history_path, history_metadata_path):
    """
    Retrieves and formats chat history from specified file paths.
    Args:
        history_path (str): The file path to the chat history file.
        history_metadata_path (str): The file path to the chat metadata file.
    Returns:
        list: A list of dictionaries, each containing the following keys:
            - 'text' (str): The text of the chat message.
            - 'role' (str): The role of the message sender (model | user).
            - 'message_id' (int): The ID of the chat message.
            - 'media_url' (str, optional): The URL of any media attached to the message.
    """
    metadata = {} # initialize metadata to an empty dictionary
    if os.path.exists(history_metadata_path):
        with open(history_metadata_path, "r") as file:
            metadata = {item['message_id']: item for item in json.load(file)}

    chat_content = None # set chat_content to None if no chat history yet
    if os.path.exists(history_path):
        with open(history_path, "r") as file:
            chat_content = file.read() # Read the chat history from the file
    
    history = jsonpickle.decode(chat_content) if chat_content else [] # Decode the chat content from JSON

    # parse the chat history and create a new dictionary with 'message' and 'role' keys
    messages = []
    for idx, content in enumerate(history):
        if idx in metadata and metadata[idx].get('skip', False): # metadata says skip this message
            continue

        for part in content._pb.parts: # Google's protobuf message parts
            # Create a dictionary with the message, role, and ID of the chat
            chat_dict = {"text": part.text, "role": content._pb.role, "message_id": idx}

            if idx in metadata and 'media_url' in metadata[idx]: # a file is attached to this message
                chat_dict['media_url'] = metadata[idx]['media_url']

            if not messages or chat_dict["message_id"] != messages[-1]["message_id"]: # to remove duplicates, if any
                messages.append(chat_dict)

    return messages


def image_to_base64(image: Image.Image) -> str:
    """
    Convert a PIL Image to a base64 encoded string.

    Args:
        image (Image.Image): The PIL Image to be converted.

    Returns:
        str: The base64 encoded string representation of the image.
    """
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")
