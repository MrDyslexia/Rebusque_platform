import { validateRut as validateRutLib, formatRut as formatRutLib, RutFormat } from "@fdograph/rut-utilities";

/**
 * Validación de RUT chileno (módulo 11) usando @fdograph/rut-utilities.
 * Acepta formato con o sin puntos, con guión: 12.345.678-9 / 12345678-9.
 * `noSuspicious=false` permite RUTs de prueba como 11.111.111-1 que el negocio
 * usa habitualmente en datos mock/test; no los rechazamos por defecto.
 */
export function isValidRut(rut: string): boolean {
  if (!rut?.trim()) return false;
  return validateRutLib(rut, false);
}

/** Formatea un RUT completo (con puntos y guión) al perder el foco o antes de persistir. */
export function formatRut(rut: string): string {
  if (!rut?.trim()) return rut;
  return formatRutLib(rut, RutFormat.DOTS_DASH);
}

/**
 * Formatea un RUT de forma incremental mientras el usuario escribe, preservando
 * la posición relativa del cursor (cuenta de caracteres "limpios" antes del cursor).
 * No valida — solo aplica máscara visual: 12.345.678-9
 */
export function formatRutInput(rawValue: string, previousCursor: number): { value: string; cursor: number } {
  const upper = rawValue.toUpperCase();

  // Cuántos caracteres "de datos" (dígitos o K) había antes del cursor original
  let dataCharsBeforeCursor = 0;
  for (let i = 0; i < previousCursor && i < upper.length; i++) {
    if (/[0-9K]/.test(upper[i])) dataCharsBeforeCursor++;
  }

  // Limpia todo lo que no sea dígito o K, máximo 9 caracteres (8 dígitos + DV)
  const clean = upper.replace(/[^0-9K]/g, "").slice(0, 9);

  if (clean.length === 0) {
    return { value: "", cursor: 0 };
  }

  const body = clean.length > 1 ? clean.slice(0, -1) : clean;
  const dv = clean.length > 1 ? clean.slice(-1) : "";

  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const formatted = dv ? `${withDots}-${dv}` : withDots;

  // Reconstruye la posición del cursor contando los mismos "data chars" en el resultado formateado
  let consumed = 0;
  let cursor = formatted.length;
  for (let i = 0; i < formatted.length; i++) {
    if (/[0-9K]/.test(formatted[i])) {
      consumed++;
      if (consumed === dataCharsBeforeCursor) {
        cursor = i + 1;
        break;
      }
    }
  }
  if (dataCharsBeforeCursor === 0) cursor = 0;

  return { value: formatted, cursor };
}
