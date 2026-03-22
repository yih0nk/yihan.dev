"use client";

import { useState } from "react";

interface SketchBorderProps {
  children: React.ReactNode;
  className?: string;
}

export default function SketchBorder({ children, className }: SketchBorderProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`relative ${className ?? ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {/* SVG sketch border drawn on hover */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
        aria-hidden="true"
      >
        <rect
          x="2"
          y="2"
          width="calc(100% - 4px)"
          height="calc(100% - 4px)"
          fill="none"
          stroke="black"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="8 2"
          style={{ transform: "rotate(-0.3deg)" }}
        />
      </svg>
    </div>
  );
}
