import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, invalid, ...props }, ref) => {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        "flex min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-sm transition-all duration-150 ease-out outline-none",
        "border-input placeholder:text-muted-foreground hover:border-ring/50",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        invalid && "border-destructive hover:border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
