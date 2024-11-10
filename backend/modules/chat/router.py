from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File
import google.generativeai as genai
import shutil, os
import json, jsonpickle
from logger import logger
from middleware.filemanager import FileFactory
from database.dbmanager import ChatDB, CourseDB
from tools import generate_hash, splitext
from modules.chat.util import *
from modules.chat import CHATS_DIR
from middleware import FILES_DIR
from pydantic import BaseModel
from .chat_auth_client import chat_get_current_user
from . import SYSTEM_PROMPT, MODEL_VERSION, EXPLAIN_SLIDE_PROMPT, FLASHCARD_PROMPT, QUIZZES_PROMPT

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/create")
async def create_chat(course_id: int, chat_title: str, slides: UploadFile = File(None),
                      current_user: dict = Depends(chat_get_current_user)):
    """
    Create a new chat for a course.

    Args:
        course_id (int): The ID of the course.
        chat_title (str): The title of the chat.
        slides (UploadFile, optional): The slides file for the chat. Defaults to None.
        current_user (dict, optional): The current user. Defaults to Depends(chat_get_current_user).

    Returns:
        dict: A dictionary containing the chat ID and a success message.

    Raises:
        HTTPException: If the course is not found or the user is not authorized to create the chat.
        HTTPException: If the file extension is invalid.

    """
    
    course = CourseDB.fetch(course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")
    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")
    
    chat = ChatDB.create(course_id=course_id, chat_title=chat_title, slides_mode=bool(slides))
    history_fname, _ = prepare_chat_file_names(current_user["user_id"], course_id, chat["chat_id"])
    history_url = os.path.join(CHATS_DIR, history_fname) # chat history file path

    slides_furl, slides_fname = None, None # initialize the slides name and URL
    if slides: # then it means we're creating a chat in slides mode
        slides_fname = slides.filename
        name, extension = splitext(slides_fname) # split name and extension, e.g. myfile.pdf -> (myfile, pdf)
        if extension not in ["pptx", "pdf"]:
            ChatDB.delete(chat["chat_id"])
            raise HTTPException(status_code=400, detail=f"Invalid file extension: {extension}")
        
        storage_dir = get_chat_folder_path(chat["chat_id"]) # construct the storage directory
        os.makedirs(storage_dir, exist_ok=True) # create a directory to store the chat's files
        slides_furl = os.path.join(storage_dir, f"{generate_hash(name, strategy="uuid")}.{extension}") # construct the file path
        
        try:
            file = FileFactory()(file=slides)
            file.save(slides_furl) # save the file in file system
            generator = slide_generator(slides_furl) # create a generator object to yield slides one by one
            dumped_generator = jsonpickle.encode(generator) # dump the generator object into a string

            dumped_generator_path = get_generator_path(slides_furl) # path of the jsonpickle dumped generator object
            with open(dumped_generator_path, "w") as file:
                file.write(dumped_generator)

        # Rollback changes
        except ValueError as e: # If the file extension is invalid (file manager can't handle it)
            ChatDB.delete(chat_id=chat["chat_id"])
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e: # Unsupported platform in slide_generator call
            ChatDB.delete(chat_id=chat["chat_id"])
            shutil.rmtree(storage_dir) # "rm -rf chat_<chat_id>", remove the directory and its contents
            raise HTTPException(status_code=500, detail=str(e))

    ChatDB.update(chat["chat_id"], history_url=history_url, slides_fname=slides_fname,
                  slides_furl=slides_furl) # Update the chat in the database
    
    chat["slides_furl"] = slides_furl
    chat["slides_fname"] = slides_fname
    return {"chat": chat, "message": "Chat created successfully."}


@router.get("/{chat_id}")
async def get_chat(chat_id: int, current_user: dict = Depends(chat_get_current_user)):
    """
    Retrieve a chat by its ID and return the chat details along with its history.

    Args:
        chat_id (int): The ID of the chat to retrieve.
        current_user (dict, optional): The current user's information. Defaults to Depends(chat_get_current_user).

    Returns:
        dict: A dictionary containing the chat details and its history.

    Raises:
        HTTPException: If the chat is not found or the user is not authorized to access the chat.
    """
    
    logger.info(f"Fetching chat with ID: {chat_id}")
    
    # Fetch the chat by its ID
    chat = ChatDB.fetch(chat_id=chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    
    logger.info(f"Chat found: {chat}")
    
    # Fetch the course associated with the chat and check if the user is authorized to access it
    course = CourseDB.fetch(course_id=chat["course_id"])
    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")
    
    logger.info(f"Course found: {course}")
    
    # Get the chat history file name and metadata file name for the current user, course, and chat
    hist_file_name, metadata_file_name = prepare_chat_file_names(current_user["user_id"], 
                                                  course["course_id"], chat["chat_id"])

    # Construct the chat history file path and metadata file path
    # chat history file path
    chat_history_path = os.path.join(CHATS_DIR, hist_file_name) 
    # chat metadata file path
    metadata_path = os.path.join(CHATS_DIR, metadata_file_name)
    
    logger.info(f"Chat history file path: {chat_history_path}")
    logger.info(f"Chat metadata file path: {metadata_path}")

    metadata = {} # initialize metadata to an empty dictionary
    if os.path.exists(metadata_path):
        with open(metadata_path, "r") as file:
            metadata = {item['message_id']: item for item in json.load(file)}

    chat_content = None # set chat_content to None if no chat history yet
    if os.path.exists(chat_history_path):
        with open(chat_history_path, "r") as file:
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

    logger.info(f"Chat history: {messages}")

    chat["course_name"] = course["course_name"] # Add the course name to response
    chat["history"] = messages # Add the chat history to response
    return chat

@router.delete("/{chat_id}")
async def delete_chat(chat_id: int, current_user: dict = Depends(chat_get_current_user)):
    """
    Delete a chat by its ID.

    Args:
        chat_id (int): The ID of the chat to delete.
        current_user (dict, optional): The current user's information. Defaults to Depends(chat_get_current_user).

    Returns:
        dict: A message indicating the chat was successfully deleted.

    Raises:
        HTTPException: If the chat is not found or the user is not authorized to delete the chat.
    """
    
    chat = ChatDB.fetch(chat_id=chat_id)
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    
    course = CourseDB.fetch(course_id=chat["course_id"])
    
    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")
    
    history_fname, metadata_fname = prepare_chat_file_names(current_user["user_id"], course["course_id"], chat_id)
    history_path = os.path.join(CHATS_DIR, history_fname)
    metadata_path = os.path.join(CHATS_DIR, metadata_fname)

    if os.path.exists(history_path):
        os.remove(history_path)
    if os.path.exists(metadata_path):
        os.remove(metadata_path)
    if chat["slides_furl"] and os.path.exists(chat["slides_furl"]):
        shutil.rmtree(get_chat_folder_path(chat_id))
    if chat["slides_mode"] and chat["slides_furl"] and os.path.exists(get_generator_path(chat["slides_furl"])):
        os.remove(get_generator_path(chat["slides_furl"]))

    ChatDB.delete(chat_id=chat_id)
    return {"message": "Chat deleted successfully."}    


@router.put("/{chat_id}")
def update_chat(chat_id: int, chat_title: str, current_user: dict = Depends(chat_get_current_user)):
    """
    Update a chat's title by its ID.

    Args:
        chat_id (int): The ID of the chat to update.
        chat_title (str): The new title for the chat.
        current_user (dict, optional): The current user's information. Defaults to Depends(chat_get_current_user).

    Returns:
        dict: A dictionary containing the updated chat details.

    Raises:
        HTTPException: If the chat is not found or the user is not authorized to update the chat.
    """
    
    chat = ChatDB.fetch(chat_id=chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    
    course = CourseDB.fetch(course_id=chat["course_id"])
    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")
    
    ChatDB.update(chat_id=chat_id, chat_title=chat_title)
    chat["chat_title"] = chat_title
    return chat   
    

@router.get("/{chat_id}/next_slide")
def get_next_slide(chat_id: int, current_user: dict = Depends(chat_get_current_user)):
    """
    Get the next slide content for a given chat.

    Args:
        chat_id (int): The ID of the chat.
        current_user (User, optional): The current user. Defaults to Depends(chat_get_current_user).

    Returns:
        dict: The response containing the next slide content.

    Raises:
        HTTPException: If the user is not authorized or if the chat has no slides uploaded.
    """
    chat = ChatDB.fetch(chat_id=chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")

    course = CourseDB.fetch(course_id=chat["course_id"])
    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    slides_furl = chat["slides_furl"] # get the slides file URL
    if not slides_furl:
        raise HTTPException(status_code=404, detail="This chat has no slides uploaded.")

    dumped_generator_path = get_generator_path(slides_furl) # path of the jsonpickle dumped generator object

    with open(dumped_generator_path, "r") as file:
        generator = jsonpickle.decode(file.read()) # read the dumped generator object from the file

    try:
        content_url, content = next(generator) # get the next slide content
        history_url = chat["history_url"] # Get the chat history file path
        metadata_path = get_chat_metadata_path(history_url) # chat metadata file path

        chat_content = None # If the file doesn't exist (i.e. it's the very first message), set chat_content to None
        if os.path.exists(history_url):
            with open(history_url, "r") as file:
                chat_content = file.read() # Read the chat history from the file

        history = jsonpickle.decode(chat_content) if chat_content else [] # Decode the chat content from JSON

        data1 = {"message_id": len(history), "skip": True} # Skip the EXPLAIN_SLIDE_PROMPT message, we don't want to show it in the chat
        data2 = {"message_id": len(history) + 1, "media_url": content_url} # (len+1) for we want to draw it like the slide is uploaded by the LLM

        if os.path.exists(metadata_path):
            with open(metadata_path, "r") as file:
                try:
                    data = json.load(file)
                    data.extend([data1, data2])
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Internal server error occured: {str(e)}")
        else:
            data = [data1, data2]

        # Write the updated content back to the file
        with open(metadata_path, "w") as file:
            json.dump(data, file, indent=4)

        chat_model = genai.GenerativeModel(MODEL_VERSION, system_instruction=SYSTEM_PROMPT).start_chat(history=history) # Initialize the chat model with the chat history so far
        response = chat_model.send_message([EXPLAIN_SLIDE_PROMPT, content])

        with open(history_url, "w") as file:
            file.write(jsonpickle.encode(chat_model.history)) # Encode back the updated chat history

        with open(dumped_generator_path, "w") as file:
            file.write(jsonpickle.encode(generator)) # dump back the generator object to a string

        return {"text": response.text, "media_url": content_url, "details": "success"} # return the response in dictionary format

    except StopIteration:
        chat_update_data = {
            "slides_mode" : False
        }
        ChatDB.update(chat_id=chat_id, **chat_update_data)
        return {"details": "no slides"}


@router.post("/{chat_id}/send_message")
async def send_message(chat_id: int, text: str = Form(...), file: UploadFile = File(None),
                       current_user: dict = Depends(chat_get_current_user)):
    """
    Send a message in a chat and generate a response.

    Args:
        message (MessageCreationRequest): The message to be sent.
        current_user (dict): The current user's information.

    Returns:
        dict: The generated response in dictionary format.
    """
    chat = ChatDB.fetch(chat_id=chat_id) # Fetch the chat by its ID
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    
    course = CourseDB.fetch(course_id=chat["course_id"]) # Fetch the course associated with the chat
    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    file_content, prompt = None, text
    if file: # if file is uploaded to be sent to the LLM
        print("file uploaded: ", file.filename)
        filename = file.filename
        name, extension = splitext(filename) # split name and extension, e.g. myfile.pdf -> (myfile, pdf)

        try:
            file = FileFactory()(file=file)
            
            hashed_fname = f"{generate_hash(name, strategy="timestamp")}.{extension}" # e.g. <hashed_name>_<actual_name>.pdf
            os.makedirs(f"{FILES_DIR}/chat_{chat_id}", exist_ok=True) # create a directory for the chat's files
            path = os.path.join(FILES_DIR, f"chat_{chat_id}", hashed_fname) # construct the file path

            file.save(path) # save the file in file system
            file_content = file.content() # get the file from the file system

            # TODO: assuming the file is an image for now
            # o/w, we'll get TypeError: Could not create `Blob`, expected `Blob`, `dict` or an `Image` type(`PIL.Image.Image` or `IPython.display.Image`)
    
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    history_url = chat["history_url"] # Get the chat history file path
    chat_content = None # If the file doesn't exist (i.e. it's the very first message), set chat_content to None
    if os.path.exists(history_url): # if the history file exists
        with open(history_url, "r") as file:
            chat_content = file.read() # Read the chat history from the file

    history = jsonpickle.decode(chat_content) if chat_content else [] # Decode the chat content from JSON
    chat = genai.GenerativeModel(MODEL_VERSION, system_instruction=SYSTEM_PROMPT).start_chat(history=history) # Initialize the chat model with the chat history so far

    # TODO: streaming response
    if file_content:
        metadata = get_chat_metadata_path(history_url) # chat metadata file path
        new_data = {"message_id": len(history), "media_url": path}
    
        if os.path.exists(metadata):
            with open(metadata, "r") as file:
                try:
                    data = json.load(file)
                    data.append(new_data)
                except Exception as e:
                    file.delete() # delete the file from the file system
                    raise HTTPException(status_code=500, detail=f"Internal server error occured: {str(e)}")
        else:
            data = [new_data]

        # Write the updated content back to the file
        with open(metadata, "w") as file:
            json.dump(data, file, indent=4)

        response = chat.send_message([prompt, file_content])
    else:
        response = chat.send_message(prompt)

    history = jsonpickle.encode(chat.history, True) # Encode back the updated chat history to JSON
    with open(history_url, "w") as file: # Save the updated chat history to the chat file
        file.write(history)

    return {"text": response.text, "role": "model"}


@router.put("/{chat_id}/update_slides")
async def update_chat_slides(chat_id: int, slides: UploadFile = File(...),
                             current_user: dict = Depends(chat_get_current_user)):
    """
    Update the slides for a chat by its ID.

    Args:
        slides_mode:
        chat_id (int): The ID of the chat to update.
        slides (UploadFile): The new slides file to upload.
        current_user (dict, optional): The current user's information. Defaults to Depends(chat_get_current_user).

    Returns:
        dict: A dictionary containing the updated chat details.

    Raises:
        HTTPException: If the chat is not found or the user is not authorized to update the chat.
    """
    # Fetch the chat by its ID
    chat = ChatDB.fetch(chat_id=chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")

    # Fetch the course associated with the chat and check if the user is authorized to access it
    course = CourseDB.fetch(course_id=chat["course_id"])
    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    # Validate the file extension
    slides_fname = slides.filename
    name, extension = splitext(slides_fname)
    if extension not in ["pptx", "pdf"]:
        raise HTTPException(status_code=400, detail=f"Invalid file extension: {extension}")

    # Construct the storage directory and slides file URL
    storage_dir = get_chat_folder_path(chat_id)
    os.makedirs(storage_dir, exist_ok=True)
    slides_furl = os.path.join(storage_dir, f"{generate_hash(name, strategy='uuid')}.{extension}")

    try:
        # Save the new slides file to the server
        with open(slides_furl, "wb") as buffer:
            shutil.copyfileobj(slides.file, buffer)

        # Update the chat record with the new slides file information
        chat_update_data = {
            "slides_fname": slides_fname,
            "slides_furl": slides_furl,
            "slides_mode": True,
        }
        ChatDB.update(chat_id, **chat_update_data)

        # Regenerate the slides generator and save it
        generator = slide_generator(slides_furl)
        dumped_generator = jsonpickle.encode(generator)
        dumped_generator_path = get_generator_path(slides_furl)
        with open(dumped_generator_path, "w") as file:
            file.write(dumped_generator)

        return {"chat_id": chat_id, "slides_fname": slides_fname, "slides_furl": slides_furl,
                "slides_mode": True, "message": "Slides updated successfully."}

    except Exception as e:
        shutil.rmtree(storage_dir)
        raise HTTPException(status_code=500, detail=f"Internal server error occurred: {str(e)}")


@router.post("/{chat_id}/create_quiz")
async def create_quiz(chat_id: int, current_user: dict = Depends(chat_get_current_user)):
    chat = ChatDB.fetch(chat_id=chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")

    course = CourseDB.fetch(course_id=chat["course_id"])
    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    history_url = chat["history_url"] # Get the chat history file path
    if not os.path.exists(history_url):
        raise HTTPException(status_code=400, detail="No messages found in the chat history to generate quiz.")
    with open(history_url, "r") as file:
        history = jsonpickle.decode(file.read()) # Read the chat history from the file

    chat_model = genai.GenerativeModel(
        MODEL_VERSION, system_instruction=SYSTEM_PROMPT, 
        generation_config={"response_mime_type": "application/json"}
    ).start_chat(history=history)

    response = chat_model.send_message(QUIZZES_PROMPT)
    response_dict = json.loads(response.text)
    if not response_dict["success"]:
        raise HTTPException(status_code=500, detail="Failed to generate quiz.")
    
    data = response_dict["data"]
    if not validate_llm_quiz_response(data):
        raise HTTPException(status_code=500, detail="An error occurred while generating the quiz.")

    quizzes_base_path = get_quizzes_folder_path(chat_id)

    os.makedirs(quizzes_base_path, exist_ok=True)
    quiz_file_name = f"{generate_hash("", strategy='timestamp', human_readable=True)}.json"
    quiz_file_path = os.path.join(quizzes_base_path, quiz_file_name)

    with open(quiz_file_path, 'w') as file:
        json.dump(data, file, indent=4)
        
    return {"filename": splitext(quiz_file_name)[0], "quiz": data}

@router.post("/{chat_id}/create_flashcards")
async def create_flashcards(chat_id: int, current_user: dict = Depends(chat_get_current_user)):
    chat = ChatDB.fetch(chat_id=chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")

    course = CourseDB.fetch(course_id=chat["course_id"])
    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    history_url = chat["history_url"] # Get the chat history file path
    if not os.path.exists(history_url):
        raise HTTPException(status_code=400, detail="No messages found in the chat history to generate any flashcard.")
    with open(history_url, "r") as file:
        history = jsonpickle.decode(file.read()) # Read the chat history from the file

    chat_model = genai.GenerativeModel(
        MODEL_VERSION, system_instruction=SYSTEM_PROMPT, 
        generation_config={"response_mime_type": "application/json"}
    ).start_chat(history=history)

    response = chat_model.send_message(FLASHCARD_PROMPT)
    response_dict = json.loads(response.text)
    if not response_dict["success"]:
        raise HTTPException(status_code=500, detail="Failed to generate flashcards.")
    
    data = response_dict["data"]

    flashcards = [item["topic"] for item in data]
    explanations = [item["explanation"] for item in data]

    flashcards_base_path = get_flashcards_folder_path(chat_id)
    os.makedirs(flashcards_base_path, exist_ok=True)
    flashcards_file_name = f"{generate_hash("", strategy='timestamp', human_readable=True)}.json"

    flashcards_file_path = os.path.join(flashcards_base_path, flashcards_file_name)

    combined_data = {
        "flashcards": flashcards,
        "explanations": explanations
    }

    with open(flashcards_file_path, "w") as file:
        json.dump(combined_data, file, indent=4)

    return {"combined_data": combined_data}

@router.get("/{chat_id}/flashcards")
async def get_flashcards(chat_id: int, current_user: dict = Depends(chat_get_current_user)):
    """
    Get all flashcard JSONs for a specific chat.

    Args:
        chat_id (int): The ID of the chat.
        current_user (dict): The current authenticated user (used for authentication).

    Returns:
        list: A list of dictionaries, each containing the file name and flashcard content.
    """

    chat = ChatDB.fetch(chat_id=chat_id)

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    
    course = CourseDB.fetch(course_id=chat["course_id"])

    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    flashcards_path = get_flashcards_folder_path(chat["chat_id"])

    if not os.path.exists(flashcards_path):
        raise HTTPException(status_code=404, detail="Flashcards folder not found.")

    flashcards = []
    for filename in os.listdir(flashcards_path):
        if filename.endswith(".json"):
            with open(os.path.join(flashcards_path, filename), "r") as f:
                flashcard = json.load(f)
                flashcards.append({
                    "filename": filename,
                    "content": flashcard
                })

    return flashcards

@router.get("/{chat_id}/flashcards/{flashcard_name}")
async def get_flashcard(chat_id: int, flashcard_name: str, current_user: dict = Depends(chat_get_current_user)):
    """
    Get a specific flashcard JSON by its file name.

    Args:
        chat_id (int): The ID of the chat.
        flashcard_name (str): The name of the flashcard file (without the .json extension).
        current_user (dict): The current authenticated user (used for authentication).

    Returns:
        dict: A dictionary containing the file name and flashcard content.
    """

    chat = ChatDB.fetch(chat_id=chat_id)

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    
    course = CourseDB.fetch(course_id=chat["course_id"])

    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    flashcards_path = get_flashcards_folder_path(chat["chat_id"])

    if not os.path.exists(flashcards_path):
        raise HTTPException(status_code=404, detail="Flashcards folder not found.")

    file_path = os.path.join(flashcards_path, f"{flashcard_name}.json")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Flashcard not found.")

    with open(file_path, "r") as f:
        flashcard = json.load(f)

    return {
        "filename": f"{flashcard_name}.json",
        "content": flashcard
    }

class RenameFlashcardRequest(BaseModel):
    new_name: str

@router.put("/{chat_id}/flashcards/{flashcard_name}")
async def rename_flashcard(
    chat_id: int,
    flashcard_name: str,
    request: RenameFlashcardRequest,
    current_user: dict = Depends(chat_get_current_user)
):
    """
    Rename a specific flashcard file.

    Args:
        chat_id (int): The ID of the chat.
        flashcard_name (str): The current name of the flashcard file (without the .json extension).
        request (RenameFlashcardRequest): The request body containing the new name.
        current_user (dict): The current authenticated user (used for authentication).

    Returns:
        dict: A message indicating the flashcard was successfully renamed.
    """

    new_name = request.new_name

    chat = ChatDB.fetch(chat_id=chat_id)

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    
    course = CourseDB.fetch(course_id=chat["course_id"])

    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    flashcards_path = get_flashcards_folder_path(chat["chat_id"])

    if not os.path.exists(flashcards_path):
        raise HTTPException(status_code=404, detail="Flashcards folder not found.")

    old_file_path = os.path.join(flashcards_path, f"{flashcard_name}.json")
    new_file_path = os.path.join(flashcards_path, f"{new_name}.json")

    if not os.path.exists(old_file_path):
        raise HTTPException(status_code=404, detail="Flashcard not found.")

    if os.path.exists(new_file_path):
        raise HTTPException(status_code=400, detail="A flashcard with the new name already exists.")

    os.rename(old_file_path, new_file_path)

    return {"message": f"Flashcard '{flashcard_name}.json' has been successfully renamed to '{new_name}.json'."}

@router.delete("/{chat_id}/flashcards")
async def delete_all_flashcards(chat_id: int, current_user: dict = Depends(chat_get_current_user)):
    """
    Delete all flashcard files inside the folder without deleting the folder.

    Args:
        chat_id (int): The ID of the chat.
        current_user (dict): The current authenticated user (used for authentication).

    Returns:
        dict: A message indicating all flashcards were successfully deleted.
    """

    chat = ChatDB.fetch(chat_id=chat_id)

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    
    course = CourseDB.fetch(course_id=chat["course_id"])

    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    flashcards_path = get_flashcards_folder_path(chat["chat_id"])

    if not os.path.exists(flashcards_path):
        raise HTTPException(status_code=404, detail="Flashcards folder not found.")

    if not os.listdir(flashcards_path):
        return {"message": "No flashcards to delete; the folder is already empty."}

    for filename in os.listdir(flashcards_path):
        name, ext = os.path.splitext(filename)
        file_path = os.path.join(flashcards_path, f"{name}.json")
        os.remove(file_path)
        print(file_path)
        
        

    return {"message": "All flashcards have been successfully deleted."}

@router.delete("/{chat_id}/flashcards/{flashcard_name}")
async def delete_flashcard(chat_id: int, flashcard_name: str, current_user: dict = Depends(chat_get_current_user)):
    """
    Delete a specific flashcard by its file name.

    Args:
        chat_id (int): The ID of the chat.
        flashcard_name (str): The name of the flashcard file (without the .json extension).
        current_user (dict): The current authenticated user (used for authentication).

    Returns:
        dict: A message indicating the flashcard was successfully deleted.
    """

    chat = ChatDB.fetch(chat_id=chat_id)

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    
    course = CourseDB.fetch(course_id=chat["course_id"])
    
    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    flashcards_path = get_flashcards_folder_path(chat["chat_id"])

    if not os.path.exists(flashcards_path):
        raise HTTPException(status_code=404, detail="Flashcards folder not found.")

    file_path = os.path.join(flashcards_path, f"{flashcard_name}.json")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Flashcard not found.")

    os.remove(file_path)

    return {"message": f"Flashcard '{flashcard_name}.json' has been successfully deleted."}