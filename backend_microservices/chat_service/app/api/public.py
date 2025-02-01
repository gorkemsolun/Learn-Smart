from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File
import shutil, os, glob, json, jsonpickle, itertools

from chat_service.app.clients import user, course, filemanager
from chat_service.app.database.session import get_db

from chat_service.app.database.dbmanager import (
    ChatDB, SlideDB, SlidePageDB, QuizDB, FlashcardDB
)
from chat_service.app.util import *

from chat_service.app.schemas import RenameFlashcardRequest
from chat_service.app.database.session import get_db

router = APIRouter(prefix="/public", tags=["Chat - Public API"])

# Course
@router.get("/course/{course_id}/chats")
async def get_chats_of_course(course_id: int,
                              current_user: dict = Depends(user.get_current_user),
                              db: Session = Depends(get_db)):
        """
        Get all chats for a specific course.
    
        Args:
            course_id (int): The ID of the course.
    
        Returns:
            list: A list of dictionaries, each containing the chat details.
    
        Raises:
            HTTPException: If the course is not found or the user is not authorized to access the chats.
        """
        courses = await course.get_user_courses(current_user["user_id"])
        if course_id not in [course["course_id"] for course in courses]:
            raise HTTPException(status_code=403, detail="Forbidden - not authorized to access the chats.")
        
        chats = ChatDB.fetch(db, course_id=course_id, all=True)
        return chats


@router.get("/course/{course_id}/quizzes")
async def get_quizzes_of_course(course_id: int,
                                current_user: dict = Depends(user.get_current_user),
                                db: Session = Depends(get_db)):
    """
    Get all quizzes for a specific course.

    Args:
        course_id (int): The ID of the course.

    Returns:
        list: A list of dictionaries, each containing the quiz details.

    Raises:
        HTTPException: If the course is not found or the user is not authorized to access the quizzes.
    """
    courses = await course.get_user_courses(current_user["user_id"])
    if course_id not in [course["course_id"] for course in courses]:
        raise HTTPException(status_code=403, detail="Forbidden.")
    
    chats = ChatDB.fetch(db, course_id=course_id, all=True)

    ret = []
    for chat in chats:
        quizzes = QuizDB.fetch(db, chat_id=chat["chat_id"], all=True)
        ret.append({
            "chat_id": chat["chat_id"],
            "chat_title": chat["chat_title"],
            "quizzes": quizzes
        })
    
    return ret


# Chat
@router.get("/chat/{chat_id}/info")
async def get_chat_info(chat_id: int,
                        current_user: dict = Depends(user.get_current_user),
                        db: Session = Depends(get_db)):
    """
    Get the details of a specific chat by its ID.

    Args:
        chat_id (int): The ID of the chat to retrieve.

    Returns:
        dict: A dictionary containing the chat details.

    Raises:
        HTTPException: If the chat is not found or the user is not authorized to access the chat.
    """
    chat = ChatDB.fetch(db, chat_id=chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    
    courses = await course.get_user_courses(current_user["user_id"])
    if chat["course_id"] not in [course["course_id"] for course in courses]:
        raise HTTPException(status_code=403, detail="Forbidden.")
    
    return chat


@router.get("/chat/{chat_id}/quizzes")
async def get_quizzes_of_chat(chat_id: int, 
                              current_user: dict = Depends(user.get_current_user),
                              db: Session = Depends(get_db)):
    """
    Get all quizzes for a specific chat.

    Args:
        chat_id (int): The ID of the chat.

    Returns:
        list: A list of dictionaries, each containing the quiz details.

    Raises:
        HTTPException: If the course is not found or the user is not authorized to access the quizzes.
    """
    chat = ChatDB.fetch(db, chat_id=chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    
    courses = await course.get_user_courses(current_user["user_id"])
    if chat["course_id"] not in [course["course_id"] for course in courses]:
        raise HTTPException(status_code=403, detail="Forbidden.")
    
    quizzes = QuizDB.fetch(db, chat_id=chat_id, all=True)
    return quizzes


@router.post("/chat/create")
async def create_chat(course_id: int, chat_title: str, slides: UploadFile = File(None),
                      current_user: dict = Depends(user.get_current_user),
                      db: Session = Depends(get_db)):
    """
    Create a new chat for a course.

    Args:
        course_id (int): The ID of the course.
        chat_title (str): The title of the chat.
        slides (UploadFile, optional): The slides file for the chat. Defaults to None.
        current_user (dict, optional): The current user. Defaults to Depends(auth.get_current_user).

    Returns:
        dict: A dictionary containing the chat ID and a success message.

    Raises:
        HTTPException: If the course is not found or the user is not authorized to create the chat.
        HTTPException: If the file extension is invalid.

    """
    
    course_dict = course.get_course(course_id)
    if not course_dict:
        raise HTTPException(status_code=404, detail="Course not found.")
    if course_dict["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")
    
    slides_fid, last_opened_slide_id = None, None
    if slides: # we're creating a chat in slides mode
        if slides.content_type not in ([
            'application/pdf', 
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ]):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Only .pptx and .pdf files are allowed."
            )
        
        content = await slides.read()
        final_filename = splitext(slides.filename)[0] + '.pdf' # convert to PDF if it's a PPTX file

        if slides.content_type == 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
            pdf_content = await convert_pptx_to_pdf(content)
        else:
            pdf_content = content

        # Get page count
        with pymupdf.open(stream=pdf_content, filetype="pdf") as doc:
            page_count = doc.page_count

        # Prepare UploadFile
        pdf_file_io = io.BytesIO(pdf_content)
        pdf_file_io.seek(0)
        converted_file = UploadFile(
            filename=final_filename,
            file=pdf_file_io,
            content_type='application/pdf'
        )

        slides_fid = await filemanager.upload(file=converted_file, user_id=current_user["user_id"])

        slide_dict = SlideDB.create(
            chat_id=chat["chat_id"], slides_file_name=slides.filename, slides_fid=slides_fid, 
            pages_count=page_count, last_slide_number=1
        )
        slide_dict.pop("chat_id")
        
        last_opened_slide_id = slide_dict["slide_id"]

    chat = ChatDB.create(
        db, course_id=course_id, chat_title=chat_title, slides_mode=bool(slides), 
        slides_fid=slides_fid, last_opened_slide_id=last_opened_slide_id
    )

    if slides:
        chat["slides"] = [slide_dict]

    return {"chat": chat, "message": "Chat created successfully."}


# Quiz
@router.get("/quiz/{quiz_id}")
async def get_quiz(quiz_id: int,
                   current_user: dict = Depends(user.get_current_user),
                   db: Session = Depends(get_db)):
    """
    Get the details of a specific quiz by its ID.

    Args:
        quiz_id (int): The ID of the quiz to retrieve.

    Returns:
        dict: A dictionary containing the quiz details.

    Raises:
        HTTPException: If the quiz is not found or the user is not authorized to access the quiz.
    """
    quiz = QuizDB.fetch(db, quiz_id=quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")
    
    chat = ChatDB.fetch(db, chat_id=quiz["chat_id"])
    courses = await course.get_user_courses(current_user["user_id"])
    if chat["course_id"] not in [course["course_id"] for course in courses]:
        raise HTTPException(status_code=403, detail="Forbidden.")
    
    fid = quiz["quiz_fid"] # file ID of the quiz

    quiz_bytes = await filemanager.download(file_id=fid)
    quiz_dict = json.loads(quiz_bytes.decode('utf-8'))

    return quiz_dict


@router.put("/quiz/{quiz_id}")
async def rename_quiz(quiz_id: int,
                      new_title: str,
                      current_user: dict = Depends(user.get_current_user),
                      db: Session = Depends(get_db)):
    """
    Rename a quiz by its ID.

    Args:
        quiz_id (int): The ID of the quiz to rename.
        new_title (str): The new title for the quiz.

    Returns:
        dict: A dictionary containing the updated quiz details.

    Raises:
        HTTPException: If the quiz is not found or the user is not authorized to rename the quiz.
    """
    quiz = QuizDB.fetch(db, quiz_id=quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")
    
    chat = ChatDB.fetch(db, chat_id=quiz["chat_id"])
    courses = await course.get_user_courses(current_user["user_id"])
    if chat["course_id"] not in [course["course_id"] for course in courses]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    updated_quiz = QuizDB.update(db, quiz_id=quiz_id, quiz_title=new_title)
    return {"status": "success", "quiz": updated_quiz}


@router.delete("/quiz/{quiz_id}")
async def delete_quiz(quiz_id: int,
                      current_user: dict = Depends(user.get_current_user),
                      db: Session = Depends(get_db)):
        """
        Delete a quiz by its ID.
    
        Args:
            quiz_id (int): The ID of the quiz to delete.
    
        Returns:
            dict: A message indicating the quiz was successfully deleted.
    
        Raises:
            HTTPException: If the quiz is not found or the user is not authorized to delete the quiz.
        """
        quiz = QuizDB.fetch(db, quiz_id=quiz_id)
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found.")
        
        chat = ChatDB.fetch(db, chat_id=quiz["chat_id"])
        courses = await course.get_user_courses(current_user["user_id"])
        if chat["course_id"] not in [course["course_id"] for course in courses]:
            raise HTTPException(status_code=403, detail="Forbidden.")
    
        QuizDB.delete(db, quiz_id=quiz_id)
        await filemanager.delete(quiz["quiz_fid"])

        return {"status": "success", "message": "Quiz deleted successfully."}














@router.get("/{chat_id}")
async def get_chat(chat_id: int, 
                   current_user: dict = Depends(auth.get_current_user),
                   db: Session = Depends(get_db)):    
    """
    Get the details of a specific chat by its ID.

    Args:
        chat_id (int): The ID of the chat to retrieve.
        current_user (dict, optional): The current user's information. Defaults to Depends(auth.get_current_user).

    Returns:
        dict: A dictionary containing the chat details, including history or slides.
        If the chat history is not in slides-mode, the entire chat history is returned in the dict.
        Otherwise, the slides information are returned in the dict.

    Raises:
        HTTPException: If the chat is not found or the user is not authorized to access the chat.
    """

    # TODO: convert this to gRPC call
    chat, course = fetch_chat_and_course(chat_id, current_user["user_id"])
    chat_history_path, metadata_path = get_chat_history_path(chat_id), get_chat_history_metadata_path(chat_id)
    
    if not chat["slides_mode"]:
        # TODO: gRPC call from FileManager service
        messages = get_formatted_history(chat_history_path, metadata_path)
        chat["course_name"] = course["course_name"]
        chat["history"] = messages
        return chat
    
    slides = SlideDB.fetch(db, chat_id=chat_id, all=True)
    if not slides: # this should never happen in a slides-mode chat
        raise HTTPException(status_code=404, detail="Slides not found.")
    
    for slide in slides:
        slide.pop("chat_id")
        slide.pop("slides_file_url")

    chat.pop("history_url") # in slides mode, history_url is not used
    chat["slides"] = slides
    return chat


@router.delete("/{chat_id}")
async def delete_chat(chat_id: int, 
                      current_user: dict = Depends(auth.get_current_user),
                      db: Session = Depends(get_db)):
    """
    Delete a chat by its ID.

    Args:
        chat_id (int): The ID of the chat to delete.
        current_user (dict, optional): The current user's information. Defaults to Depends(auth.get_current_user).

    Returns:
        dict: A message indicating the chat was successfully deleted.

    Raises:
        HTTPException: If the chat is not found or the user is not authorized to delete the chat.
    """
    
    # TODO: convert this to gRPC call
    chat, _ = fetch_chat_and_course(chat_id, current_user["user_id"])
    
    if not chat["slides_mode"]:
        # TODO: gRPC call from FileManager service
        history_path, metadata_path = get_chat_history_path(chat_id), get_chat_history_metadata_path(chat_id)

        # TODO: gRPC call from FileManager service
        if os.path.exists(history_path):
            os.remove(history_path)
        if os.path.exists(metadata_path):
            os.remove(metadata_path)
            
    files_dir = get_chat_files_path(chat_id)
    if os.path.exists(files_dir):
        shutil.rmtree(files_dir)

    if chat["slides_mode"]:
        # delete files of slides and all the chat histories and metadata
        slides = SlideDB.fetch(db, chat_id=chat_id, all=True)
        slide_ids = [slide["slide_id"] for slide in slides]

        # TODO: This logic is to be implemented by FileManager service
        for slide_id in slide_ids:
        # Delete files in chat_histories directory
            history_files = glob.glob(get_slide_history_path(slide_id, "*"))
            metadata_files = glob.glob(get_slide_history_metadata_path(slide_id, "*"))
            for history_path, metadata_path in zip(history_files, metadata_files):
                if os.path.exists(history_path):
                    os.remove(history_path)
                if os.path.exists(metadata_path):
                    os.remove(metadata_path)

            # Delete folders in files directory
            slide_dirs = glob.glob(get_slides_files_path(slide_id, "*"))
            for slide_dir in slide_dirs:
                if os.path.exists(slide_dir):
                    shutil.rmtree(slide_dir)

        SlideDB.delete(db, chat_id=chat_id, all=True)

    ChatDB.delete(db, chat_id=chat_id)
    return {"message": "Chat deleted successfully."}    


@router.put("/{chat_id}")
def update_chat_title(chat_id: int, chat_title: str, 
                      current_user: dict = Depends(auth.get_current_user),
                      db: Session = Depends(get_db)):
    """
    Update a chat's title by its ID.

    Args:
        chat_id (int): The ID of the chat to update.
        chat_title (str): The new title for the chat.
        current_user (dict, optional): The current user's information. Defaults to Depends(auth.get_current_user).

    Returns:
        dict: A dictionary containing the updated chat details.

    Raises:
        HTTPException: If the chat is not found or the user is not authorized to update the chat.
    """
    
    # TODO: convert this to gRPC call
    chat, course = fetch_chat_and_course(chat_id, current_user["user_id"])
    
    ChatDB.update(db, chat_id=chat_id, chat_title=chat_title)
    chat["chat_title"] = chat_title # this might be redundant
    return chat   


# TODO: The entire logic of this endpoint is to be implemented by LLMService
# What this endpoint should do is solely making a call to LLMService and returning the response
@router.post("/{chat_id}/send_message")
async def send_message(chat_id: int, slide_id: int = None, page_number: int = None,
                       text: str = Form(...), file: UploadFile = File(None),
                       current_user: dict = Depends(auth.get_current_user),
                       db: Session = Depends(get_db)):
    """
    Send a message in a chat and generate a response.

    Args:
        chat_id (int): The ID of the chat to send the message.
        slide_id (int, optional): The ID of the slide. Defaults to None.
        page_number (int, optional): The page number of the slide. Defaults to None.
        text (str): The user message to send.
        file (UploadFile, optional): The file to send. Defaults to None.
        current_user (dict, optional): The current user's information. Defaults to Depends(auth.get_current_user).
        db (Session): The database session. 
    Returns:
        dict: The generated response in dictionary format.
    """

    # TODO: streaming response
    # TODO: prompt engineering in slides mode
    chat, _ = fetch_chat_and_course(chat_id, current_user["user_id"])
    
    if slide_id is None and chat["slides_mode"]:
        raise HTTPException(status_code=400, detail="Slide ID is required for this chat.")
    
    if slide_id is not None and not chat["slides_mode"]:
        raise HTTPException(status_code=400, detail="Slides mode is not enabled for this chat.")

    if slide_id is not None and chat["slides_mode"]: # Slide specific chat
        if page_number is None:
            raise HTTPException(status_code=400, detail="Slide page number is required.")
        
        slide = SlideDB.fetch(db, slide_id=slide_id)
        if not slide:
            raise HTTPException(status_code=404, detail="Slides not found.")
        
        if page_number <= 0 or page_number > slide["pages_count"]:
            raise HTTPException(status_code=400, detail="Invalid slide number.")
        
        slide_history_path, slide_metadata_path = get_slide_history_path(slide_id, page_number), get_slide_history_metadata_path(slide_id, page_number)

        raw_history_content = None # decoded content
        if os.path.exists(slide_history_path):
            with open(slide_history_path, "r") as slide_history_file:
                raw_history_content = slide_history_file.read()
    
        model = init_chat(raw_history_content)
        slide_content = get_slide_content(slide_id, page_number)

        # TODO: LLM Service calls
        """ TODO:
        history + message + any files uploaded => LLMService => response + new history
        """
        """ if file:
            path, file_content = handle_file_upload_for_message(file, chat_id, slide_id, page_number)
            new_metadata = {"message_id": len(model.history), "media_url": path}
            update_metadata(slide_metadata_path, new_metadata)
            response = model.send_message([text, file_content, slide_content])

        else:
            response = model.send_message([text, slide_content]) """

        history = jsonpickle.encode(model.history, True) 
        save_history(slide_history_path, history)

        ChatDB.update(chat_id=chat_id, last_opened_slide_id=slide_id)
        return {"text": response.text, "role": "model"}
    
    history_path, metadata_path = get_chat_history_path(chat_id), get_chat_history_metadata_path(chat_id) 
    raw_history_content = None
    if os.path.exists(history_path):
        with open(history_path, "r") as history_file:
            raw_history_content = history_file.read()

    model = init_chat(raw_history_content)

    if file:
        path, file_content = handle_file_upload_for_message(file, chat_id)
        new_metadata = {"message_id": len(model.history), "media_url": path}
        update_metadata(metadata_path, new_metadata)
        response = model.send_message([text, file_content])
    else:
        response = model.send_message(text)

    history = jsonpickle.encode(model.history, True) # Encode back the updated chat history
    save_history(history_path, history) 

    if not os.path.exists(history_path):
        ChatDB.update(chat_id=chat_id, history_url=history_path)

    ChatDB.update(chat_id=chat_id, last_opened_slide_id=slide_id)
    return {"text": response.text, "role": "model"}


@router.get("/slides/{slide_id}")
async def get_slide_info(slide_id: int, 
                         current_user: dict = Depends(auth.get_current_user),
                         db: Session = Depends(get_db)):
    """
    Get the details of a specific slide by its ID.

    Args:
        slide_id (int): The ID of the slide to retrieve.
        current_user (dict, optional): The current user's information. Defaults to Depends(auth.get_current_user).

    Returns:
        dict: A dictionary containing the slide details.

    Raises:
        HTTPException: If the slide is not found or the user is not authorized to access the slide.
    """
    
    slide = SlideDB.fetch(db, slide_id=slide_id)
    if not slide:
        raise HTTPException(status_code=404, detail="Slide not found.")
    
    # TODO: convert this to gRPC call
    fetch_chat_and_course(slide["chat_id"], current_user["user_id"])

    return slide

@router.get("/{chat_id}/slide/{slide_id}/page/{page_number}")
async def get_slide(chat_id: int, slide_id: int, page_number: int, 
                    current_user: dict = Depends(auth.get_current_user),
                    db: Session = Depends(get_db)):
    """
    Get a specific slide and its explanation by its ID and page number.
    """
    # TODO: convert this to gRPC call
    fetch_chat_and_course(chat_id, current_user["user_id"])

    slide = SlideDB.fetch(db, slide_id=slide_id)
    if not slide:
        raise HTTPException(status_code=404, detail="Slide not found.")

    if page_number <= 0 or page_number > slide["pages_count"]:
        raise HTTPException(status_code=400, detail="Invalid slide number.")
    
    # TODO: The rest of the logic is to be implemented by LLMService and FileManager service
    # What should've been done here is to make a call to LLMService and FileManager service and return the response
    """slide_history_path, slide_metadata_path = get_slide_history_path(slide_id, page_number), get_slide_history_metadata_path(slide_id, page_number)
    slide_content = get_slide_content(slide_id, page_number)
    slide_base64 = image_to_base64(slide_content)

    # if slide history path doesn't exists, it means an explanation is not generated yet
    if not os.path.exists(slide_history_path):
        model = init_chat()
        response = model.send_message([EXPLAIN_SLIDE_PROMPT, slide_content]).text
        
        metadata_path = get_slide_history_metadata_path(slide_id, page_number)
        new_metadata = {"message_id": 0, "skip": True} # skip the EXPLAIN_SLIDE_PROMPT
        update_metadata(metadata_path, new_metadata)
        
        history = jsonpickle.encode(model.history, True)
        save_history(slide_history_path, history)

        SlideDB.update(slide_id, last_slide_number=page_number)
        return {
            "slide": slide_base64,
            "history": [{"text": response, "role": "model", "message_id": 1}]
        }
    
    messages = get_formatted_history(slide_history_path, slide_metadata_path)
    
    SlideDB.update(slide_id, last_slide_number=page_number)
    ChatDB.update(chat_id=chat_id, last_opened_slide_id=slide_id)
    return {"slide": slide_base64,
            "history": messages
    }"""


@router.put("/{chat_id}/update_slides")
async def update_chat_slides(chat_id: int, slides: UploadFile = File(...),
                             current_user: dict = Depends(auth.get_current_user),
                             db: Session = Depends(get_db)):
    """
    Update the slides for a chat by its ID.

    Args:
        chat_id (int): The ID of the chat to update.
        slides (UploadFile): The new slides file to upload.
        current_user (dict, optional): The current user's information. Defaults to Depends(auth.get_current_user).

    Returns:
        dict: A dictionary containing the updated chat details.

    Raises:
        HTTPException: If the chat is not found or the user is not authorized to update the chat.
    """
    # TODO: convert this to gRPC call
    chat, _ = fetch_chat_and_course(chat_id, current_user["user_id"])

    if not chat["slides_mode"]:
        raise HTTPException(status_code=400, detail="Slides mode is not enabled for this chat.")

    # Validate the file extension
    slides_file_name = slides.filename
    name, extension = splitext(slides_file_name)
    if extension.lower() not in ["pptx", "pdf"]:
        raise HTTPException(status_code=400, detail=f"Invalid file extension: {extension}")

    # Construct the storage directory and slides file URL
    # TODO: FileManager service
    storage_dir = get_chat_files_path(chat_id)
    slides_file_url = os.path.join(storage_dir, f"{generate_hash(name, strategy='uuid')}.{extension}")

    try:
        uploaded_file = FileFactory()(file=slides)
        uploaded_file.save(slides_file_url)
        slides_file_url = uploaded_file.path

        pages_count = 0
        with uploaded_file.get() as pdf:    
            pages_count = pdf.page_count

        # Update the chat record with the new slides file information
        new_slide = SlideDB.create(db, chat_id=chat_id, slides_file_name=slides_file_name, 
                        slides_file_url=slides_file_url, pages_count=pages_count, 
                        last_slide_number=1)
        slides = SlideDB.fetch(db, chat_id=chat_id, all=True)
        ChatDB.update(db, chat_id=chat_id, last_opened_slide_id=new_slide["slide_id"])
        chat["slides"] = slides
        return {"chat": chat, "message": "Slides updated successfully."}

    except Exception as e:
        shutil.rmtree(storage_dir)
        raise HTTPException(status_code=500, detail=f"Internal server error occurred: {str(e)}")


@router.post("/{chat_id}/create_quiz")
async def create_quiz(chat_id: int, 
                      current_user: dict = Depends(auth.get_current_user),
                      db: Session = Depends(get_db)):
    # TODO: convert this to gRPC call
    chat, _ = fetch_chat_and_course(chat_id, current_user["user_id"])
    if chat["slides_mode"]:
        slides = SlideDB.fetch(db, chat_id=chat_id, all=True)
        slide_ids = [slide["slide_id"] for slide in slides]

        # TODO: FileManager service
        history_paths = [glob.glob(get_slide_history_path(slide_id, "*")) for slide_id in slide_ids]
        history_paths = list(itertools.chain(*history_paths))
        history_paths = sorted(history_paths)
        
        if len(history_paths) == 0:
            raise HTTPException(status_code=400, detail="No messages found in the chat history to generate quiz.")
        history = []
        for history_path in history_paths:
            with open(history_path, "r") as file:
                history.extend(jsonpickle.decode(file.read()))
    else:
        history_url = get_chat_history_path(chat_id)
        if not os.path.exists(history_url):
            raise HTTPException(status_code=400, detail="No messages found in the chat history to generate quiz.")
        with open(history_url, "r") as file:
            history = jsonpickle.decode(file.read())

    # TODO: LLM service
    model = genai.GenerativeModel(
        MODEL_VERSION, system_instruction=SYSTEM_PROMPT, 
        generation_config={"response_mime_type": "application/json"}
    ).start_chat(history=history)

    # TODO: the weird thing is, model only generates quizzes for the last slide set it explained unless prompted explicitly 
    # we need extra prompt engineering
    # TODO: FileManager service & LLM service
    response = model.send_message([QUIZZES_PROMPT])
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
async def create_flashcards(chat_id: int, 
                            current_user: dict = Depends(auth.get_current_user),
                            db: Session = Depends(get_db)):
    # TODO: convert this to gRPC call
    chat, _ = fetch_chat_and_course(chat_id, current_user["user_id"])
    if chat["slides_mode"]:
        slides = SlideDB.fetch(db, chat_id=chat_id, all=True)
        slide_ids = [slide["slide_id"] for slide in slides]

        # TODO: FileManager service
        history_paths = [glob.glob(get_slide_history_path(slide_id, "*")) for slide_id in slide_ids]
        history_paths = list(itertools.chain(*history_paths))
        history_paths = sorted(history_paths)
        
        if len(history_paths) == 0:
            raise HTTPException(status_code=400, detail="No messages found in the chat history to generate quiz.")
        
        history = []
        for history_path in history_paths:
            with open(history_path, "r") as file:
                history.extend(jsonpickle.decode(file.read()))
    else:
        history_url = get_chat_history_path(chat_id)
        if not os.path.exists(history_url):
            raise HTTPException(status_code=400, detail="No messages found in the chat history to generate quiz.")
        with open(history_url, "r") as file:
            history = jsonpickle.decode(file.read())

    # TODO: LLM service
    chat_model = genai.GenerativeModel(
        MODEL_VERSION, system_instruction=SYSTEM_PROMPT, 
        generation_config={"response_mime_type": "application/json"}
    ).start_chat(history=history)

    # TODO: the weird thing is, model only generates quizzes for the last slide set it explained unless prompted explicitly 
    # we need extra prompt engineering
    # TODO: FileManager service & LLM service
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
async def get_flashcards(chat_id: int, current_user: dict = Depends(auth.get_current_user)):
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
async def get_flashcard(chat_id: int, flashcard_name: str, current_user: dict = Depends(auth.get_current_user)):
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

@router.put("/{chat_id}/flashcards/{flashcard_name}")
async def rename_flashcard(
    chat_id: int,
    flashcard_name: str,
    request: RenameFlashcardRequest,
    current_user: dict = Depends(auth.get_current_user)
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
async def delete_all_flashcards(chat_id: int, current_user: dict = Depends(auth.get_current_user)):
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

    return {"message": "All flashcards have been successfully deleted."}


@router.delete("/{chat_id}/flashcards/{flashcard_name}")
async def delete_flashcard(chat_id: int, flashcard_name: str, current_user: dict = Depends(auth.get_current_user)):
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
