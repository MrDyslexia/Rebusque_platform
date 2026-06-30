"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface FormStatusBannerProps {
  /** Mensajes de error activos (clave -> mensaje). Vacío u undefined = sin errores visibles. */
  errors: Record<string, string | undefined>;
  /** Si true, solo cuenta errores de campos ya "tocados"; si no se quiere filtrar, pasar los errores ya filtrados. */
  className?: string;
}

export function FormStatusBanner({ errors, className }: FormStatusBannerProps) {
  const activeMessages = Object.values(errors).filter((m): m is string => Boolean(m));
  const count = activeMessages.length;

  if (count === 0) return null;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="space-y-0.5">
        <p className="font-medium">
          {count === 1 ? "Hay 1 campo con un error" : `Hay ${count} campos con errores`}
        </p>
        <p className="text-xs text-destructive/80">Revisa los campos marcados en rojo antes de continuar.</p>
      </div>
    </div>
  );
}

interface FormValidBadgeProps {
  className?: string;
}

/** Indicador compacto de "formulario válido" para mostrar junto al título cuando no hay errores y el form fue tocado. */
export function FormValidBadge({ className }: FormValidBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-500",
        className,
      )}
    >
      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
      Datos válidos
    </span>
  );
}
