from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    UniqueConstraint,
    DateTime,
    Enum,
    func
)
from sqlalchemy.orm import relationship
from skill_tree_service.app.database.session import Base

class NodeState(PyEnum):
    LOCKED_UNCOMPLETED = "locked_uncompleted"
    UNLOCKED_UNCOMPLETED = "unlocked_uncompleted"
    UNLOCKED_COMPLETED = "unlocked_completed"

class SkillTree(Base):
    """
    Represents a skill tree for a specific course.
    """
    __tablename__ = 'skill_trees'
    __table_args__ = (
        UniqueConstraint('course_id', name='_course_skill_tree_uc'),
    )

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, nullable=False, unique=True)
    root_node_id = Column(Integer, ForeignKey('skill_tree_nodes.id'), nullable=True)

    # all nodes in this tree
    nodes = relationship(
        "SkillTreeNode",
        back_populates="skill_tree",
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "course_id": self.course_id,
            "root_node_id": self.root_node_id,
        }


class SkillTreeNode(Base):
    """
    A node in a skill tree, corresponding to one quiz.
    """
    __tablename__ = 'skill_tree_nodes'
    __table_args__ = (
        UniqueConstraint('skill_tree_id', 'quiz_id', name='_tree_quiz_uc'),
    )

    id = Column(Integer, primary_key=True, index=True)
    skill_tree_id = Column(Integer, ForeignKey('skill_trees.id'), nullable=False)
    quiz_id = Column(Integer, nullable=False)
    state = Column(Enum(NodeState), nullable=False, default=NodeState.LOCKED_UNCOMPLETED)

    skill_tree = relationship("SkillTree", back_populates="nodes")

    # edges where this node is the parent
    children_edges = relationship(
        "SkillTreeEdge",
        foreign_keys="[SkillTreeEdge.parent_node_id]",
        back_populates="parent",
        cascade="all, delete-orphan"
    )
    # edges where this node is the child
    parent_edges = relationship(
        "SkillTreeEdge",
        foreign_keys="[SkillTreeEdge.child_node_id]",
        back_populates="child",
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "skill_tree_id": self.skill_tree_id,
            "quiz_id": self.quiz_id,
        }


class SkillTreeEdge(Base):
    """
    Directed edge between two SkillTreeNodes.
    """
    __tablename__ = 'skill_tree_edges'

    parent_node_id = Column(
        Integer,
        ForeignKey('skill_tree_nodes.id'),
        primary_key=True
    )
    child_node_id = Column(
        Integer,
        ForeignKey('skill_tree_nodes.id'),
        primary_key=True
    )

    parent = relationship(
        "SkillTreeNode",
        foreign_keys=[parent_node_id],
        back_populates="children_edges"
    )
    child = relationship(
        "SkillTreeNode",
        foreign_keys=[child_node_id],
        back_populates="parent_edges"
    )

    def to_dict(self):
        return {
            "parent_node_id": self.parent_node_id,
            "child_node_id": self.child_node_id,
        }

class Quiz(Base):
    """
    Represents a quiz attached to a skill-tree node.
    """
    __tablename__ = 'quizzes'

    quiz_id = Column(Integer, primary_key=True, index=True)
    node_id = Column(Integer, ForeignKey('skill_tree_nodes.id'), nullable=False)
    quiz_title = Column(
        String(150),
        nullable=False,
        default=lambda: f"Quiz {datetime.now().strftime('%B %d, %Y at %I:%M:%S %p')}"
    )
    quiz_fid = Column(Integer, nullable=False)
    num_questions = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    node = relationship(
        "SkillTreeNode",
        back_populates="quiz"
    )

    def to_dict(self):
        return {
            "quiz_id": self.quiz_id,
            "node_id": self.node_id,
            "quiz_title": self.quiz_title,
            "quiz_fid": self.quiz_fid,
            "num_questions": self.num_questions,
            "created_at": self.created_at
        }


#lass UserSkillProgress(Base):
#   """
#   Tracks a user's completion state for each skill-tree node (quiz).
#   """
#   __tablename__ = 'user_skill_progress'
#
#   user_id = Column(Integer, primary_key=True)
#   node_id = Column(Integer, ForeignKey('skill_tree_nodes.id'), primary_key=True)
#   completed = Column(Boolean, nullable=False, default=False)
#   completed_at = Column(DateTime(timezone=True), server_default=func.now())
#
#   node = relationship("SkillTreeNode")
#
#   def to_dict(self):
#       return {
#           "user_id": self.user_id,
#           "node_id": self.node_id,
#           "completed": self.completed,
#           "completed_at": self.completed_at,
#       }
