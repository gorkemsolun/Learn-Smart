import { useRouter } from 'next/navigation';

const LogoButton = () => {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        router.replace(`/home-page`);
      }}
    >
      <div className="inline-flex gap-0">
        <h1
          className="text-6xl font-bold"
          style={{
            fontFamily: "logo-font, serif",
            color: "rgb(23,144, 288)",
            letterSpacing: "0.025em",
          }}
        >
          learn
        </h1>
        <h1
          className="text-6xl font-bold"
          style={{
            fontFamily: "logo-font, serif",
            color: "black",
            letterSpacing: "0.025em",
          }}
        >
          smart
        </h1>
      </div>
    </button>
  );
};

import { IconType } from 'react-icons';

interface ActionButtonProps {
  course_id: string;
  course_name: string;
  path: string;
  icon: IconType;
  color: string;
  label: string;
}

const ActionButton = ({ course_id, course_name, path, icon: Icon, color, label }: ActionButtonProps) => {
  const router = useRouter();

  return (
    <button
      className="relative flex w-40 flex-col gap-2 rounded-2xl border border-token-border-light
      px-3 pb-4 pt-3 text-start align-top text-[15px] shadow-xxs transition enabled:hover:bg-token-main-surface-secondary
      disabled:cursor-not-allowed bg-gray-300 hover:bg-gray-400"
      type="button"
      onClick={() => {
        router.replace(`/course/${course_id}/${path}`);
      }}
    >
      <Icon className="text-2xl" style={{ color }} />
      <div className="line-clamp-3 max-w-full text-balance text-gray-600 dark:text-gray-500 break-word">
        {label} for {course_name || "the Course"}
      </div>
    </button>
  );
};

export { ActionButton, LogoButton };
