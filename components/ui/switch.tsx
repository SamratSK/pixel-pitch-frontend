import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(({ className, checked = false, ...props }, ref) => (
  <button
    ref={ref}
    role="switch"
    aria-checked={checked}
    className={cn(
      "relative inline-flex h-6 w-11 items-center rounded-full border border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      checked ? "bg-primary/90" : "bg-muted",
      className
    )}
    {...props}
  >
    <span
      className={cn(
        "ml-0.5 inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
        checked ? "translate-x-5" : "translate-x-0"
      )}
    />
  </button>
));
Switch.displayName = "Switch";

export { Switch };
