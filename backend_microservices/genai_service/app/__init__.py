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
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

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

FLASHCARD_PROMPT = """
You are required to generate flashcards from the student's chat history to facilitate effective review and reinforcement of key concepts.

**Instructions:**

- Generate between 3 to 4 relevant flashcards.
- Each flashcard must include a clear "topic" and a concise, accurate "explanation".
- Prioritize:
  - Concepts explicitly discussed in detail within the chat history.
  - Topics or concepts the student demonstrated difficulty understanding.

- **Do NOT** use information beyond the chat history.
- If the chat history lacks sufficient educational content for flashcard generation, explicitly state the reason clearly.

Return your response strictly as a JSON object in the following schema:

**Success Case:**
```json
{
  "success": true,
  "data": [
    {
      "topic": "Process Scheduling",
      "explanation": "The process by which an operating system decides the order in which processes access CPU resources, optimizing CPU usage and minimizing wait times."
    },
    {
      "topic": "CPU Burst",
      "explanation": "A period when a process continuously uses CPU resources before performing I/O or terminating."
    }
  ]
}
```

**Failure Case:**
```json
{
  "success": false,
  "data": "Chat history does not contain sufficient educational content to generate meaningful flashcards."
}
```
""".strip()

QUIZZES_PROMPT = """
You are required to generate a contextually relevant multiple-choice quiz based exclusively on the provided student chat history.  

**Instructions:**

- Create between 2 and 10 quiz questions based strictly on the depth and breadth of discussed course content.
- Each question must clearly reflect key concepts explicitly covered in the chat.
- Provide exactly five answer choices (labeled clearly as A, B, C, D, E) per question, ensuring choices are plausible and clearly distinct.
- Indicate the correct answer explicitly, labeled with letters (A, B, C, D, or E).

- **Do NOT** infer or include any information beyond provided chat content.
- If insufficient course-related content is present for quiz generation, clearly indicate the reason for failure.

Return your response strictly as a JSON object following the schema below:

**Success Case:**
```json
{
  "success": true,
  "data": [
    {
      "question": "What is process scheduling in operating systems?",
      "choices": [
        "Managing file storage space.",
        "Allocating CPU time to processes.",
        "Protecting data integrity.",
        "Ensuring memory optimization.",
        "Handling peripheral device communication."
      ],
      "answer": "B"
    },
    {
      "question": "Which term describes the interval a process spends actively using the CPU?",
      "choices": [
        "Context Switch",
        "I/O Burst",
        "CPU Burst",
        "Deadlock",
        "Throughput"
      ],
      "answer": "C"
    }
  ]
}
```

**Failure Case:**
```json
{
  "success": false,
  "data": "The chat history lacks sufficient course-related information to create quiz questions."
}
```
""".strip()
