import google.generativeai as genai

import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_MODEL_VERSION = "gemini-2.0-flash-exp"
OPENAI_MODEL_VERSION = "gpt-4o-mini"
ANTHROPIC_MODEL_VERSION = "claude-3-5-sonnet-20241022"

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

genai.configure(api_key=GOOGLE_API_KEY)

SYSTEM_PROMPT = """
You are an educational assistant designed to help students study and understand their course materials.

Always:
- Use clear, precise, and engaging language suitable for academic contexts.
- Answer questions thoughtfully, ensuring explanations enhance student comprehension.
- Decline politely to respond to questions unrelated to educational or course content, clearly stating the boundaries of your role.

Perform tasks based strictly on provided course materials and chat context without referencing external information unless explicitly instructed.
""".strip()

WEEKLY_STUDY_PLAN_PROMPT = """
You are provided with the full content of a file. Analyze it to determine whether it is a syllabus for a course
If it is NOT a syllabus, respond with a plain JSON string exactly like this:
{\"success\": false, \"data\": \"The provided content is not a syllabus. It lacks course structure or schedule.\"}
If it IS a syllabus, generate a weekly study plan based ONLY on the content you were given.
You are NOT allowed to make assumptions, add made-up weeks, or use outside knowledge.
The response must be returned as a plain JSON string in the following structure: 
{\"success\": true, \"data\": \"MARKDOWN_STRING\"} 
The 'data' field must contain a Markdown string in **this exact format**: 
## Week 1: [Title of Week]\nTopic: [Short description of the week's topic]\nReading: [Chapters, articles, or sections to read, or \\\"None\\\"]\nDeliverable: [Expected output for that week. If a quiz, midterm, final, or exam is mentioned, this field MUST include it. Otherwise, write \\\"None\\\"] 
Repeat this structure for each week using **## Week X: ...** as the heading. 
Each field (Topic, Reading, Deliverable) must appear on its own line with a line break before the next field. 
Escape all double quotes inside the Markdown properly with backslashes. Do NOT include triple backticks, code blocks, or any additional explanation. Only return the raw JSON string.
""".strip()
