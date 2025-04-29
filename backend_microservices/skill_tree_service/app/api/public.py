import json
from typing import Optional
from skill_tree_service.app.database.model import Quiz, SkillTree, SkillTreeEdge, SkillTreeNode
from sqlalchemy.orm import Session
from fastapi import APIRouter, UploadFile, HTTPException, Depends, Form, File
import io, tempfile

#from skill_tree_service.app.database.dbmanager import 
from skill_tree_service.app.database.session import get_db

from skill_tree_service.app.util import validate_file_extension, resize_image
#from skill_tree_service.app.schemas import SkillTreeCreationRequest, SkillTreeUpdateRequest

from skill_tree_service.app.clients import user, genai, filemanager, course

router = APIRouter(prefix="/public", tags=["SkillTree - Public API"])

@router.post("/create")
async def create_skill_tree(course_id: int, 
                     current_user: dict = Depends(user.get_current_user),
                     db: Session = Depends(get_db)):
    
    
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

