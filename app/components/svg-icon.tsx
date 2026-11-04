import type { ReactNode } from "react";
import type { IconName } from "../types/simulation";

const ICON_PATHS: Record<IconName, ReactNode> = {
  box: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4.5 7.7 7.5 4.4 7.5-4.4M12 12v8.5" />
    </>
  ),
  container: (
    <>
      <path d="M3 5.5h18v13H3zM7 5.5v13m5-13v13m5-13v13" />
      <path d="M5 21h2m10 0h2" />
    </>
  ),
  width: (
    <path d="M4 12h16M4 12l4-4m-4 4 4 4m12-4-4-4m4 4-4 4" />
  ),
  length: (
    <path d="M12 4v16m0-16L8 8m4-4 4 4m-4 12-4-4m4 4 4-4" />
  ),
  height: (
    <path d="M12 3v18m0-18L8 7m4-4 4 4m-4 14-4-4m4 4 4-4" />
  ),
  load: (
    <>
      <path d="M12 15V3m0 12 4-4m-4 4-4-4" />
      <path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
    </>
  ),
  unload: (
    <>
      <path d="M12 9v12m0-12 4 4m-4-4-4 4" />
      <path d="M5 10V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5" />
    </>
  ),
  play: <path d="m8 5 11 7-11 7V5Z" />,
  pause: <path d="M8 5v14M16 5v14" />,
  reset: (
    <>
      <path d="M4 11a8 8 0 1 1 1.7 5.2" />
      <path d="M4 5v6h6" />
    </>
  ),
  speed: (
    <>
      <path d="M4 17a9 9 0 1 1 16 0" />
      <path d="m12 13 4-4m-10 8h12" />
    </>
  ),
  rotate: (
    <>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M5.5 9A7 7 0 0 1 18 6l2 2m-16 8 2 2a7 7 0 0 0 12.5-3" />
    </>
  ),
  worker: (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M5 21a7 7 0 0 1 14 0m-9-13h4m-6-2a4 4 0 0 1 8 0" />
    </>
  ),
  conveyor: (
    <>
      <path d="m3 17 4-9h13l2 9H3Z" />
      <path d="M6 17v3m5-3v3m5-3v3m5-3v3M5 13h15" />
    </>
  ),
};

type IconProps = {
  name: IconName;
  className?: string;
};

export default function Icon({ name, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}
