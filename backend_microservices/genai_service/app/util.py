import base64
from typing import Any, Dict, List, Set

def encode_base64(file: bytes) -> str:
    """
    Encode a file as a base64 string.
    Args:
        - file (bytes): The file content to encode.
    """
    return base64.b64encode(file).decode("utf-8")


def validate_quiz_format(data: list) -> bool:
    """
    Validates the response structure for the generated quiz.

    Args:
        - data (list): The response data.

    Returns:
        - bool: True if valid, False otherwise.
    """
    if not isinstance(data, list):
        return False

    for item in data:
        if not isinstance(item, dict):
            return False

        # Validate 'question' key
        if 'question' not in item or not isinstance(item['question'], str):
            return False

        # Validate 'choices' key
        if 'choices' not in item or not isinstance(item['choices'], dict):
            return False
        
        # Ensure 'choices' contains exactly 5 elements and keys are 'A' to 'E'
        if len(item['choices']) != 5 or set(item['choices'].keys()) != {'A', 'B', 'C', 'D', 'E'}:
            return False

        # Validate each choice in 'choices'
        for key, value in item['choices'].items():
            if not isinstance(key, str) or not isinstance(value, str):
                return False
        
        # Validate 'answer' key
        if 'answer' not in item or not isinstance(item['answer'], str) or item['answer'].upper() not in ['A', 'B', 'C', 'D', 'E']:
            return False

    return True


def validate_flashcards_format(data: list) -> bool:
    """
    Validates the response structure for generated flashcards.

    Args:
        - response (dict): The response data.

    Returns:
        - bool: True if valid, False otherwise.
    """

    # If success is True, data must be a list of flashcards
    if not isinstance(data, list):
        return False

    for flashcard in data:
        if not isinstance(flashcard, dict):
            return False

        # Validate 'topic' key
        if 'topic' not in flashcard or not isinstance(flashcard['topic'], str) or not flashcard['topic'].strip():
            return False

        # Validate 'explanation' key
        if 'explanation' not in flashcard or not isinstance(flashcard['explanation'], str) or not flashcard['explanation'].strip():
            return False

    return True  # Valid success case


def has_cycle(edges: List[Dict[str, str]]) -> bool:
    """
    Detects if there is a cycle in a directed graph defined by `edges`.
    Each edge is a dict with "source" and "target" node IDs (strings).

    Returns True if a cycle exists, False otherwise.
    """
    # Build adjacency list
    adj = {}
    for e in edges:
        src = e["source"]
        tgt = e["target"]
        adj.setdefault(src, []).append(tgt)
        # ensure target appears in adj, even if no outgoing edges
        adj.setdefault(tgt, [])

    visited = set()    # permanently visited nodes
    rec_stack = set()  # nodes in the current DFS path

    def dfs(node: str) -> bool:
        # If node is in recursion stack ,cycle
        if node in rec_stack:
            return True
        # Already fully visited,no cycle from here
        if node in visited:
            return False

        # Mark this node as in-progress
        rec_stack.add(node)
        for neighbor in adj[node]:
            if dfs(neighbor):
                return True
        # Done exploring from node
        rec_stack.remove(node)
        visited.add(node)
        return False

    # Run DFS from every node
    for node in adj:
        if node not in visited:
            if dfs(node):
                return True

    return False

def validate_skill_tree_format(data: Any) -> bool:
    """
    Validates the 'data' payload for the skill‐tree format.

    Expected 'data' format:
    {
      "nodes": [
        {
          "id": "n1",
          "name": "Basic OOP",
          "quiz": [
            {
              "question": "...",
              "type": "multiple-choice",
              "options": {
                "A": "...",
                "B": "...",
                "C": "...",
                "D": "...",
                "E": "..."
              },
              "answer": "A"
            },
            ... up to 5 questions ...
          ]
        },
        ... more nodes ...
      ]
      "edges": [
        {
            "source": "n1",
            "target": "n2"
        }
      ]
    }

    Returns True if 'data' conforms, False otherwise.
    """
    # Top‐level must be a dict
    if not isinstance(data, dict):
        return False
    print(data)
    # Must contain a non‐empty list of nodes
    nodes = data.get("nodes")
    if not isinstance(nodes, list) or not nodes:
        return False

    # check cycles
    if has_cycle(data.get("edges")):
        return False
    
    for node in nodes:
        if not isinstance(node, dict):
            return False

        # Validate 'id'
        nid = node.get("id")
        if not isinstance(nid, str) or not nid.strip():
            if not isinstance(nid, int):
                print("id is not valid")
                return False

        # Validate 'name'
        name = node.get("name")
        if not isinstance(name, str) or not name.strip():
            return False

        # Validate 'quiz' revise the quiz length
        quiz = node.get("quiz")
        if not isinstance(quiz, list) or not (2 <= len(quiz) <= 10): 
            return False

        for question in quiz:
            if not isinstance(question, dict):
                return False

            # question text
            qtext = question.get("question")
            if not isinstance(qtext, str) or not qtext.strip():
                return False

            # type must be "multiple-choice"
            if question.get("type") != "multiple-choice":
                return False

            # options must be dict with exactly A–E
            options = question.get("options")
            if not isinstance(options, dict):
                return False
            if set(options.keys()) != {"A", "B", "C", "D", "E"}:
                return False
            for opt in options.values():
                if not isinstance(opt, str) or not opt.strip():
                    return False

            # answer must be one of the option keys
            answer = question.get("answer")
            if answer not in options:
                return False

    return True