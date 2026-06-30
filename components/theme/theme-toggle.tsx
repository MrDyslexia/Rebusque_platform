"use client";

import { Moon, Sun, Monitor } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "light" as const, icon: Sun, label: "Claro" },
    { value: "dark" as const, icon: Moon, label: "Oscuro" },
    { value: "system" as const, icon: Monitor, label: "Sistema" },
  ];

  return (
    <div className={cn("flex w-full items-center justify-between rounded-lg border bg-muted p-1", className)}>
      {options.map((option) => {
        const active = theme === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            variant={active ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setTheme(option.value)}
            aria-pressed={active}
            aria-label={`Cambiar a tema ${option.label.toLowerCase()}`}
            title={option.label}
            className="h-9 w-9 shrink-0"
          >
            <option.icon className="h-4 w-4" aria-hidden="true" />
          </Button>
        );
      })}
    </div>
  );
}
