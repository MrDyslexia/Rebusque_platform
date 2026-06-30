import { isValidRut } from "@/lib/rut";

const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const CL_PHONE_PATTERN = /^\+569\d{8}$/;
const PLATE_PATTERN = /^([A-Z]{2}-[A-Z]{2}-\d{2}|\d{4}-[A-Z]{2})$/i;

export function validateRequired(value: string, label: string): string | null {
  return value.trim() ? null : `${label} es obligatorio`;
}

export function validateEmail(value: string, required = true): string | null {
  if (!value.trim()) return required ? "El correo es obligatorio" : null;
  if (!EMAIL_PATTERN.test(value.trim())) return "Correo inválido (ej: nombre@dominio.cl)";
  return null;
}

export function validateRut(value: string, required = true): string | null {
  if (!value.trim()) return required ? "El RUT es obligatorio" : null;
  if (!isValidRut(value)) return "RUT inválido: verifica el dígito verificador";
  return null;
}

export function validateClPhone(value: string, required = true): string | null {
  if (!value.trim()) return required ? "El teléfono es obligatorio" : null;
  if (!CL_PHONE_PATTERN.test(value.trim())) return "Formato inválido. Usa +569 seguido de 8 dígitos";
  return null;
}

export function validatePlate(value: string): string | null {
  if (!value.trim()) return "La patente es obligatoria";
  if (!PLATE_PATTERN.test(value.trim())) return "Formato inválido: AB-CD-12 o 1234-AB";
  return null;
}

export function validateNumber(
  value: string,
  label: string,
  opts: { min?: number; max?: number; required?: boolean } = {},
): string | null {
  const { min, max, required = true } = opts;
  if (value === "" || value === null || value === undefined) {
    return required ? `${label} es obligatorio` : null;
  }
  const n = Number(value);
  if (Number.isNaN(n)) return `${label} debe ser un número válido`;
  if (typeof min === "number" && n < min) return `${label} debe ser mayor o igual a ${min}`;
  if (typeof max === "number" && n > max) return `${label} debe ser menor o igual a ${max}`;
  return null;
}

export function validateTime(value: string, label: string): string | null {
  if (!value) return `${label} es obligatorio`;
  if (!/^\d{2}:\d{2}$/.test(value)) return `${label} tiene formato inválido`;
  return null;
}

export function validateDate(value: string, label: string): string | null {
  if (!value) return `${label} es obligatoria`;
  if (Number.isNaN(new Date(value).getTime())) return `${label} es inválida`;
  return null;
}

/** Ejecuta un mapa de validadores y devuelve solo las claves con error. */
export function runValidators(validators: Record<string, () => string | null>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [key, validate] of Object.entries(validators)) {
    const message = validate();
    if (message) errors[key] = message;
  }
  return errors;
}
