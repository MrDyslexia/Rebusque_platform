"use client";

import * as React from "react";
import { AlertCircle, Check, Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

export interface NumberInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  suffix?: string;
  invalid?: boolean;
  valid?: boolean;
  disabled?: boolean;
  className?: string;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ id, value, onChange, onBlur, min, max, step = 1, placeholder, suffix, invalid, valid, disabled, className }, ref) => {
    function clamp(n: number) {
      let result = n;
      if (typeof min === "number") result = Math.max(min, result);
      if (typeof max === "number") result = Math.min(max, result);
      return result;
    }

    function round(n: number) {
      const decimals = String(step).split(".")[1]?.length ?? 0;
      return Number(n.toFixed(decimals));
    }

    function handleStep(direction: 1 | -1) {
      if (disabled) return;
      const current = Number(value) || 0;
      const next = round(clamp(current + direction * step));
      onChange(String(next));
    }

    return (
      <div
        className={cn(
          "group flex h-10 w-full items-stretch overflow-hidden rounded-lg border bg-background shadow-sm transition-all duration-150 ease-out",
          "border-input focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30",
          invalid && "border-destructive focus-within:border-destructive focus-within:ring-destructive/30",
          valid && !invalid && "border-emerald-500/60 focus-within:border-emerald-500 focus-within:ring-emerald-500/30",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled || (typeof min === "number" && Number(value || 0) <= min)}
          onClick={() => handleStep(-1)}
          aria-label="Disminuir"
          className="flex w-9 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        <input
          ref={ref}
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            if (e.target.value !== "") {
              onChange(String(clamp(Number(e.target.value))));
            }
            onBlur?.();
          }}
          className="no-spinner w-full min-w-0 border-x border-input bg-transparent px-2 text-center text-sm outline-none"
        />

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled || (typeof max === "number" && Number(value || 0) >= max)}
          onClick={() => handleStep(1)}
          aria-label="Aumentar"
          className="flex w-9 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>

        {(invalid || valid) && (
          <span
            className={cn(
              "flex shrink-0 items-center px-1.5",
              invalid ? "text-destructive" : "text-emerald-500",
            )}
            aria-hidden="true"
          >
            {invalid ? <AlertCircle className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
          </span>
        )}

        {suffix && (
          <span className="flex shrink-0 items-center bg-muted px-2 text-xs text-muted-foreground">{suffix}</span>
        )}
      </div>
    );
  },
);
NumberInput.displayName = "NumberInput";

export { NumberInput };
