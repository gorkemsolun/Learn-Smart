import React from "react";
import { LoadingButtonParameters } from "../types";

export default function LoadingButton({
  handleClick,
  type,
  text,
  loadingText,
  disabled,
  className = "",
}: LoadingButtonParameters) {
  const [loading, setLoading] = React.useState(false);

  const onClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setLoading(true);
    handleClick(event);
    setLoading(false);
  };

  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled || loading}
      className={`${className} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
    >
      {loading ? loadingText : text}
    </button>
  );
}
