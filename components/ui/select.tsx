import * as React from "react";
import { AlertCircle, Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
  invalid?: boolean;
  valid?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, invalid, valid, children, disabled, ...props }, ref) => {
    const showStatusIcon = invalid || valid;

    return (
      <div className={cn("group relative", wrapperClassName)}>
        <select
          className={cn(
            "peer flex h-10 w-full cursor-pointer appearance-none rounded-lg border bg-background px-3 py-2 pr-9 text-sm shadow-sm transition-all duration-150 ease-out outline-none",
            "border-input hover:border-ring/50",
            "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
            invalid && "border-destructive pr-16 focus-visible:border-destructive focus-visible:ring-destructive/30",
            valid && !invalid && "border-emerald-500/60 pr-16 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30",
            disabled && "cursor-not-allowed opacity-50",
            className,
          )}
          ref={ref}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          {...props}
        >
          {children}
        </select>
        {showStatusIcon && (
          <span
            className={cn(
              "pointer-events-none absolute right-8 top-1/2 -translate-y-1/2",
              invalid ? "text-destructive" : "text-emerald-500",
            )}
            aria-hidden="true"
          >
            {invalid ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </span>
        )}
        <ChevronDown
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-transform duration-150",
            "peer-focus-visible:rotate-180 peer-focus-visible:text-ring",
          )}
          aria-hidden="true"
        />
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
