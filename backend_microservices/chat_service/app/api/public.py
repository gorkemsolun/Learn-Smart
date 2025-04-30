from fastapi import APIRouter, HTTPException, UploadFile, Depends, Form, File
from sqlalchemy.orm import Session
from typing import List
import io, json
import pymupdf

from chat_service.app.clients import user, course, filemanager, genai
from chat_service.app.database.dbmanager import (
    ChatDB, SlideDB, SlidePageDB, QuizDB, FlashcardDB
)
from chat_service.app.database.session import get_db
from chat_service.app.util import *
from chat_service.app import EXPLAIN_SLIDE_PROMPT, QUIZZES_PROMPT, FLASHCARD_PROMPT

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

        # Fetch slides for each chat
        for chat in chats:
            if chat["slides_mode"]:
                slides = SlideDB.fetch(db, chat_id=chat["chat_id"], all=True)
                chat["slides"] = slides
            else:
                chat["slides"] = []
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

    '''
    if course_id not in [course["course_id"] for course in courses]:
        raise HTTPException(status_code=403, detail="Forbidden.")
    '''
    
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


@router.get("/course/{course_id}/flashcards")
async def get_flashcards_of_course(course_id: int,
                                   current_user: dict = Depends(user.get_current_user),
                                   db: Session = Depends(get_db)):
    """
    Get all flashcards for a specific course.

    Args:
        course_id (int): The ID of the course.

    Returns:
        list: A list of dictionaries, each containing the flashcard details.

    Raises:
        HTTPException: If the course is not found or the user is not authorized to access the flashcards.
    """
    courses = await course.get_user_courses(current_user["user_id"])
    if course_id not in [course["course_id"] for course in courses]:
        raise HTTPException(status_code=403, detail="Forbidden.")
    
    chats = ChatDB.fetch(db, course_id=course_id, all=True)

    ret = []
    for chat in chats:
        flashcards = FlashcardDB.fetch(db, chat_id=chat["chat_id"], all=True)
        ret.append({
            "chat_id": chat["chat_id"],
            "chat_title": chat["chat_title"],
            "flashcards": flashcards
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
    chat, _ = await get_authorized_chat_and_course(db, chat_id, current_user["user_id"])
    return chat


@router.put("/chat/{chat_id}")
async def update_chat(
    chat_id: int,
    chat_title: Optional[str] = Form(None),
    slides: Optional[UploadFile] = File(None),
    current_user: dict = Depends(user.get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a chat's title and/or slides by its ID.

    Args:
        chat_id (int): The ID of the chat to update.
        chat_title (Optional[str]): The new title for the chat.
        slides (Optional[UploadFile]): The new slides file to upload.
        current_user (dict, optional): The current user's information.
        db (Session, optional): The database session.

    Returns:
        dict: A dictionary containing the updated chat details and a message.

    Raises:
        HTTPException: If the chat is not found, the user is not authorized,
                       slides mode is disabled, or file type is invalid.
    """
    # first, check authorization (raises 404 or 403 if bad)
    print(f"Updating chat {chat_id} for user {current_user['user_id']}")
    print(f"Chat title: {chat_title}")
    chat, crs = await get_authorized_chat_and_course(db, chat_id, current_user["user_id"])

    updated_fields = {}
    # If a new title was provided, update it
    if chat_title is not None:
        updated_fields["chat_title"] = chat_title

    # If slides were provided, handle upload + conversion + DB
    if slides is not None:
        if not chat["slides_mode"]:
            raise HTTPException(status_code=400, detail="Slides mode is not enabled for this chat.")

        # Validate MIME type
        if slides.content_type not in (
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        ):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only .pptx and .pdf files are allowed."
            )

        raw = await slides.read()
        # Normalize filename to .pdf
        base, _ = splitext(slides.filename)
        final_filename = f"{base}.pdf"

        # Convert PPTX to PDF if needed
        if slides.content_type == "application/vnd.openxmlformats-officedocument.presentationml.presentation":
            pdf_bytes = await convert_pptx_to_pdf(raw)
        else:
            pdf_bytes = raw

        # Count pages
        with pymupdf.open(stream=pdf_bytes, filetype="pdf") as doc:
            page_count = doc.page_count

        # Re-wrap bytes in UploadFile for your filemanager
        with io.BytesIO(pdf_bytes) as pdf_io:
            pdf_upload = UploadFile(
                filename=final_filename,
                file=pdf_io,
            )
            slides_fid = await filemanager.upload(file=pdf_upload, user_id=current_user["user_id"])

        # Create slide record
        slide = SlideDB.create(
            db,
            chat_id=chat_id,
            course_id=crs["course_id"],
            slides_file_name=slides.filename,
            slides_fid=slides_fid,
            pages_count=page_count,
            last_opened_page_number=1,
        )

        # Update chat to link new slide
        updated_fields["last_opened_slide_id"] = slide["slide_id"]

    # Apply any updates to the chat
    if updated_fields:
        chat = ChatDB.update(db, chat_id=chat_id, **updated_fields)

    # If slides were updated, re-fetch the list
    if slides is not None:
        chat["slides"] = SlideDB.fetch(db, chat_id=chat_id, all=True)

    return {
        "chat": chat,
        "message": (
            "Chat title updated." if chat_title and not slides else
            "Slides updated successfully." if slides and not chat_title else
            "Chat title and slides updated successfully."
        )
    }


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
    await get_authorized_chat_and_course(db, chat_id, current_user["user_id"])
    
    quizzes = QuizDB.fetch(db, chat_id=chat_id, all=True)
    return quizzes


@router.post("/chat/create")
async def create_chat(course_id: int, 
                      chat_title: str, 
                      slides: UploadFile = File(None),
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
    course_dict = await course.get_course(course_id)
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
        if slides.content_type == 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
            pdf_content = await convert_pptx_to_pdf(content)
        else:
            pdf_content = content

        with pymupdf.open(stream=pdf_content, filetype="pdf") as doc:
            page_count = doc.page_count

        with io.BytesIO(pdf_content) as pdf_file_io:
            upload_file = UploadFile(filename=slides.filename, file=pdf_file_io)
            slides_fid = await filemanager.upload(file=upload_file, user_id=current_user["user_id"])

        slide = SlideDB.create(
            db, chat_id=chat["chat_id"], course_id=course_id, slides_file_name=slides.filename, 
            slides_fid=slides_fid, pages_count=page_count, last_opened_page_number=1
        )
        chat = ChatDB.update(db, chat_id=chat["chat_id"], last_opened_slide_id=slide["slide_id"])

        slide.pop("chat_id")
        chat["slides"] = [slide]

    return {"chat": chat, "message": "Chat created successfully."}


@router.post("/chat/{chat_id}/send_message")
async def send_message(chat_id: int,
                       slide_id: Optional[int] = None,
                       page_number: Optional[int] = None,
                       text: str = Form(...),
                       files: List[UploadFile] = File([]),
                       model: str = Form("google"),
                       current_user: dict = Depends(user.get_current_user),
                       db: Session = Depends(get_db)):
    """
    Send a message to a chat.

    Args:
        chat_id (int): The ID of the chat.
        slide_id (int, optional): The ID of the slide. Defaults to None.
        page_number (int, optional): The page number. Defaults to None.
        text (str): The message text.
        files (List[UploadFile], optional): The files to send. Defaults to None.
        model (str, optional): The generative AI model to use. Defaults to "google".
        current_user (dict, optional): The current user. Defaults to Depends(auth.get_current_user).
        authorization (str, optional): The authorization header. Defaults to Header(None).
        db (Session, optional): The database session. Defaults to Depends(get_db).

    Returns:
        dict: A dictionary containing the response text and the role of the sender.
    """
    chat, _ = await get_authorized_chat_and_course(db, chat_id, current_user["user_id"])
    
    # Validate slide/page parameters
    if chat["slides_mode"]:
        if slide_id is None or page_number is None:
            raise HTTPException(400, "Slide ID and page number are required for this chat.")
        page = SlidePageDB.fetch(db, slide_id=slide_id, page_number=page_number)
        if not page:
            raise HTTPException(404, "Page not found.")
        slide_id = page["slide_id"]
        slide = SlideDB.fetch(db, slide_id=slide_id)
        if not slide:
            raise HTTPException(404, "Slide or page not found.")
        history_fid = page["chat_history_fid"]
        if not history_fid: # should NOT happen since an explanation is generated first
            raise HTTPException(500, "No history file found.")
    else:
        if slide_id is not None or page_number is not None:
            raise HTTPException(400, "Slides mode is not enabled for this chat.")
        history_fid = chat["history_fid"]

    # Process message and get updated history
    new_history_fid, response = await handle_chat_message(
        history_fid=history_fid,
        files=files,
        text=text,
        model=model,
        user_id=current_user["user_id"]
    )

    # Update database records
    if chat["slides_mode"]:
        SlidePageDB.update(
            db, slide_id=slide_id, page_number=page_number, chat_history_fid=new_history_fid
        )
    else:
        ChatDB.update(db,chat_id=chat_id, history_fid=new_history_fid)

    return {"text": response, "role": "assistant"}


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

    chat, _ = await get_authorized_chat_and_course(db, chat_id, current_user["user_id"])
    fids_to_delete = [] # file IDs to delete

    if chat["slides_mode"]:
        slides = SlideDB.delete(db, chat_id=chat_id, all=True)

        for slide in slides:
            fids_to_delete.append(slide["slides_fid"])

            pages = SlidePageDB.delete(db, slide_id=slide["slide_id"], all=True)
            for page in pages:
                fids_to_delete.append(page["content_fid"])
                fids_to_delete.append(page["chat_history_fid"])

    # TODO: Delete all the files uploaded to all the slide chats

    else:
        history_fid = chat["history_fid"]
        if history_fid:
            fids_to_delete.append(history_fid)
        history = await load_chat_history(history_fid)

        for message in history:
            if message.files:
                fids_to_delete.extend([file.fid for file in message.files])

    quizzes = QuizDB.delete(db, chat_id=chat_id, all=True)
    fids_to_delete.extend([quiz["quiz_fid"] for quiz in quizzes])

    flashcards = FlashcardDB.delete(db, chat_id=chat_id, all=True)
    fids_to_delete.extend([flashcard["flashcard_fid"] for flashcard in flashcards])

    ChatDB.delete(db, chat_id=chat_id)

    if fids_to_delete:
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

    await get_authorized_chat_and_course(db, chat_id, current_user["user_id"])
    FlashcardDB.delete(db, chat_id=chat_id, all=True)

    return {"status": "success", "message": "All flashcards have been successfully deleted."}


@router.get("/chat/slide/{slide_id}/page/{page_number}")
async def get_slide(slide_id: int, 
                    page_number: int,
                    model: str = "google",
                    current_user: dict = Depends(user.get_current_user),
                    db: Session = Depends(get_db)):
    """
    Get a specific slide and its explanation by its ID and page number.
    """
    slide_db = SlideDB.fetch(db, slide_id=slide_id)
    if not slide_db:
        raise HTTPException(status_code=404, detail="Slide not found.")

    chat_id = slide_db["chat_id"]
    await get_authorized_chat_and_course(db, chat_id, current_user["user_id"])

    page_db = SlidePageDB.fetch(db, slide_id=slide_id, page_number=page_number)
    if not page_db:
        slides_fid = slide_db["slides_fid"]
        slides_content = await filemanager.download(file_id=slides_fid)
        
        # Convert page to image using PyMuPDF
        with io.BytesIO(slides_content) as pdf_stream:
            doc = pymupdf.open(stream=pdf_stream, filetype="pdf")
            page = doc[page_number - 1]  # PyMuPDF uses 0-based indexing
            
            # Get page as image
            pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2))  # 2x zoom for better quality
            page_content = pix.tobytes(output="png")
            
            # Create a new page in the database
            upload_file = UploadFile(
                filename=f"slide_{slide_id}_page_{page_number}.png",
                file=io.BytesIO(page_content),
            )
            page_fid = await filemanager.upload(
                file=upload_file,
                user_id=current_user["user_id"]
            )
            
        history = await load_chat_history()
        history.add_message(
            role="edux", content=EXPLAIN_SLIDE_PROMPT,
            # TODO: mimetype="image/png" is hardcoded here
            files=[ChatFile(mimetype="image/png", raw_data=page_content, fid=page_fid)]
        )
        explanation = await genai.send_message(history, model=model)
        history.add_message(role="assistant", content=explanation)

        history_fid = await save_chat_history(history, current_user["user_id"])

        existing_page = SlidePageDB.fetch(db, slide_id=slide_id, page_number=page_number)
        if existing_page:
            page_db = SlidePageDB.update(
                db,
                slide_id=slide_id,
                page_number=page_number,
                content_fid=page_fid,
                chat_history_fid=history_fid
            )
        else:
            page_db = SlidePageDB.create(
                db,
                slide_id=slide_id,
                page_number=page_number,
                content_fid=page_fid,
                chat_history_fid=history_fid
            )


    else:
        page_fid = page_db["content_fid"]
        history_fid = page_db["chat_history_fid"]
        history = await load_chat_history(history_fid)
        page_content = await filemanager.download(file_id=page_fid) 

    ChatDB.update(db, chat_id=chat_id, last_opened_slide_id=slide_id)
    SlideDB.update(db, slide_id=slide_id, last_opened_page_number=page_number)

    page_base64 = base64.b64encode(page_content).decode("utf-8") # convert bytes to base64
    return {"slide": page_base64, "history": history.format()}


@router.get("/chat/{chat_id}")
async def get_chat(chat_id: int, 
                   current_user: dict = Depends(user.get_current_user),
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
    chat, course = await get_authorized_chat_and_course(db, chat_id, current_user["user_id"])
    
    if not chat["slides_mode"]:
        history_fid = chat["history_fid"]
        if history_fid:
            history_bytes = await filemanager.download(file_id=history_fid)
            history = ChatHistory.from_bytes(history_bytes)
            messages = history.format()
        else:
            messages = []

        chat["course_name"] = course["course_name"]
        chat["history"] = messages
        return chat
    
    slides = SlideDB.fetch(db, chat_id=chat_id, all=True)
    if not slides: # this should never happen in a slides-mode chat
        raise HTTPException(status_code=404, detail="Slides not found.")
    
    for slide in slides:
        slide.pop("chat_id")
        slide.pop("slides_fid")

    chat["slides"] = slides
    return chat

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
    
    await get_authorized_chat_and_course(db, slide["chat_id"], current_user["user_id"])
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
    '''
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")
    '''
    
    await get_authorized_chat_and_course(db, quiz["chat_id"], current_user["user_id"])
    
    fid = quiz["quiz_fid"] # file ID of the quiz
    print(fid)

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
    '''
    quiz = QuizDB.fetch(db, quiz_id=quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")
    '''
    
    await get_authorized_chat_and_course(db, quiz["chat_id"], current_user["user_id"])

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

        '''
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found.")
        '''
        
        await get_authorized_chat_and_course(db, quiz["chat_id"], current_user["user_id"])

        QuizDB.delete(db, quiz_id=quiz_id)
        await filemanager.delete(quiz["quiz_fid"])

        return {"status": "success", "message": "Quiz deleted successfully."}


@router.post("/quiz")
async def create_quiz(chat_id: int, 
                      current_user: dict = Depends(user.get_current_user),
                      db: Session = Depends(get_db)):

    chat, course = await get_authorized_chat_and_course(db, chat_id, current_user["user_id"])
    if chat["slides_mode"]:
        history_fids = []
        slides = SlideDB.fetch(db, chat_id=chat_id, all=True)
        slide_ids = [slide["slide_id"] for slide in slides]

        for slide_id in slide_ids:
            pages = SlidePageDB.fetch(db, slide_id=slide_id, all=True)
            history_fids.extend([page["chat_history_fid"] for page in pages])

        if len(history_fids) == 0:
            raise HTTPException(status_code=400, detail="No messages found in the chat history to generate quiz.")
        
        history_fids = sorted(history_fids)
        histories = []
        for history_fid in history_fids:
            history_bytes = await filemanager.download(file_id=history_fid)
            history = ChatHistory.from_bytes(history_bytes)
            histories.append(history)

        history = ChatHistory.merge(histories)

    else:
        history_fid = chat["history_fid"]
        if not history_fid:
            raise HTTPException(status_code=400, detail="No chat history found to generate quiz.")
        history_bytes = await filemanager.download(file_id=history_fid)
        history = ChatHistory.from_bytes(history_bytes)

    history.add_message(role="edux", content=QUIZZES_PROMPT)
    quiz = await genai.generate_quiz(history)
    quiz_bytes = json.dumps(quiz).encode('utf-8')
    quiz_fid = await filemanager.upload(UploadFile(file=io.BytesIO(quiz_bytes), filename="quiz.json"), user_id=current_user["user_id"])

    quiz_db = QuizDB.create(
        db, chat_id=chat_id, course_id=course["course_id"], 
        quiz_fid=quiz_fid, num_questions=len(quiz)
    )
        
    return {"title": quiz_db["quiz_title"], "data": quiz}

# Flashcard
@router.delete("/flashcard/{flashcard_id}")
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


@router.get("/flashcard/{flashcard_id}")
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


@router.put("/flashcard/{flashcard_id}")
async def rename_flashcard(
    flashcard_id: int,
    new_name: str,
    current_user: dict = Depends(user.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Rename a specific flashcard.

    Args:
        flashcard_name (str): The name of the flashcard file to rename.
        new_name (str): The new name for the flashcard file (without the .json extension).

    Returns:
        dict: A message indicating the flashcard was successfully renamed.
    """
    flashcard = FlashcardDB.fetch(db, flashcard_id=flashcard_id)
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found.")
    if flashcard["course_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    FlashcardDB.update(db, flashcard_id=flashcard_id, flashcard_name=new_name)

    return {"message": f"Flashcard has been successfully renamed to {new_name}."}


@router.post("/flashcard")
async def create_flashcards(chat_id: int, 
                            current_user: dict = Depends(user.get_current_user),
                            db: Session = Depends(get_db)):
    """
    Create flashcards based on a chat history.
    
    Args:
        chat_id (int): The ID of the chat.
        current_user (dict): The current user.

    Returns:
        dict: A dictionary containing the flashcard title and data.
    """
    chat, course = await get_authorized_chat_and_course(db, chat_id, current_user["user_id"])
    if chat["slides_mode"]:
        history_fids = []
        slides = SlideDB.fetch(db, chat_id=chat_id, all=True)
        slide_ids = [slide["slide_id"] for slide in slides]

        for slide_id in slide_ids:
            pages = SlidePageDB.fetch(db, slide_id=slide_id, all=True)
            history_fids.extend([page["chat_history_fid"] for page in pages])

        if len(history_fids) == 0:
            raise HTTPException(status_code=400, detail="No messages found in the chat history to generate flashcards.")
        
        history_fids = sorted(history_fids)
        histories = []
        for history_fid in history_fids:
            history_bytes = await filemanager.download(file_id=history_fid)
            history = ChatHistory.from_bytes(history_bytes)
            histories.append(history)

        history = ChatHistory.merge(histories)

    else:
        history_fid = chat["history_fid"]
        if not history_fid:
            raise HTTPException(status_code=400, detail="No chat history found to generate flashcards.")
        history_bytes = await filemanager.download(file_id=history_fid)
        history = ChatHistory.from_bytes(history_bytes)

    history.add_message(role="edux", content=FLASHCARD_PROMPT)
    flashcards = await genai.generate_flashcards(history)
    flashcards_bytes = json.dumps(flashcards).encode('utf-8')
    flashcards_fid = await filemanager.upload(UploadFile(file=io.BytesIO(flashcards_bytes), filename="flashcards.json"), user_id=current_user["user_id"])

    flashcard_db = FlashcardDB.create(
        db, chat_id=chat_id, course_id=course["course_id"], 
        flashcard_fid=flashcards_fid, num_flashcards=len(flashcards)
    )

    return {"title": flashcard_db["flashcard_title"], "data": flashcards}
