from fastapi import APIRouter, HTTPException, UploadFile, Depends, Form, File, Header
from sqlalchemy.orm import Session
from typing import List
import os, io, glob, json, jsonpickle, itertools
import pymupdf

from chat_service.app.clients import user, course, filemanager, genai
from chat_service.app.database.dbmanager import (
    ChatDB, SlideDB, SlidePageDB, QuizDB, FlashcardDB
)
from chat_service.app.database.session import get_db
from chat_service.app.util import *
from chat_service.app import EXPLAIN_SLIDE_PROMPT

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
    chat, _ = get_authorized_chat_and_course(chat_id, current_user["user_id"])
    return chat


@router.put("chat/{chat_id}/update_slides")
async def update_chat_slides(chat_id: int, slides: UploadFile = File(...),
                             current_user: dict = Depends(user.get_current_user),
                             db: Session = Depends(get_db)):
    """
    Update the slides for a chat by its ID.

    Args:
        chat_id (int): The ID of the chat to update.
        slides (UploadFile): The new slides file to upload.

    Returns:
        dict: A dictionary containing the updated chat details.

    Raises:
        HTTPException: If the chat is not found or the user is not authorized to update the chat.
    """
    chat, crs = get_authorized_chat_and_course(chat_id, current_user["user_id"])
    if not chat["slides_mode"]:
        raise HTTPException(status_code=400, detail="Slides mode is not enabled for this chat.")

    # Validate the file type by checking mime type
    if slides.content_type not in ([
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Only .pptx and .pdf files are allowed."
        )
    
    content = await slides.read()
    final_filename = f"{splitext(slides.filename)[0]}.pdf" # convert to PDF if it's a PPTX file

    if slides.content_type == 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        pdf_content = await convert_pptx_to_pdf(content)
    else:
        pdf_content = content

    with pymupdf.open(stream=pdf_content, filetype="pdf") as doc:
        page_count = doc.page_count

    with io.BytesIO(pdf_content) as pdf_file_io:
        converted_file = UploadFile(
            filename=final_filename, file=pdf_file_io, content_type='application/pdf'
        )
        slides_fid = await filemanager.upload(file=converted_file, user_id=current_user["user_id"])

    slide = SlideDB.create(
        db, chat_id=chat["chat_id"], course_id=crs["course_id"], slides_file_name=slides.filename, 
        slides_fid=slides_fid, pages_count=page_count, last_opened_page_id=1
    )
    chat = ChatDB.update(db, chat_id=chat["chat_id"], last_opened_slide_id=slide["slide_id"])

    slides_of_chat = SlideDB.fetch(db, chat_id=chat_id, all=True)
    chat["slides"] = slides_of_chat

    return {"chat": chat, "message": "Slides updated successfully."}


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
    get_authorized_chat_and_course(chat_id, current_user["user_id"])
    
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
        raise HTTPException(status_code=403, detail="Forbidden - not authorized to create chat for this course.")
    
    chat = ChatDB.create(
        db, course_id=course_id, chat_title=chat_title, slides_mode=bool(slides)
    )

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
        final_filename = f"{splitext(slides.filename)[0]}.pdf" # convert to PDF if it's a PPTX file

        if slides.content_type == 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
            pdf_content = await convert_pptx_to_pdf(content)
        else:
            pdf_content = content

        with pymupdf.open(stream=pdf_content, filetype="pdf") as doc:
            page_count = doc.page_count

        with io.BytesIO(pdf_content) as pdf_file_io:
            converted_file = UploadFile(
                filename=final_filename, file=pdf_file_io, content_type='application/pdf'
            )
            slides_fid = await filemanager.upload(file=converted_file, user_id=current_user["user_id"])

        slide = SlideDB.create(
            db, chat_id=chat["chat_id"], course_id=course_id, slides_file_name=slides.filename, 
            slides_fid=slides_fid, pages_count=page_count, last_opened_page_id=1
        )
        chat = ChatDB.update(db, chat_id=chat["chat_id"], last_opened_slide_id=slide["slide_id"])

        slide.pop("chat_id")
        chat["slides"] = [slide]

    return {"chat": chat, "message": "Chat created successfully."}


@router.post("/chat/{chat_id}/send_message")
async def send_message(chat_id: int,
                       slide_id: int = None,
                       page_id: int = None,
                       text: str = Form(...),
                       files: List[UploadFile] = File(None),
                       model: str = Form("google"),
                       current_user: dict = Depends(user.get_current_user),
                       authorization: str = Header(None),
                       db: Session = Depends(get_db)):
    """
    Send a message to a chat.

    Args:
        chat_id (int): The ID of the chat.
        slide_id (int, optional): The ID of the slide. Defaults to None.
        page_id (int, optional): The ID of the page. Defaults to None.
        text (str): The message text.
        files (List[UploadFile], optional): The files to send. Defaults to None.
        model (str, optional): The generative AI model to use. Defaults to "google".
        current_user (dict, optional): The current user. Defaults to Depends(auth.get_current_user).
        authorization (str, optional): The authorization header. Defaults to Header(None).
        db (Session, optional): The database session. Defaults to Depends(get_db).

    Returns:
        dict: A dictionary containing the response text and the role of the sender.
    """
    chat, _ = get_authorized_chat_and_course(chat_id, current_user["user_id"])
    
    # Validate slide/page parameters
    if chat["slides_mode"]:
        if slide_id is None:
            raise HTTPException(400, "Slide ID is required for this chat.")
        slide = SlideDB.fetch(db, slide_id=slide_id)
        page = SlidePageDB.fetch(db, page_id=page_id) if page_id else None
        if not slide or not page:
            raise HTTPException(404, "Slide or page not found.")
        history_fid = page["chat_history_fid"]
        if not history_fid:
            raise HTTPException(500, "Unknown error occurred.")
    else:
        if slide_id is not None:
            raise HTTPException(400, "Slides mode is not enabled for this chat.")
        history_fid = chat.get("history_fid")

    # Process message and get updated history
    new_history_fid, response = await handle_chat_message(
        history_fid=history_fid,
        files=files,
        text=text,
        model=model,
        authorization=authorization,
        user_id=current_user["user_id"]
    )

    # Update database records
    if chat["slides_mode"]:
        SlidePageDB.update(page_id=page_id, chat_history_fid=new_history_fid)
        ChatDB.update(chat_id=chat_id, last_opened_slide_id=slide_id)
    else:
        ChatDB.update(
            chat_id=chat_id,
            history_fid=new_history_fid,
            last_opened_slide_id=None
        )

    return {"text": response, "role": "model"}


@router.delete("/chat/{chat_id}")
async def delete_chat(chat_id: int, 
                      current_user: dict = Depends(user.get_current_user),
                      db: Session = Depends(get_db)):
    """
    Delete a chat by its ID.

    Args:
        chat_id (int): The ID of the chat to delete.

    Returns:
        dict: A message indicating the chat was successfully deleted.

    Raises:
        HTTPException: If the chat is not found or the user is not authorized to delete the chat.
    """

    chat, _ = get_authorized_chat_and_course(chat_id, current_user["user_id"])

    fids_to_delete = [] # file IDs to delete
    if chat["slides_mode"]:
        slides = SlideDB.delete(db, chat_id=chat_id, all=True)

        for slide in slides:
            fids_to_delete.append(slide["slides_fid"])

            pages = SlidePageDB.delete(db, slide_id=slide["slide_id"], all=True)
            for page in pages:
                fids_to_delete.append(page["content_fid"])
                fids_to_delete.append(page["chat_history_fid"])

    else:
        fids_to_delete.append(chat["history_fid"])

    quizzes = QuizDB.delete(db, chat_id=chat_id, all=True)
    fids_to_delete.extend([quiz["quiz_fid"] for quiz in quizzes])

    flashcards = FlashcardDB.delete(db, chat_id=chat_id, all=True)
    fids_to_delete.extend([flashcard["flashcard_fid"] for flashcard in flashcards])

    ChatDB.delete(db, chat_id=chat_id)
    await filemanager.batch_delete(file_ids=fids_to_delete)

    return {"status": "success", "message": "Chat deleted successfully."}


@router.delete("/chat/{chat_id}/flashcards")
async def delete_all_flashcards(chat_id: int, 
                                current_user: dict = Depends(user.get_current_user),
                                db: Session = Depends(get_db)):
    """
    Delete all flashcard files inside the folder without deleting the folder.

    Args:
        chat_id (int): The ID of the chat.
        current_user (dict): The current authenticated user (used for authentication).

    Returns:
        dict: A message indicating all flashcards were successfully deleted.
    """

    get_authorized_chat_and_course(chat_id, current_user["user_id"])
    FlashcardDB.delete(db, chat_id=chat_id, all=True)

    return {"status": "success", "message": "All flashcards have been successfully deleted."}


@router.put("/chat/{chat_id}")
def update_chat_title(chat_id: int, chat_title: str, 
                      current_user: dict = Depends(user.get_current_user),
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
    get_authorized_chat_and_course(chat_id, current_user["user_id"])
    return ChatDB.update(db, chat_id=chat_id, chat_title=chat_title)   

# Slide
@router.get("/slides/{slide_id}")
async def get_slide_info(slide_id: int, 
                         current_user: dict = Depends(user.get_current_user),
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
    
    get_authorized_chat_and_course(slide["chat_id"], current_user["user_id"])
    return slide

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
    
    get_authorized_chat_and_course(quiz["chat_id"], current_user["user_id"])
    
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
    
    get_authorized_chat_and_course(quiz["chat_id"], current_user["user_id"])

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
        
        get_authorized_chat_and_course(quiz["chat_id"], current_user["user_id"])

        QuizDB.delete(db, quiz_id=quiz_id)
        await filemanager.delete(quiz["quiz_fid"])

        return {"status": "success", "message": "Quiz deleted successfully."}


# Flashcard
@router.delete("/flashcards/{flashcard_id}")
async def delete_flashcard(flashcard_id: int, 
                           current_user: dict = Depends(user.get_current_user),
                           db: Session = Depends(get_db)):
    """
    Delete a specific flashcard by its ID.

    Args:
        flashcard_id (int): The ID the flashcard to delete.
        current_user (dict): The current authenticated user (used for authentication).

    Returns:
        dict: A message indicating the flashcard was successfully deleted.
    """
    flashcard = FlashcardDB.fetch(db, flashcard_id=flashcard_id)
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found.")
    if flashcard["course_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden - not authorized to delete the flashcard.")
    
    FlashcardDB.delete(db, flashcard_id=flashcard_id)
    await filemanager.delete(flashcard["flashcard_fid"])

    return {"status": "success", "message": "Flashcard deleted successfully."}


@router.get("/flashcards/{flashcard_id}")
async def get_flashcard(flashcard_id: int, 
                        current_user: dict = Depends(user.get_current_user),
                        db: Session = Depends(get_db)):
    """
    Get a specific flashcard JSON by its file name.

    Args:
        flashcard_id (int): The ID of the flashcard to retrieve.

    Returns:
        dict: A dictionary containing the file name and flashcard content.
    """

    flashcard = FlashcardDB.fetch(db, flashcard_id=flashcard_id)
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found.")
    if flashcard["course_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    flashcard_bytes = await filemanager.download(file_id=flashcard["flashcard_fid"])
    flashcard_dict = json.loads(flashcard_bytes.decode('utf-8'))

    return flashcard_dict


@router.put("/flashcards/{flashcard_id}")
async def rename_flashcard(
    flashcard_id: int,
    new_name: str,
    current_user: dict = Depends(user.get_current_user)
):
    """
    Rename a specific flashcard.

    Args:
        flashcard_name (str): The name of the flashcard file to rename.
        new_name (str): The new name for the flashcard file (without the .json extension).

    Returns:
        dict: A message indicating the flashcard was successfully renamed.
    """
    flashcard = FlashcardDB.fetch(flashcard_id=flashcard_id)
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found.")
    if flashcard["course_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    FlashcardDB.update(flashcard_id=flashcard_id, flashcard_name=new_name)

    return {"message": f"Flashcard has been successfully renamed to {new_name}."}


@router.get("/chat/{page_id}")
async def get_slide(page_id: int, 
                    model: str,
                    current_user: dict = Depends(user.get_current_user),
                    db: Session = Depends(get_db)):
    """
    Get a specific slide and its explanation by its ID and page number.
    """
    # TODO: convert this to gRPC call
    page_db = SlidePageDB.fetch(db, page_id=page_id)
    if not page_db:
        raise HTTPException(status_code=404, detail="Slide not found.")
    
    chat_id = page_db["chat_id"]
    get_authorized_chat_and_course(chat_id, current_user["user_id"])

    slide_id = page_db["slide_id"]
    slide = SlideDB.fetch(db, slide_id=slide_id)
    if not slide:
        raise HTTPException(status_code=404, detail="Slide not found.")

    page_fid = page_db["content_fid"]
    page_content = await filemanager.download(file_id=page_fid) 
    page_base64 = base64.b64encode(page_content).decode("utf-8") # convert bytes to base64

    history_fid = page_db["chat_history_fid"]
    history_content = load_chat_history(history_fid)
    history = ChatHistory.from_bytes(history_content)

    history.add_message(
        role="edux", content=EXPLAIN_SLIDE_PROMPT,
        # TODO: mimetype="image/png" is hardcoded here
        files=ChatFile(mimetype="image/png", raw_data=page_content, fid=page_fid)
    )
    explanation = genai.send_message(history, model=model)
    history.add_message(role="assistant", content=explanation)

    new_history_fid = save_chat_history(history, current_user["user_id"])
    await filemanager.delete(history_fid) # delete the old history file

    SlidePageDB.update(page_id=page_id, chat_history_fid=new_history_fid)
    SlideDB.update(slide_id=slide_id, last_opened_page_id=page_id)

    return {"slide": page_base64, "history": history.messages}











@router.get("/{chat_id}")
async def get_chat(chat_id: int, 
                   current_user: dict = Depends(auth.get_current_user),
                   db: Session = Depends(get_db)):    
    """
    Get the details of a specific chat by its ID.

    Args:
        chat_id (int): The ID of the chat to retrieve.

    Returns:
        dict: A dictionary containing the chat details, including history or slides.
        If the chat history is not in slides-mode, the entire chat history is returned in the dict.
        Otherwise, the slides information are returned in the dict.

    Raises:
        HTTPException: If the chat is not found or the user is not authorized to access the chat.
    """
    chat, course = get_authorized_chat_and_course(chat_id, current_user["user_id"])
    
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

    chat["slides"] = slides
    return chat


@router.post("/{chat_id}/create_quiz")
async def create_quiz(chat_id: int, 
                      current_user: dict = Depends(auth.get_current_user),
                      db: Session = Depends(get_db)):
    # TODO: convert this to gRPC call
    chat, _ = get_authorized_chat_and_course(chat_id, current_user["user_id"])
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
    chat, _ = get_authorized_chat_and_course(chat_id, current_user["user_id"])
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
