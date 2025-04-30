import json
from typing import Optional
from skill_tree_service.app.database.dbmanager import SkillTreeDB, SkillTreeEdgeDB, SkillTreeNodeDB, QuizDB
from skill_tree_service.app import SKILL_TREE_PROMPT
from skill_tree_service.app.model import ChatHistory
from skill_tree_service.app.database.model import NodeState, Quiz, SkillTree, SkillTreeEdge, SkillTreeNode
from sqlalchemy.orm import Session
from fastapi import APIRouter, UploadFile, HTTPException, Depends, Form, File
import io, tempfile

#from skill_tree_service.app.database.dbmanager import 
from skill_tree_service.app.database.session import get_db

from skill_tree_service.app.util import validate_file_extension, resize_image
#from skill_tree_service.app.schemas import SkillTreeCreationRequest, SkillTreeUpdateRequest

from skill_tree_service.app.clients import user, genai, filemanager, chat

router = APIRouter(prefix="/public", tags=["SkillTree - Public API"])

@router.post("/create")
async def create_skill_tree(course_id: int, 
                     current_user: dict = Depends(user.get_current_user),
                     db: Session = Depends(get_db)):
    

    all_history_fids = await chat.get_all_chat_histories_of_course(course_id)

    #download the histories, append the skill tree prompt, call the genai service get the response, create the skill tree and the quizzes in the database
    all_histories = None
    for history_fid in all_history_fids:
        history_bytes = await filemanager.download(file_id=history_fid) 
        history = ChatHistory.from_bytes(history_bytes)
        if all_histories:
            all_histories.merge(history)
        else:
            all_histories = history

        
    all_histories.add_message(role="edux", content=SKILL_TREE_PROMPT)

    skill_tree = await genai.create_skill_tree(all_histories)
    #convert the object to an adjacency list, make 2 passes, 1: create the nodes and quiz, 2: create the edges 
    tree = SkillTreeDB.create(db, course_id=course_id)
    skill_tree_id = tree["id"]

    # PASS 1: nodes and quizzes
    llm2db = {}
    for n in skill_tree["data"]["nodes"]:
        llm_id   = n["id"]
        llm_name = n["name"]
        llm_state = NodeState(n.get("state", NodeState.LOCKED_UNCOMPLETED.value))

        db_node = SkillTreeNodeDB.create(
            db,
            skill_tree_id=skill_tree_id,
            quiz_id=None,
            state=llm_state
        )
        db_node_id = db_node["id"]
        llm2db[llm_id] = db_node_id

        quiz_payload = n["quiz"]  # expect a list of question‐dicts
        quiz_bytes = json.dumps(quiz_payload).encode('utf-8')
        quiz_fid = await filemanager.upload(UploadFile(file=io.BytesIO(quiz_bytes), filename="node_quiz.json"), user_id=current_user["user_id"])

        #  create the Quiz row
        quiz = QuizDB.create(
            db,
            node_id=db_node_id,
            quiz_title=llm_name,
            quiz_fid=quiz_fid,
            num_questions=len(quiz_payload)
        )

        #  back-patch the node to reference its quiz_id
        SkillTreeNodeDB.update(
            db,
            db_node_id,
            quiz_id=quiz["quiz_id"]
        )
        

    # PASS 2: edges
    for e in skill_tree["data"]["edges"]:
        SkillTreeEdgeDB.create(
            db,
            parent_node_id=llm2db[e["source"]],
            child_node_id= llm2db[e["target"]]
        )

    
    pass

@router.get("/{course_id}") # get the skill tree associated with the given course id
async def get_skill_tree(course_id: int, 
                     current_user: dict = Depends(user.get_current_user),
                     db: Session = Depends(get_db)): 
    tree = (
        db.query(SkillTree)
          .filter(SkillTree.course_id == course_id)
          .first()
    )
    if not tree:
        return {"success": False, "data": f"No skill tree for course_id={course_id}"}

    tree_id = tree.id

    # Fetch all nodes in that tree
    nodes = (
        db.query(SkillTreeNode)
          .filter(SkillTreeNode.skill_tree_id == tree_id)
          .all()
    )
    node_ids = [n.id for n in nodes]

    # Fetch edges among those nodes
    edges = (
        db.query(SkillTreeEdge)
          .filter(SkillTreeEdge.parent_node_id.in_(node_ids))
          .filter(SkillTreeEdge.child_node_id.in_(node_ids))
          .all()
    )

    # Fetch quizzes 
    quizzes = (
        db.query(Quiz)
          .filter(Quiz.node_id.in_(node_ids))
          .all()
    )
    quiz_map = {q.node_id: q for q in quizzes}

   
    # 5) Build node payload (no parents/children)
    nodes_payload = []
    for n in nodes:
        q = quiz_map.get(n.id)
    
        quiz_bytes = await filemanager.download(file_id=q.quiz_fid)
        quiz_dict = json.loads(quiz_bytes.decode('utf-8'))

        title = q.quiz_title if q else f"Quiz {n.id}"
        nodes_payload.append({
            "id":   f"n{n.id}",
            "name": title,
            "quiz": quiz_dict,                          # placeholder for later
            "state": n.state.value,
        })

    # 6) Build edge list payload
    edges_payload = [
        {"source": f"n{e.parent_node_id}", "target": f"n{e.child_node_id}"}
        for e in edges
    ]

    return {
        "success": True,
        "data": {
            "nodes": nodes_payload,
            "edges": edges_payload
        }
    }

@router.post("/update")
async def update_skill_tree(): #delete the existing thing and create again
    pass

@router.delete("/{skilltree_id}")
async def delete_skill_tree(): 
    pass

