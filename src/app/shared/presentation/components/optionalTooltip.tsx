import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface OptionalTooltipProps {
  children: React.ReactNode;
  tooltip?: string | React.ReactElement;
}
export default function OptionalTooltip({
  children,
  tooltip,
}: OptionalTooltipProps) {
  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>
          <div>{tooltip}</div>
        </TooltipContent>
      </Tooltip>
    );
  } else {
    return children;
  }
}
