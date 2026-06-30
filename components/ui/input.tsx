import * as React from "react";
import { AlertCircle, Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  /** Marca el campo como válido y muestra un check; solo tiene efecto si `invalid` es false. */
  valid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, invalid, valid, ...props }, ref) => {
    const showStatusIcon = invalid || valid;

    return (
      <div className="relative">
        <input
          type={type}
          aria-invalid={invalid || undefined}
          className={cn(
            "flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-sm transition-all duration-150 ease-out outline-none",
            "border-input placeholder:text-muted-foreground hover:border-ring/50",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            invalid && "border-destructive pr-9 hover:border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30",
            valid && !invalid && "border-emerald-500/60 pr-9 hover:border-emerald-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30",
            type === "number" && "no-spinner",
            className,
          )}
          ref={ref}
          {...props}
        />
        {showStatusIcon && (
          <span
            className={cn(
              "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2",
              invalid ? "text-destructive" : "text-emerald-500",
            )}
            aria-hidden="true"
          >
            {invalid ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
