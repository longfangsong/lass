import React from "react";
import { cn } from "@app/shared/presentation/lib/utils";
import BlurElement from "./blurElement";

interface BlurElementProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  tooltip?: string | React.ReactElement;
}

export default function ClickableBlurElement({
  children,
  className,
  disabled,
  tooltip,
}: BlurElementProps) {
  const [isBlurred, setIsBlurred] = React.useState(true);

  return (
    <BlurElement
      isBlurred={isBlurred}
      className={cn({ "cursor-not-allowed": disabled }, className)}
      onClick={() => {
        if (!disabled) {
          setIsBlurred(!isBlurred);
        }
      }}
      tooltip={tooltip}
    >
      {children}
    </BlurElement>
  );
}
