from pydantic import BaseModel

class RenameFlashcardRequest(BaseModel):
    new_name: str
