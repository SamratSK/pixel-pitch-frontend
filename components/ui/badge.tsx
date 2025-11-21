import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-tight",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        muted: "border-transparent bg-muted text-muted-foreground",
        success: "border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
        warning: "border-transparent bg-amber-500/10 text-amber-600 dark:text-amber-300",
        destructive: "border-transparent bg-destructive/15 text-destructive-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
