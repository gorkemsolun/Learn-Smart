from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from chat_service.app.clients import filemanager
from chat_service.app.database.dbmanager import ChatDB, SlideDB, SlidePageDB
from chat_service.app.database.session import get_db
from chat_service.app.security.auth import verify_api_key

router = APIRouter(
    prefix="/private", 
    tags=["Course - Private API"],
    dependencies=[Depends(verify_api_key)]
)

@router.delete("/course/{course_id}")
async def delete_chats(course_id: int,
                       db: Session = Depends(get_db)):
    """
    Delete all chats for a specific course.

    Args:
        course_id (int): The ID of the course.

    Returns:
        dict: A message indicating all chats were successfully deleted.

    Raises:
        HTTPException: If the course is not found or the user is not authorized to delete the chats.
    """
    # TODO: Delete all files uploaded to all chats in the course
    
    chats = ChatDB.fetch(db, course_id=course_id, all=True)
    for chat in chats:
        if chat["slides_mode"]:
            fids_to_delete = [] # file IDs to delete

            slides = SlideDB.fetch(db, chat_id=chat["chat_id"], all=True)
            for slide in slides:
                fids_to_delete.append(slide["slides_fid"])
                SlideDB.delete(db, slide_id=slide["slide_id"])

                pages = SlidePageDB.fetch(db, slide_id=slide["slide_id"], all=True)
                for page in pages:
                    fids_to_delete.extend([page["content_fid"], page["chat_history_fid"]])

                SlidePageDB.delete(db, slide_id=slide["slide_id"], all=True)

            await filemanager.batch_delete(fids_to_delete)

        elif chat["history_fid"]: # if it's in slides mode, history_fid is already null
            await filemanager.delete(chat["history_fid"])

    ChatDB.delete(db, course_id=course_id, all=True)
    return {"status": "success"}
