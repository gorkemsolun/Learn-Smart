import google.generativeai as genai
from openai import OpenAI
from anthropic import Anthropic

import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_MODEL_VERSION = "gemini-1.5-flash"
OPENAI_MODEL_VERSION = "gpt-4o-mini"
ANTHROPIC_MODEL_VERSION = "claude-3-5-sonnet-20241022"
DEEPSEEK_MODEL_VERSION = "placeholder" # TODO: add DeepSeek support

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
