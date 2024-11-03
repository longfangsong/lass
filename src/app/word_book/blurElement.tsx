"use client";

import React, { useState } from "react";

interface BlurElementProps {
  children: React.ReactNode;
  className?: string;
}

export default function BlurElement({
  children,
  className = "",
}: BlurElementProps) {
  const [isBlurred, setIsBlurred] = useState(true);

  const toggleBlur = () => {
    setIsBlurred(!isBlurred);
  };

  return (
    <p
      className={`${isBlurred ? "blur-sm" : ""} transition-all duration-100 ease-in-out
      cursor-pointer ${className}`}
      onClick={toggleBlur}
      aria-pressed={!isBlurred}
    >
      {children}
    </p>
  );
}
