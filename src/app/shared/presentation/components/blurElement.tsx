import React from "react";
import { cn } from "@app/shared/presentation/lib/utils";
import OptionalTooltip from "./optionalTooltip";

interface BlurElementProps {
  children: React.ReactNode;
  isBlurred: boolean;
  onClick?: () => void;
  className?: string;
  tooltip?: string | React.ReactElement;
}

export default function BlurElement({
  children,
  isBlurred,
  onClick,
  className,
  tooltip,
}: BlurElementProps) {
  return (
    <OptionalTooltip tooltip={tooltip}>
      <span
        className={cn(
          "cursor-pointer transition-all duration-100 ease-in-out",
          { "blur-sm": isBlurred },
          className,
        )}
        onClick={onClick}
      >
        {children}
      </span>
    </OptionalTooltip>
  );
}
