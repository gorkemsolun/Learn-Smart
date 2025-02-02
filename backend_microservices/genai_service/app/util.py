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
        if 'choices' not in item or not isinstance(item['choices'], list):
            return False
        
        # Ensure 'choices' contains 5 elements
        if len(item['choices']) != 5:
            return False
        
        # Validate each choice in 'choices'
        for choice in item['choices']:
            if not isinstance(choice, str):
                return False
        
        # Validate 'answer' key
        if 'answer' not in item or not item['answer'].upper() in ['A', 'B', 'C', 'D', 'E']:
            return False

    return True
