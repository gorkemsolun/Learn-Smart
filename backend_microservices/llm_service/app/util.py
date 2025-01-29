import base64


def encode_base64(image_path: str):
    """
    Encode an image file as a base64 string.
    Args:
        - image_path: The path to the image file.
    """
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")