// TODO: Implement WeeklyStudyPlan page

import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function WeeklyStudyPlan() {
  const router = useRouter();
  const { course_id } = router.query;
  const [studyPlan, setStudyPlan] = useState(null);

  useEffect(() => {
    if (course_id) {
      // Fetch the study plan for the course
      fetch(`/api/courses/${course_id}/study-plan`)
        .then((response) => response.json())
        .then((data) => setStudyPlan(data))
        .catch((error) => console.error("Error fetching study plan:", error));
    }
  }, [course_id]);

  if (!studyPlan) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>
        Weekly Study Plan for Course {course_id} Implement WeeklyStudyPlan page
      </h1>
      <ul></ul>
    </div>
  );
}
