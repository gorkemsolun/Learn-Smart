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
You received file contents from a student uploaded a file. Your task is as follows:

1. **Identify Content Type:**  
   Carefully analyze the content provided. Determine if it is a valid course syllabus.

2. **If Not a Syllabus:**
   Provide a concise error message in a few words indicating clearly why the provided content cannot be used to create a weekly study plan.

3. **If a Valid Syllabus:**
   Generate a structured and actionable weekly study plan **exclusively based on provided content**, without assuming additional details.  
   - If explicit weekly content is given or clearly inferable, structure it into a detailed week-by-week schedule.
   - If explicit week numbers or durations aren't provided, generate a logical general study plan with clearly delineated sections instead of weekly intervals.

Return your analysis strictly as a JSON object in the following schema:

**Success Case:**
```json
{
  "success": true,
  "data": "### Week-by-Week Study Plan\n\n**Week 1:**\n- Topic: Introduction\n- Activities: Read chapters 1-2\n\n**Week 2:**\n- Topic: Basic Concepts\n- Activities: Exercises 3.1-3.5, Review slides 4-6"
}
```

**Failure Case:**
```json
{
  "success": false,
  "data": "The provided content is personal notes, not a syllabus."
}
```
""".strip()
