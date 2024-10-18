// TODO: Implement QuizPage

import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function QuizPage() {
  const router = useRouter();
  const { course_id } = router.query;
  const [quizzes, setQuizzes] = useState([
    { id: 1, title: "Quiz 1" },
    { id: 2, title: "Quiz 2" },
  ]);

  useEffect(() => {
    if (course_id) {
      // Fetch quizzes for the course
      /* fetch(`/api/courses/${course_id}/quizzes`)
        .then((response) => response.json())
        .then((data) => setQuizzes(data))
        .catch((error) => console.error("Error fetching quizzes:", error)); */
    }
  }, [course_id]);

  if (!course_id) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Quizzes for Course {course_id}</h1>
      <ul>
        {quizzes.map((quiz) => (
          <li key={quiz.id}>{quiz.title}</li>
        ))}
      </ul>
    </div>
  );
}
