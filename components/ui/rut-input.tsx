"use client";

import * as React from "react";

import { Input, type InputProps } from "@/components/ui/input";
import { formatRutInput, isValidRut } from "@/lib/rut";

export interface RutInputProps extends Omit<InputProps, "onChange" | "value" | "type" | "valid"> {
  value: string;
  onChange: (value: string) => void;
  /** Si es false (RUT opcional), el campo vacío no se marca como inválido. */
  required?: boolean;
}

/**
 * Input de RUT chileno con formateo en tiempo real (12.345.678-9) mientras se escribe,
 * preservando la posición del cursor incluso al borrar/insertar en medio del texto.
 * Muestra feedback visual de validez (check / alerta) en vivo, antes de perder el foco.
 */
const RutInput = React.forwardRef<HTMLInputElement, RutInputProps>(
  ({ value, onChange, onBlur, invalid, required = true, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement | null>(null);
    const cursorRef = React.useRef<number | null>(null);

    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    React.useLayoutEffect(() => {
      if (cursorRef.current !== null && innerRef.current) {
        innerRef.current.setSelectionRange(cursorRef.current, cursorRef.current);
        cursorRef.current = null;
      }
    }, [value]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const rawCursor = e.target.selectionStart ?? e.target.value.length;
      const { value: formatted, cursor } = formatRutInput(e.target.value, rawCursor);
      cursorRef.current = cursor;
      onChange(formatted);
    }

    // Validez en vivo: solo se evalúa cuando hay un RUT completo (8-9 caracteres de datos),
    // para no marcar error mientras el usuario todavía está escribiendo el cuerpo del número.
    const cleanLength = value.replace(/[^0-9Kk]/g, "").length;
    const hasMinLength = cleanLength >= 7;
    const liveValid = hasMinLength && isValidRut(value);

    // Si el padre ya marcó invalid explícitamente (por ejemplo tras submit), respetarlo.
    // Si no, calculamos en vivo: inválido si está completo y no pasa el algoritmo.
    const isInvalid = invalid ?? (hasMinLength ? !liveValid : false);
    const isValid = !isInvalid && hasMinLength && liveValid && (value.trim() !== "" || !required);

    return (
      <Input
        {...props}
        ref={innerRef}
        type="text"
        inputMode="text"
        autoComplete="off"
        maxLength={12}
        value={value}
        invalid={isInvalid}
        valid={isValid}
        onChange={handleChange}
        onBlur={onBlur}
      />
    );
  },
);
RutInput.displayName = "RutInput";

export { RutInput };
