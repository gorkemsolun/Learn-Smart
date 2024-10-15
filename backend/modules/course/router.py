from typing import Optional
from fastapi import APIRouter, Depends, Form, HTTPException, File, UploadFile
import google.generativeai as genai
import os
import shutil

from middleware import authentication as auth
from middleware.filemanager import FileFactory
from database.dbmanager import CourseDB, ChatDB
from modules.course.schemas import CourseCreationRequest, CourseUpdateRequest
from modules.chat.util import *
from modules.course.util import *
from tools import validate_file_extension

router = APIRouter(prefix="/course", tags=["Course"])

@router.post("/generate_flashcards")
def generate_flashcards(course_flashcard_file_content: str = Form(...), course_id: str = Form(...)):
    # Your logic to generate flashcards
    success, data = create_flashcards(course_flashcard_file_content, course_id)
    return {"success": success, "data": data}

@router.get("/{course_id}")
async def get_course(course_id: int, current_user: dict = Depends(auth.get_current_user)):
    """
    Get course details by course ID.

    Args:
        course_id (int): The ID of the course to retrieve.
        current_user (User): The current authenticated user (used for authentication).

    Returns:
        dict: A dictionary containing the course details.
    """
    course = CourseDB.fetch(course_id=course_id)

    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    # Check if the user is authorized to view the course
    # This can happen if the user tries to view a course they don't own
    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    return course


@router.get("/{course_id}/chats")
async def get_chats(course_id: int, current_user: dict = Depends(auth.get_current_user)):
    """
    Get all chats for a course.

    Args:
        course_id (int): The ID of the course.
        current_user (User): The current authenticated user (used for authentication).

    Returns:
        list: A list of chat messages.
    """

    course = CourseDB.fetch(course_id=course_id)

    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    # Check if the user is authorized to view the course
    # This can happen if the user tries to view a course they don't own
    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    chats = ChatDB.fetch(course_id=course_id, all=True)
    return [{"chat_id": chat["chat_id"],
                       "chat_title": chat["chat_title"],
                       "created_at": chat["created_at"]} for chat in chats]  # return chat titles along with chat IDs


@router.get("/{course_id}/quizzes")
async def get_quizzes(course_id: int, current_user: dict = Depends(auth.get_current_user)):
    """
    Get all quizzes for a course.

    Args:
        course_id (int): The ID of the course.
        current_user (User): The current authenticated user (used for authentication).

    Returns:
        list: A list of quizzes.
    """

    course = CourseDB.fetch(course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")
    
    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden. You are not authorized to rename this quiz.")

    chats = ChatDB.fetch(course_id=course_id, all=True)
    quizzes = []
    for chat in chats:
        quizzes_path = get_quizzes_folder_path(chat["chat_id"])
        if os.path.exists(quizzes_path):
            filenames = [splitext(filename)[0] for filename in os.listdir(quizzes_path)]
            quizzes.append({"chat_id": chat["chat_id"], "chat_title": chat["chat_title"], "quizzes": filenames})
    return quizzes


# Quizzes don't have entries in DB and don't have IDs, which makes this function inefficient
@router.put("/{course_id}/quizzes/{quiz_name}")
async def rename_quiz(course_id: int, quiz_name: str, new_quiz_name: str,
                      current_user: dict = Depends(auth.get_current_user)):
    """
    Rename a quiz.

    Args:
        course_id (int): The ID of the course.
        quiz_name (str): The current name of the quiz.
        new_quiz_name (str): The new name of the quiz.
        current_user (User): The current authenticated user (used for authentication).

    Returns:
        dict: A dictionary containing the new quiz name.

    Raises:
        HTTPException: If there is an error renaming the quiz.
    """

    course = CourseDB.fetch(course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")
    
    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden. You are not authorized to rename this quiz.")

    quiz_name = quiz_name.strip()
    chats = ChatDB.fetch(course_id=course_id, all=True)

    old, new = None, None
    for chat in chats:
        quizzes_path = get_quizzes_folder_path(chat["chat_id"])
        if os.path.exists(quizzes_path):
            filenames = [splitext(filename)[0] for filename in os.listdir(quizzes_path)]
            if new_quiz_name in filenames:
                raise HTTPException(status_code=400, detail=f'Quiz with name "{new_quiz_name}" already exists.')
            if quiz_name in filenames:
                old = os.path.join(quizzes_path, f"{quiz_name}.json")
                new = os.path.join(quizzes_path, f"{new_quiz_name}.json")
    
    if old and new:
        os.rename(old, new)
        return new
    
    raise HTTPException(status_code=404, detail=f'Quiz with name "{quiz_name}" not found.')


@router.get("/{course_id}/quizzes/{quiz_name}")
async def get_quiz(course_id: int, quiz_name: str, current_user: dict = Depends(auth.get_current_user)):
    """
    Get a quiz.

    Args:
        course_id (int): The ID of the course.
        quiz_name (str): The name of the quiz.
        current_user (User): The current authenticated user (used for authentication).

    Returns:
        dict: A dictionary containing the quiz.

    Raises:
        HTTPException: If there is an error getting the quiz.
    """

    course = CourseDB.fetch(course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden. You are not authorized to rename this quiz.")

    quiz_name = quiz_name.strip()
    print(quiz_name)
    chats = ChatDB.fetch(course_id=course_id, all=True)
    for chat in chats:
        quizzes_path = get_quizzes_folder_path(chat["chat_id"])
        if os.path.exists(quizzes_path):
            filenames = [splitext(filename)[0] for filename in os.listdir(quizzes_path)]
            print(filenames)
            if quiz_name in filenames:
                with open(os.path.join(quizzes_path, f"{quiz_name}.json"), "r") as f:
                    return json.load(f)

    raise HTTPException(status_code=404, detail="Quiz not found.")

@router.delete("/{course_id}/quizzes/{quiz_name}")
async def delete_quiz(course_id: int, quiz_name: str, current_user: dict = Depends(auth.get_current_user)):
    """
    Delete a quiz.

    Args:
        course_id (int): The ID of the course.
        quiz_name (str): The name of the quiz.
        current_user (User): The current authenticated user (used for authentication).

    Returns:
        dict: A dictionary containing the success message.

    Raises:
        HTTPException: If there is an error deleting the quiz.
    """

    course = CourseDB.fetch(course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    quiz_name = quiz_name.strip()
    chats = ChatDB.fetch(course_id=course_id, all=True)
    for chat in chats:
        quizzes_path = get_quizzes_folder_path(chat["chat_id"])
        if os.path.exists(quizzes_path):
            filenames = [splitext(filename)[0] for filename in os.listdir(quizzes_path)]
            if quiz_name in filenames:
                os.remove(os.path.join(quizzes_path, f"{quiz_name}.json"))
                return {"message": "Quiz deleted successfully."}

    raise HTTPException(status_code=404, detail="Quiz not found.")


@router.post("/create")
async def create_course(course_name: str = Form(...), course_code: str = Form(...),
                        course_description: Optional[str] = Form(None),
                        course_syllabus_file: UploadFile = File(None),
                        course_icon_file: UploadFile = File(None),
                        current_user: dict = Depends(auth.get_current_user)):
    """
    Create a new course.

    Args:
        course (CourseCreationRequest): The course details.
        current_user (dict, optional): The current user. Defaults to Depends(auth.get_current_user).

    Returns:
        The created course.

    Raises:
        HTTPException: If there is an error creating the course.
    """

    # pydantic input validation
    _ = CourseCreationRequest(course_name=course_name, course_code=course_code, course_description=course_description)

    course_icon_path, syllabus_path, study_plan_path = None, None, None
    course = None
    try:
        valid_image_formats, valid_syllabus_formats = ["png", "jpg", "jpeg"], ["pdf", "docx"]
        if course_icon_file and not validate_file_extension(course_icon_file.filename, valid_image_formats):
            raise ValueError(f"Invalid image format. Available formats: {', '.join(valid_image_formats)}")
        if course_syllabus_file and not validate_file_extension(course_syllabus_file.filename, valid_syllabus_formats):
            raise ValueError(f"Invalid syllabus format. Available formats: {', '.join(valid_syllabus_formats)}")

        course = CourseDB.create(course_name=course_name, course_description=course_description,
                                 course_code=course_code, user_id=current_user["user_id"])
        if course_icon_file:
            course_icon_path = get_course_icon_path(course["course_id"])
            course_icon_file = FileFactory()(file=course_icon_file).save(course_icon_path, size=(256, 256))
            course["course_icon_url"] = course_icon_path  # update response dict. with the image URL

        if course_syllabus_file:
            syllabus_path = get_course_syllabus_path(course["course_id"])
            course_syllabus_file = FileFactory()(file=course_syllabus_file)
            course_syllabus_file.save(syllabus_path)
            course["course_syllabus_url"] = syllabus_path  # update response dict. with the syllabus URL

            # send the syllabus to LLM for weekly study plan generation
            success, study_plan_path = create_study_plan(course_syllabus_file.content(), course["course_id"])
            course["course_study_plan_url"] = study_plan_path  # update response dict. with the study plan URL

        CourseDB.update(course_id=course["course_id"], course_icon_url=course_icon_path, course_syllabus_url=syllabus_path,
                        course_study_plan_url=study_plan_path)
        return course
    except Exception as e:
        # Rollback changes
        if course_icon_path: FileFactory()(path=course_icon_path).delete()
        if syllabus_path: FileFactory()(path=syllabus_path).delete()
        if study_plan_path: FileFactory()(path=study_plan_path).delete()
        if course: CourseDB.delete(course_id=course["course_id"])

        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{course_id}")
async def delete_course(course_id: int, current_user: dict = Depends(auth.get_current_user)):
    """
    Delete a course.

    Args:
        course_id (int): The ID of the course to delete.
        current_user (dict, optional): The current user. Defaults to Depends(auth.get_current_user).

    Returns:
        Success message.

    Raises:
        HTTPException: If there is an error deleting the course.
    """
    course = CourseDB.fetch(course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden. You are not authorized to delete this course.")

    course_syllabus_url = course["course_syllabus_url"]
    if course_syllabus_url: 
        FileFactory()(path=course_syllabus_url).delete()
    
    course_icon_url = course["course_icon_url"]
    if course_icon_url: 
        FileFactory()(path=course_icon_url).delete()
        
    course_study_plan_url = course["course_study_plan_url"]
    if course_study_plan_url: 
        FileFactory()(path=course_study_plan_url).delete()

    chats = ChatDB.delete(course_id=course_id, all=True)  # delete all chats associated with the course
    CourseDB.delete(course_id=course_id)  # delete the course
    
    for chat in chats:
        history_url, slides_furl = chat["history_url"], chat["slides_furl"]
        metadata_url = get_chat_metadata_path(history_url) if history_url else None
        generator_url = get_generator_path(slides_furl) if slides_furl else None
        items_folder = get_chat_folder_path(chat["chat_id"])

        if os.path.exists(history_url):
            os.remove(history_url)
        if items_folder and os.path.exists(items_folder):
            shutil.rmtree(items_folder)
        if slides_furl and os.path.exists(slides_furl):
            os.remove(slides_furl)
        if metadata_url and os.path.exists(metadata_url):
            os.remove(metadata_url)
        if generator_url and os.path.exists(generator_url):
            os.remove(generator_url)

        # TODO: delete quiz and flashcards too

    return {"message": "Course deleted successfully."}


@router.put("/{course_id}")
async def update_course(course_id: int, course_name: Optional[str] = Form(None),
                        course_code: Optional[str] = Form(None),
                        course_description: Optional[str] = Form(None),
                        update_description: bool = Form(False),  # flag variable indicating whether to update the
                        # course_description (necessary because course_description is
                        # optional and might be None)
                        course_syllabus_file: UploadFile = File(None),
                        course_update_syllabus: bool = Form(False),  # flag variable indicating whether to update the syllabus
                        course_icon_file: UploadFile = File(None),
                        update_icon: bool = Form(False),  # flag variable indicating whether to update the image
                        current_user: dict = Depends(auth.get_current_user)):
    """
    Update a course with the given course_id.

    Parameters:
    - course_id (int): The ID of the course to update.
    - course_name (Optional[str]): The updated name of the course (default: None).
    - course_code (Optional[str]): The updated code of the course (default: None).
    - course_description (Optional[str]): The updated course_description of the course (default: None).
    - course_syllabus_file (UploadFile): The updated syllabus file (default: None).
    - course_icon_file (UploadFile): The updated image file (default: None).
    - current_user (dict): The current user's information.

    Returns:
    - Updated course information.

    Raises:
    - HTTPException(404): If the course is not found.
    - HTTPException(403): If the user is not authorized to update the course.
    - HTTPException(400): If there is a value error during the update process.

    TODO:
        Syllabus updates must go to LLM. course_syllabus_url field would change too.
    """

    # pydantic input validation
    _ = CourseUpdateRequest(course_name=course_name, course_code=course_code, course_description=course_description)

    course = CourseDB.fetch(course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")
    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    new_icon_path, new_syllabus_path, new_study_plan_path = None, None, None
    if update_icon and course_icon_file is None:
        FileFactory()(path=course["course_icon_url"]).delete()  # delete old image
    elif update_icon and course_icon_file:
        if not validate_file_extension(course_icon_file.filename, ["png", "jpg", "jpeg"]):
            raise HTTPException(status_code=400, detail="Invalid image format. Please upload a PNG, JPG, or JPEG file.")
        FileFactory()(path=course["course_icon_url"]).delete()  # delete old image

        new_icon_path = get_course_icon_path(course_id)
        new_course_icon_file = FileFactory()(file=course_icon_file)
        new_course_icon_file.save(new_icon_path, size=(256, 256))

    if course_update_syllabus and course_syllabus_file is None:
        FileFactory()(path=course["course_syllabus_url"]).delete()  # delete old syllabus
        FileFactory()(path=course["course_study_plan_url"]).delete()  # delete old study plan
    elif course_update_syllabus and course_syllabus_file:
        if not validate_file_extension(course_syllabus_file.filename, ["pdf", "docx"]):
            raise HTTPException(status_code=400, detail="Invalid syllabus format. Please upload a PDF or a DOCX file.")
        FileFactory()(path=course["course_syllabus_url"]).delete()  # delete old syllabus
        FileFactory()(path=course["course_study_plan_url"]).delete()  # delete old study plan

        new_syllabus_path = get_course_syllabus_path(course_id)
        course_syllabus_file = FileFactory()(course_syllabus_file)
        course_syllabus_file.save(new_syllabus_path)

        # send the new syllabus to LLM for weekly study plan generation
        success, new_study_plan_path = create_study_plan(course_syllabus_file.content(), course_id)

    try:
        course = CourseDB.update(course_id=course_id, course_name=course_name, course_code=course_code,
                                 course_description=(
                                     "" if course_description is None and update_description else course_description),
                                 course_icon_url=("" if course_icon_file is None and update_icon else new_icon_path),
                                 course_syllabus_url=("" if course_syllabus_file is None and course_update_syllabus else new_syllabus_path),
                                 course_study_plan_url=(
                                     "" if course_syllabus_file is None and course_update_syllabus else new_study_plan_path)
                                 )
        return course
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))