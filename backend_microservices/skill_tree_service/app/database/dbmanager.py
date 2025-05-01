from sqlalchemy.orm import Session
from sqlalchemy import and_, select

from skill_tree_service.app.database.model import (
    SkillTree, SkillTreeNode, SkillTreeEdge, Quiz
)


class SkillTreeDB:
    """
    Database interface for SkillTree.
    """

    @staticmethod
    def create(db: Session, course_id: int):
        # Prevent duplicate skill trees for a course
        existing = db.query(SkillTree).filter(SkillTree.course_id == course_id).first()
        if existing:
            raise ValueError(f"SkillTree already exists for course_id={course_id}")
        tree = SkillTree(course_id=course_id)
        db.add(tree)
        db.commit()
        db.refresh(tree)
        return tree.to_dict()

    @staticmethod
    def fetch(db: Session, tree_id: int = None, course_id: int = None):
        if not any([tree_id, course_id]):
            raise ValueError("Must specify tree_id or course_id")
        query = db.query(SkillTree)
        if tree_id:
            query = query.filter(SkillTree.id == tree_id)
        if course_id:
            query = query.filter(SkillTree.course_id == course_id)
        tree = query.first()
        return tree.to_dict() if tree else None

    @staticmethod
    def update(db: Session, tree_id: int, **kwargs):
        tree = db.query(SkillTree).filter(SkillTree.id == tree_id).first()
        if not tree:
            raise ValueError(f"SkillTree with id {tree_id} not found")
        if 'root_node_id' in kwargs:
            tree.root_node_id = kwargs['root_node_id']
        db.commit()
        db.refresh(tree)
        return tree.to_dict()

    @staticmethod
    def delete(db: Session, tree_id: int):
        tree = db.query(SkillTree).filter(SkillTree.id == tree_id).first()
        if not tree:
            return False
        db.delete(tree)
        db.commit()
        return True
    
    @staticmethod
    def delete_by_course(db: Session, course_id: int) -> list[int]:
        tree = db.query(SkillTree).filter(SkillTree.course_id == course_id).first()
        if not tree:
            return []
        quiz_fids = [
            fid for (fid,) in
            db.query(Quiz.quiz_fid)
              .join(SkillTreeNode, Quiz.node_id == SkillTreeNode.id)
              .filter(SkillTreeNode.skill_tree_id == tree.id)
              .all()
        ]
        db.delete(tree)
        db.commit()
        return quiz_fids


class SkillTreeNodeDB:
    """
    Database interface for SkillTreeNode.
    """

    @staticmethod
    def create(db: Session, skill_tree_id: int, state=None):
        node = SkillTreeNode(
            skill_tree_id=skill_tree_id,
            state=state
        )
        db.add(node)
        db.commit()
        db.refresh(node)
        return node.to_dict()

    @staticmethod
    def fetch(db: Session, node_id: int = None, skill_tree_id: int = None):
        if not any([node_id, skill_tree_id]):
            raise ValueError("Must specify node_id or skill_tree_id")
        query = db.query(SkillTreeNode)
        if node_id:
            query = query.filter(SkillTreeNode.id == node_id)
        if skill_tree_id:
            query = query.filter(SkillTreeNode.skill_tree_id == skill_tree_id)
        nodes = query.all()
        return [n.to_dict() for n in nodes]

    @staticmethod
    def update(db: Session, node_id: int, **kwargs):
        node = db.query(SkillTreeNode).filter(SkillTreeNode.id == node_id).first()
        if not node:
            raise ValueError(f"Node {node_id} not found")
        for field in ['state']:
            if field in kwargs:
                setattr(node, field, kwargs[field])
        db.commit()
        db.refresh(node)
        return node.to_dict()

    @staticmethod
    def delete(db: Session, node_id: int):
        node = db.query(SkillTreeNode).filter(SkillTreeNode.id == node_id).first()
        if not node:
            return False
        db.delete(node)
        db.commit()
        return True


class SkillTreeEdgeDB:
    """
    Database interface for SkillTreeEdge.
    """

    @staticmethod
    def create(db: Session, parent_node_id: int, child_node_id: int):
        edge = SkillTreeEdge(
            parent_node_id=parent_node_id,
            child_node_id=child_node_id
        )
        db.add(edge)
        db.commit()
        return edge.to_dict()

    @staticmethod
    def delete(db: Session, parent_node_id: int, child_node_id: int):
        edge = db.query(SkillTreeEdge).filter(
            and_(
                SkillTreeEdge.parent_node_id == parent_node_id,
                SkillTreeEdge.child_node_id == child_node_id
            )
        ).first()
        if not edge:
            return False
        db.delete(edge)
        db.commit()
        return True


class QuizDB:
    """
    Database interface for Quiz.
    """

    @staticmethod
    def create(db: Session, node_id: int, quiz_title: str, quiz_fid: int, num_questions: int):
        quiz = Quiz(
            node_id=node_id,
            quiz_title=quiz_title,
            quiz_fid=quiz_fid,
            num_questions=num_questions
        )
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
        return quiz.to_dict()

    @staticmethod
    def fetch(db: Session, quiz_id: int = None, node_id: int = None):
        if not any([quiz_id, node_id]):
            raise ValueError("Must specify quiz_id or node_id")
        query = db.query(Quiz)
        if quiz_id:
            query = query.filter(Quiz.quiz_id == quiz_id)
        if node_id:
            query = query.filter(Quiz.node_id == node_id)
        quiz = query.first()
        return quiz.to_dict() if quiz else None

    @staticmethod
    def update(db: Session, quiz_id: int, **kwargs):
        quiz = db.query(Quiz).filter(Quiz.quiz_id == quiz_id).first()
        if not quiz:
            raise ValueError(f"Quiz {quiz_id} not found")
        for field in ['quiz_title', 'quiz_fid', 'num_questions']:
            if field in kwargs:
                setattr(quiz, field, kwargs[field])
        db.commit()
        db.refresh(quiz)
        return quiz.to_dict()

    @staticmethod
    def delete(db: Session, quiz_id: int):
        quiz = db.query(Quiz).filter(Quiz.quiz_id == quiz_id).first()
        if not quiz:
            return False
        db.delete(quiz)
        db.commit()
        return True
