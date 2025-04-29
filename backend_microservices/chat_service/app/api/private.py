from http.client import HTTPException
import json
from chat_service.app.model import ChatHistory
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

@router.get("/chat-histories/{course_id}")
async def get_all_chat_histories_of_course(course_id: int,
                       db: Session = Depends(get_db)):
    
    chats = ChatDB.fetch(db, course_id=course_id, all=True)
    all_histories = [] #ChatHistory list
    for chat in chats:
        if chat["slides_mode"]:
            history_fids = []
            slides = SlideDB.fetch(db, chat_id=chat.id, all=True)
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
            all_histories.append(history)

        else:
            history_fid = chat["history_fid"]
            if not history_fid:
                raise HTTPException(status_code=400, detail="No chat history found to generate quiz.")
            history_bytes = await filemanager.download(file_id=history_fid)
            history = ChatHistory.from_bytes(history_bytes)
            all_histories.append(history)

    return {"status": "success", "data": json.dumps([h.google() for h in all_histories])}
