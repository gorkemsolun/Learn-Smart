EXPLAIN_SLIDE_PROMPT = """
Directly explain the following slide content clearly and concisely, without any introductory statements or unnecessary preambles.
Provide necessary context, definitions, examples, or analogies to ensure the student fully understands the material. 
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

**Success Case Example:**
```json
{
  success: true,
  data: [
    {
      topic: "Process Scheduling",
      explanation: "The process by which an operating system decides the order in which processes access CPU resources, optimizing CPU usage and minimizing wait times."
    },
    {
      topic: "CPU Burst",
      explanation: "A period when a process continuously uses CPU resources before performing I/O or terminating."
    }
  ]
}
```

**Failure Case Example:**
```json
{
  success: false,
  data: "Not enough content to generate flashcards."
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

**Success Case Example:**
```json
{
  success: true,
  data: [
    {
      question: "What is process scheduling in operating systems?",
      choices: {
        A: "Managing file storage space.",
        B: "Allocating CPU time to processes.",
        C: "Protecting data integrity.",
        D: "Ensuring memory optimization.",
        E: "Handling peripheral device communication."
      },
      answer: "B"
    },
    {
      question: "Which term describes the interval a process spends actively using the CPU?",
      choices: {
        A: "Context Switch",
        B: "I/O Burst",
        C: "CPU Burst",
        D: "Deadlock",
        E: "Throughput"
      },
      answer: "C"
    }
  ]
}
```

**Failure Case Example:**
```json
{
  success: false,
  data: "Not enough content to generate quiz."
}
```
""".strip()
