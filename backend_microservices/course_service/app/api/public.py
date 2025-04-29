from typing import Optional
from sqlalchemy.orm import Session
from fastapi import APIRouter, UploadFile, HTTPException, Depends, Form, File
import io, tempfile

from course_service.app.database.dbmanager import CourseDB
from course_service.app.database.session import get_db

from course_service.app.util import validate_file_extension, resize_image
from course_service.app.schemas import CourseCreationRequest, CourseUpdateRequest

from course_service.app.clients import user, genai, filemanager, chat


router = APIRouter(prefix="/public", tags=["Course - Public API"])

@router.post("/create")
async def create_course(course_name: str = Form(...), 
                        course_code: str = Form(...),
                        course_description: Optional[str] = Form(None),
                        course_syllabus_file: UploadFile = File(None),
                        course_icon_file: UploadFile = File(None),
                        current_user: dict = Depends(user.get_current_user),
                        db: Session = Depends(get_db)):
    """
    Create a new course.

    Args:
        course_name (str): The name of the course.
        course_code (str): The code of the course.
        course_description (str, optional): The description of the course. Defaults to None.
        course_syllabus_file (UploadFile, optional): The syllabus file. Defaults to None.
        course_icon_file (UploadFile, optional): The icon file. Defaults to None.

    Returns:
        The created course.

    Raises:
        HTTPException: If there is an error creating the course.
    """
    CourseCreationRequest(
        course_name=course_name, course_code=course_code, course_description=course_description
    ) # pydantic input validation

    try:
        valid_image_formats, valid_syllabus_formats = ["png", "jpg", "jpeg"], ["pdf", "docx"]

        if course_icon_file and not validate_file_extension(course_icon_file.filename, valid_image_formats):
            raise ValueError(f"Invalid image format. Available formats: {', '.join(valid_image_formats)}")
        
        if course_syllabus_file and not validate_file_extension(course_syllabus_file.filename, valid_syllabus_formats):
            raise ValueError(f"Invalid syllabus format. Available formats: {', '.join(valid_syllabus_formats)}")

        course_icon_fid, course_syllabus_fid, course_study_plan_fid = None, None, None

        if course_icon_file:
            course_icon_file = await resize_image(course_icon_file)
            course_icon_fid = await filemanager.upload(
                file=course_icon_file, user_id=current_user["user_id"]
            )

        if course_syllabus_file:
            course_syllabus_fid = await filemanager.upload(
                file=course_syllabus_file, user_id=current_user["user_id"]
            )

            # send the syllabus to GenAI service for weekly study plan generation
            study_plan_text = await genai.create_study_plan(course_syllabus_file)
            
            with tempfile.NamedTemporaryFile(
                suffix='.md', mode='w+', encoding='utf-8', delete=True
            ) as temp_file:
                temp_file.write(study_plan_text)
                temp_file.flush()
                temp_file.seek(0)

                content = temp_file.read()
    
                # Create a BytesIO object from the content
                bytes_io = io.BytesIO(content.encode('utf-8'))
                
                # Create an UploadFile object
                upload_file = UploadFile(
                    filename=f"study_plan_{current_user['user_id']}.md",
                    file=bytes_io,
                )

                course_study_plan_fid = await filemanager.upload(
                    file=upload_file, user_id=current_user["user_id"]
                )

        course = CourseDB.create(
            db, user_id=current_user["user_id"], course_name=course_name, 
            course_code=course_code, course_description=course_description,
            course_syllabus_fid=course_syllabus_fid, 
            course_study_plan_fid=course_study_plan_fid,
            course_icon_fid=course_icon_fid
        )
        return course
    
    except Exception as e:
        if course_icon_fid:
            try:
                await filemanager.delete(course_icon_fid)
            except:
                pass

        if course_syllabus_fid:
            try:
                await filemanager.delete(course_syllabus_fid)
            except:
                pass
        
        if course_study_plan_fid:
            try:
                await filemanager.delete(course_study_plan_fid)
            except:
                pass
        
        error_message = str(e)
        raise HTTPException(
            status_code=500,
            detail=error_message.split(":")[1].strip() if ":" in error_message else error_message
        )
    

@router.get("/{course_id}")
async def get_course(course_id: int, 
                     current_user: dict = Depends(user.get_current_user),
                     db: Session = Depends(get_db)):
    """
    Get course details by course ID.

    Args:
        course_id (int): The ID of the course to retrieve.

    Returns:
        dict: A dictionary containing the course details.
    """
    course = CourseDB.fetch(db, course_id=course_id)

    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    # Check if the user is authorized to view the course
    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    return course


@router.put("/{course_id}")
async def update_course(course_id: int, course_name: Optional[str] = Form(None),
                        course_code: Optional[str] = Form(None),
                        course_description: Optional[str] = Form(None),
                        update_description: bool = Form(False),  # flag variable indicating whether to update the
                        course_syllabus_file: UploadFile = File(None),
                        course_update_syllabus: bool = Form(False),  # flag variable indicating whether to update the syllabus
                        course_icon_file: UploadFile = File(None),
                        update_icon: bool = Form(False),  # flag variable indicating whether to update the image
                        current_user: dict = Depends(user.get_current_user),
                        db: Session = Depends(get_db)):
    """
    Update a course with the given course_id.

    Parameters:
    - course_id (int): The ID of the course to update.
    - course_name (Optional[str]): The updated name of the course (default: None).
    - course_code (Optional[str]): The updated code of the course (default: None).
    - course_description (Optional[str]): The updated course_description of the course (default: None).
    - update_description (bool): Flag variable indicating whether to update the course_description (default: False).
    - course_syllabus_file (UploadFile): The updated syllabus file (default: None).
    - course_update_syllabus (bool): Flag variable indicating whether to update the syllabus (default: False).
    - course_icon_file (UploadFile): The updated image file (default: None).
    - update_icon (bool): Flag variable indicating whether to update the image (default: False).
    - current_user (dict): The current user's information.

    Returns:
    - Updated course information.

    Raises:
    - HTTPException(404): If the course is not found.
    - HTTPException(403): If the user is not authorized to update the course.
    - HTTPException(400): If there is a value error during the update process.
    """

    CourseUpdateRequest(
        course_name=course_name, course_code=course_code, course_description=course_description
    ) # pydantic input validation

    course = CourseDB.fetch(db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")
    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden - Not authorized to update this course.")
    
    CourseDB.update(
        db,
        course_id=course_id, course_name=course_name, course_code=course_code,
        course_description=course_description, update_description=update_description
    )

    error, error_message = False, None
    new_icon_fid, new_syllabus_fid, new_study_plan_fid = None, None, None

    old_icon_id = course["course_icon_fid"]
    old_syllabus_id = course["course_syllabus_fid"]
    old_study_plan_id = course["course_study_plan_fid"]

    if update_icon and course_icon_file is None:
        try:
            if old_icon_id:
                await filemanager.delete(course["course_icon_fid"])  # delete old image
        except Exception as e:
            error = True
            error_message = str(e)

    elif update_icon and course_icon_file:
        if not validate_file_extension(course_icon_file.filename, ["png", "jpg", "jpeg"]):
            raise HTTPException(status_code=400, detail="Invalid image format. Please upload a PNG, JPG, or JPEG file.")
        
        try:
            course_icon_file = await resize_image(course_icon_file)
            new_icon_fid = await filemanager.upload(
                file=course_icon_file, user_id=current_user["user_id"]
            )
            if old_icon_id:
                await filemanager.delete(course["course_icon_fid"])  # delete old image
        except Exception as e:
            error = True
            error_message = str(e)

    if course_update_syllabus and course_syllabus_file is None:
        try:
            if old_syllabus_id:
                await filemanager.delete(course["course_syllabus_fid"])  # delete old syllabus
            
            if old_study_plan_id:
                await filemanager.delete(course["course_study_plan_fid"])  # delete old study plan
        except Exception as e:
            error = True
            error_message = str(e)
        
    elif course_update_syllabus and course_syllabus_file:
        if not validate_file_extension(course_syllabus_file.filename, ["pdf", "docx"]):
            raise HTTPException(status_code=400, detail="Invalid syllabus format. Please upload a PDF or a DOCX file.")
        
        try:
            # send the syllabus to GenAI service for weekly study plan generation
            study_plan_text = await genai.create_study_plan(course_syllabus_file)
            with tempfile.NamedTemporaryFile(
                suffix=".md", mode="w+", encoding="utf-8", delete=True
            ) as temp_file:
                temp_file.write(study_plan_text)
                temp_file.flush()
                temp_file.seek(0)

                content = temp_file.read()
        
                # Create a BytesIO object from the content
                bytes_io = io.BytesIO(content.encode('utf-8'))
                
                # Create an UploadFile object
                upload_file = UploadFile(
                    filename=f"study_plan_{current_user['user_id']}.md",
                    file=bytes_io,
                )

                new_study_plan_fid = await filemanager.upload(
                    file=upload_file, user_id=current_user["user_id"]
                ) 

            new_syllabus_fid = await filemanager.upload(
                file=course_syllabus_file, user_id=current_user["user_id"]
            )

            if old_syllabus_id:
                await filemanager.delete(course["course_syllabus_fid"])
            
            if old_study_plan_id:
                await filemanager.delete(course["course_study_plan_fid"])  # delete old study plan
        except Exception as e:
            error = True
            error_message = str(e)
        
    course = CourseDB.update(
        db,
        course_id=course_id, course_name=course_name, course_code=course_code,
        course_description=(
            "" if course_description is None and update_description else course_description
        ),
        course_icon_fid=new_icon_fid,
        course_syllabus_fid=new_syllabus_fid,
        course_study_plan_fid=new_study_plan_fid
    )

    if error:
        raise HTTPException(
            status_code=500,
            detail=error_message.split(":")[1].strip() if ":" in error_message else error_message
        )
    
    return course


@router.delete("/{course_id}")
async def delete_course(course_id: int,
                        current_user: dict = Depends(user.get_current_user),
                        db: Session = Depends(get_db)):
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
    # 1) fetch & auth
    course = CourseDB.fetch(db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")
    if course["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    # 2) delete any stored files, but swallow errors
    for fid in (
        course.get("course_syllabus_fid"),
        course.get("course_icon_fid"),
        course.get("course_study_plan_fid"),
    ):
        if fid:
            try:
                await filemanager.delete(fid)
            except Exception:
                pass

    # 3) delete chats, but swallow “not found”
    try:
        await chat.delete_chats(course_id=course_id)
    except Exception:
        pass

    # 4) delete from DB
    try:
        deleted = CourseDB.delete(db, course_id=course_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"status": "Success", "deleted": deleted}