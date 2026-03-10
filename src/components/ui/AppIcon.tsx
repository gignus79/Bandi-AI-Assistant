"use client";

import { useId } from "react";

interface AppIconProps {
  className?: string;
  size?: number;
}

export function AppIcon({ className, size = 32 }: AppIconProps) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <rect width="64" height="64" rx="12" fill={`url(#appIconGrad-${id})`} />
      <path
        d="M18 20h28v4H18zM18 28h20v2H18zM18 34h24v2H18z"
        fill="white"
        opacity="0.95"
      />
      <path
        d="M14 16v32l6-4 6 4 6-4 6 4V16H14z"
        stroke="white"
        strokeWidth="2"
        fill="none"
        opacity="0.9"
      />
      <circle cx="46" cy="38" r="10" fill="white" opacity="0.95" />
      <path
        d="M43 38l3 3 5-5"
        stroke="hsl(221, 83%, 53%)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <defs>
        <linearGradient
          id={`appIconGrad-${id}`}
          x1="0"
          y1="0"
          x2="64"
          y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="hsl(221, 83%, 53%)" />
          <stop offset="1" stopColor="hsl(221, 70%, 45%)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
