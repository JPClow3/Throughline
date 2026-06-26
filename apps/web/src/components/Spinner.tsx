import type { CSSProperties } from "react";

type SpinnerProps = {
  size?: number | string;
  className?: string;
  style?: CSSProperties;
};

export function Spinner({ size = 24, className = "", style }: SpinnerProps) {
  return (
    <svg
      className={`spinner ${className}`}
      style={{ width: size, height: size, ...style }}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Loading"
    >
      <circle
        className="spinner-track"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.2"
      />
      <circle
        className="spinner-head"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
