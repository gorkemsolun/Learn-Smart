import pymupdf, os, io, json, jsonpickle, base64
import google.generativeai as genai
from typing import Optional
from fastapi import HTTPException, UploadFile
from PIL import Image

from tools import generate_hash, splitext
from database.dbmanager import SlideDB, ChatDB, CourseDB
from middleware import FILES_DIR, CHATS_DIR
from middleware.filemanager import FileFactory

def splitext(filename: str) -> tuple[str, str]:
    """
    Splits the filename and extension of a file.
    input: "file.pdf" | output: ("file", "pdf")
    """
    base_name = os.path.splitext(filename)[0]
    extension = os.path.splitext(filename)[-1][1:]
    return base_name, extension
