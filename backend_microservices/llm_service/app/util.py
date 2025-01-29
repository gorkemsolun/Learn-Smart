from typing import BinaryIO
import base64

def encode_base64(file: BinaryIO) -> str:
    """
    Encode an image file as a base64 string.
    Args:
    - file (BinaryIO): The file object to encode.
    """
    return base64.b64encode(file.read()).decode("utf-8")
