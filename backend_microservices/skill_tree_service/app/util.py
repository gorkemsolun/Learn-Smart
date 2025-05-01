import base64
from collections import deque
import json
from skill_tree_service.app.clients.chat import get_all_chat_histories_of_course
from skill_tree_service.app.clients import filemanager
from skill_tree_service.app.model import ChatHistory
from skill_tree_service.app.database.session import get_db, Base
from sqlalchemy import text


def annotate_and_prune(tree_json): #not needed I guess
    #  Extract node list and build id→node map
    nodes = tree_json["data"]["nodes"]
    id_map = {n["id"]: n for n in nodes}

    #  Initialize levels
    q = deque()
    for n in nodes:
        n["level"] = None #I don't know if I need this
        if not n["parents"]:
            n["level"] = 0
            q.append(n["id"])

    # BFS: for each popped node, assign its children level+1
    while q:
        cur = q.popleft()
        cur_level = id_map[cur]["level"]
        for child_id in id_map[cur]["children"]:
            child = id_map[child_id]
            # if first time or we found a shorter path
            if child["level"] is None or child["level"] > cur_level + 1:
                child["level"] = cur_level + 1
                q.append(child_id)

    # 5) Prune unwanted fields (example: remove parents/children, leave quiz empty)
    for n in nodes:
        n.pop("parents", None)
        n.pop("children", None)
        # quiz stays as [] (or you could pop it too)
        # n.pop("quiz", None)

    return tree_json

def init(restart: bool = False):
    gen = get_db()
    db = next(gen)

    try:
        if restart:
            # drop "users" table
            print("Dropping tables...")
            db.execute(text("DROP TABLE IF EXISTS courses;"))
            
        # create "users" table
        Base.metadata.create_all(bind=db.bind)
        
    finally:
        gen.close() # closes the session

def encode_base64(file: bytes) -> str:
    """
    Encode an image file as a base64 string.
    Args:
        - file (BinaryIO): The file object to encode.
    """
    return base64.b64encode(file).decode("utf-8")

async def fetch_and_merge_all_chat_histories(course_id: int) -> ChatHistory:
    """
    Fetches all chat-history FIDs for a course, downloads each history,
    converts to ChatHistory, and merges them into a single ChatHistory.

    Args:
        course_id (int): The ID of the course whose histories to load.

    Returns:
        ChatHistory: The merged chat history.
    """
    # Retrieve the list of history file IDs
    all_history_fids: list[int] = await get_all_chat_histories_of_course(course_id)

    # Download & parse each history
    histories: list[ChatHistory] = []
    for fid in all_history_fids:
        history_bytes = await filemanager.download(file_id=fid)
        histories.append(ChatHistory.from_bytes(history_bytes))

    # Merge into one ChatHistory and return
    return ChatHistory.merge(histories)