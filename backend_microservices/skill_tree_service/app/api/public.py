import json
from typing import Optional
from skill_tree_service.app.database.dbmanager import SkillTreeDB, SkillTreeEdgeDB, SkillTreeNodeDB, QuizDB
from skill_tree_service.app import SKILL_TREE_PROMPT, SKILL_TREE_UPDATE_PROMPT
from skill_tree_service.app.model import ChatHistory
from skill_tree_service.app.database.model import NodeState, Quiz, SkillTree, SkillTreeEdge, SkillTreeNode
from skill_tree_service.app.util import fetch_and_merge_all_chat_histories
from sqlalchemy.orm import Session
from fastapi import APIRouter, UploadFile, HTTPException, Depends, Form, File
import io, tempfile

#from skill_tree_service.app.database.dbmanager import 
from skill_tree_service.app.database.session import get_db

#from skill_tree_service.app.schemas import SkillTreeCreationRequest, SkillTreeUpdateRequest

from skill_tree_service.app.clients import user, genai, filemanager, chat

router = APIRouter(prefix="/public", tags=["SkillTree - Public API"])

@router.post("/create")
async def create_skill_tree(course_id: int, 
                     current_user: dict = Depends(user.get_current_user),
                     db: Session = Depends(get_db)):
    
    
    all_histories = await fetch_and_merge_all_chat_histories(course_id) 
    all_histories.add_message(role="edux", content=SKILL_TREE_PROMPT)#role?

    skill_tree = await genai.create_skill_tree(all_histories, is_update=False)
    #convert the object to an adjacency list, make 2 passes, 1: create the nodes and quiz, 2: create the edges 
    tree = SkillTreeDB.create(db, course_id=course_id, passed_slide_count=1)
    skill_tree_id = tree["id"]
    
    all_ids    = { n["id"]       for n in skill_tree["nodes"] }
    target_ids = { e["target"]   for e in skill_tree["edges"] }

    # roots = everything that never appears as a target
    root_ids   = all_ids - target_ids

    # PASS 1: nodes and quizzes
    llm2db = {}
    for n in skill_tree["nodes"]:
        llm_id   = n["id"]
        llm_name = n["name"]
        if llm_id in root_ids:
            n["state"] = NodeState.UNLOCKED_UNCOMPLETED.value
        else:
            n["state"] = NodeState.LOCKED_UNCOMPLETED.value

        llm_state = NodeState(n["state"])

        db_node = SkillTreeNodeDB.create(
            db,
            skill_tree_id=skill_tree_id,
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

    # PASS 2: edges
    for e in skill_tree["edges"]:
        SkillTreeEdgeDB.create(
            db,
            parent_node_id=llm2db[e["source"]],
            child_node_id= llm2db[e["target"]]
        )

    return {"success": True, "skill_tree": skill_tree} 

@router.get("/skill-tree") # get the skill tree associated with the given course id
async def get_skill_tree(course_id: int, 
                     current_user: dict = Depends(user.get_current_user),
                     db: Session = Depends(get_db)): 
    tree = (
        db.query(SkillTree)
          .filter(SkillTree.course_id == course_id)
          .first()
    )
    if not tree:
        return {"success": False, "skill_tree": None}

    tree_id = tree.id
    passed_slide_count = tree.passed_slide_count

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
            "id":   n.id,
            "name": title,
            "quiz": quiz_dict,                          # placeholder for later
            "state": n.state.value,
        })

    # Build edge list payload
    edges_payload = [
        {"source": e.parent_node_id, "target": e.child_node_id}
        for e in edges
    ]

    return {
        "success": True,
        "skill_tree": {
            "nodes": nodes_payload,
            "edges": edges_payload
        },
        "passed_slide_count": passed_slide_count,
    }

@router.post("/update")
async def update_skill_tree(course_id: int,
                            current_user: dict = Depends(user.get_current_user),
                            db: Session = Depends(get_db),): 
    
    result = await get_skill_tree(course_id, current_user, db)
    if not result.get("success"):
        # get_skill_tree returns {success:False, data:...}
        raise HTTPException(status_code=404, detail=result.get("data"))

    # extract the skill_tree dict
    skill_tree = result["skill_tree"]

    all_histories = await fetch_and_merge_all_chat_histories(course_id)
    all_histories.add_message(
        role="edux",
        content=json.dumps(skill_tree)
    )
    all_histories.add_message(role="edux", content=SKILL_TREE_UPDATE_PROMPT)#role?
    skill_tree = await genai.create_skill_tree(all_histories, is_update=True)
    skill_tree_id = None
    #find the skill tree id
    for e in skill_tree["edges"]:
        source = e["source"]
        target = e["target"]
        if isinstance(source, int):
            node = db.query(SkillTreeNode).filter(SkillTreeNode.id == source).first()
            if node:
                skill_tree_id = node.skill_tree_id
                break
        elif isinstance(target, int):
            node = db.query(SkillTreeNode).filter(SkillTreeNode.id == target).first()
            if node:
                skill_tree_id = node.skill_tree_id
                break
    
    if not skill_tree_id:
        raise HTTPException(status_code=500, detail="Updated skill tree has corrupted old nodes")
    
    # nodes consist of only the new nodes
    # edges have all of the node_id's 
    llm2db = {}
    for n in skill_tree["nodes"]:
        llm_id   = n["id"]
        llm_name = n["name"]

        db_node = SkillTreeNodeDB.create(
            db,
            skill_tree_id=skill_tree_id,
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
    
    #delete existing edges
    SkillTreeEdgeDB.delete_edges_for_skill_tree(db, skill_tree_id=skill_tree_id)
    # add edges
    for e in skill_tree["edges"]:
        source = e["source"] if isinstance(e["source"], int) else llm2db[e["source"]]
        target = e["target"] if isinstance(e["target"], int) else llm2db[e["target"]]
        SkillTreeEdgeDB.create(
            db,
            parent_node_id=source,
            child_node_id=target
        )
    
    # For each child, check if all its parents are completed
    for child_id in llm2db.values():
        parent_edges = (
            db.query(SkillTreeEdge)
              .filter(SkillTreeEdge.child_node_id == child_id)
              .all()
        )
        parent_ids = [e.parent_node_id for e in parent_edges]
        if not parent_ids: #the new node is a root
            child = db.query(SkillTreeNode).filter(SkillTreeNode.id == child_id).first()

            child.state = NodeState.UNLOCKED_UNCOMPLETED
            db.commit()
            db.refresh(child)
            continue
        # load parent nodes
        parents = (
            db.query(SkillTreeNode)
              .filter(SkillTreeNode.id.in_(parent_ids))
              .all()
        )

        # if every parent is UNLOCKED_COMPLETED, unlock the child
        if parents and all(p.state == NodeState.UNLOCKED_COMPLETED for p in parents):
            child = db.query(SkillTreeNode).filter(SkillTreeNode.id == child_id).first()
            if child.state == NodeState.LOCKED_UNCOMPLETED:
                child.state = NodeState.UNLOCKED_UNCOMPLETED
                db.commit()
                db.refresh(child)
    
    
    return {"success": True}

@router.post("/update-node")
async def update_node(node_id: int,
                    current_user: dict = Depends(user.get_current_user),
                    db: Session = Depends(get_db)):
    """
    Mark a node completed, then unlock any children whose
    parents are all completed.
    """
    # Load the target node
    node = db.query(SkillTreeNode).filter(SkillTreeNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail=f"Node {node_id} not found")

    # If it's unlocked_uncompleted, mark it unlocked_completed
    if node.state == NodeState.UNLOCKED_UNCOMPLETED:
        node.state = NodeState.UNLOCKED_COMPLETED
        db.commit()
        db.refresh(node)
    else:
        # nothing to do if already completed or still locked
        return {"success": True}

    # Find children of this node
    child_edges = (
        db.query(SkillTreeEdge)
          .filter(SkillTreeEdge.parent_node_id == node_id)
          .all()
    )
    child_ids = [e.child_node_id for e in child_edges]

    # For each child, check if all its parents are completed
    for child_id in child_ids:
        parent_edges = (
            db.query(SkillTreeEdge)
              .filter(SkillTreeEdge.child_node_id == child_id)
              .all()
        )
        parent_ids = [e.parent_node_id for e in parent_edges]

        # load parent nodes
        parents = (
            db.query(SkillTreeNode)
              .filter(SkillTreeNode.id.in_(parent_ids))
              .all()
        )

        # if every parent is UNLOCKED_COMPLETED, unlock the child
        if parents and all(p.state == NodeState.UNLOCKED_COMPLETED for p in parents):
            child = db.query(SkillTreeNode).filter(SkillTreeNode.id == child_id).first()
            if child.state == NodeState.LOCKED_UNCOMPLETED:
                child.state = NodeState.UNLOCKED_UNCOMPLETED
                db.commit()
                db.refresh(child)

    return {"success": True}


@router.post("/update-slide-count")
async def update_slide_count(
        course_id: int,
        passed_slide_count: int,
        current_user: dict = Depends(user.get_current_user),
        db: Session = Depends(get_db)
):
    """
    Update the passed_slide_count for a skill tree.
    If the tree doesn't exist yet, return an appropriate status.
    """
    tree = db.query(SkillTree).filter(SkillTree.course_id == course_id).first()

    if not tree:
        return {"success": False, "detail": "No skill tree exists for this course yet"}

    tree.passed_slide_count = passed_slide_count
    db.commit()
    db.refresh(tree)

    return {
        "success": True,
        "passed_slide_count": tree.passed_slide_count
    }

@router.delete("/delete")
async def delete_skill_tree(course_id: int,
                            current_user: dict = Depends(user.get_current_user),
                            db: Session = Depends(get_db)): 
    quiz_fids = SkillTreeDB.delete_by_course(db, course_id)
    if not quiz_fids:
        raise HTTPException(404, "No skill tree found")
    await filemanager.batch_delete(quiz_fids)
    return {"success": True}

