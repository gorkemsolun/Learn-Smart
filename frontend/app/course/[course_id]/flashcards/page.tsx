import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function FlashcardsPage() {
  const router = useRouter();
  const { course_id } = router.query;
  const [flashcards, setFlashcards] = useState([
    { question: "What is the capital of France?", answer: "Paris" },
    { question: "What is the capital of Germany?", answer: "Berlin" },
  ]);

  useEffect(() => {
    if (course_id) {
      // Fetch flashcards for the course
      fetch(`/api/courses/${course_id}/flashcards`)
        .then((response) => response.json())
        .then((data) => setFlashcards(data))
        .catch((error) => console.error("Error fetching flashcards:", error));
    }
  }, [course_id]);

  if (!course_id) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Flashcards for Course {course_id}</h1>
      <ul>
        {flashcards.map((flashcard, index) => (
          <li key={index}>
            <h2>{flashcard.question}</h2>
            <p>{flashcard.answer}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
