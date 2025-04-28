import base64

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

