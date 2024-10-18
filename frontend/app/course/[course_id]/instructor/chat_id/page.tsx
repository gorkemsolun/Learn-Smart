import { useRouter } from "next/router";
import { useEffect } from "react";

export default function ChatPage() {
  const router = useRouter();
  const { course_id, chat_id } = router.query;

  useEffect(() => {
    if (course_id && chat_id) {
    }
  }, [course_id, chat_id]);

  function fetchChat() {
    // TODO: Fetch chat data
  }

  return (
    <div>
      <h1>Chat for Course {course_id}</h1>
      <div>TODO</div>
    </div>
  );
}
