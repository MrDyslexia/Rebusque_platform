/**
 * lib/toast.ts
 * Wrappers tipados sobre react-hot-toast alineados a la paleta de marca Rebusque.
 * Usar SIEMPRE estas funciones en vez de importar toast directamente,
 * así los estilos son consistentes en toda la app.
 */
import toast from 'react-hot-toast'

// ── Durations ──────────────────────────────────────────────────────────────
const DURATION = {
  short: 2500,
  default: 4000,
  long: 6000,
} as const

// ── Paleta de marca ────────────────────────────────────────────────────────
const BRAND = '#FF0066'
const DARK = '#0A0A3E'
const WHITE = '#FFFFFF'

const baseStyle: React.CSSProperties = {
  background: DARK,
  color: WHITE,
  borderRadius: '10px',
  fontSize: '14px',
  fontFamily: 'inherit',
  padding: '10px 16px',
  boxShadow: '0 4px 24px 0 rgba(0,0,0,0.35)',
  maxWidth: '380px',
}

// ── Helpers públicos ───────────────────────────────────────────────────────

/** Notificación de éxito (ícono verde de check). */
export function toastSuccess(message: string, duration = DURATION.default) {
  return toast.success(message, {
    duration,
    style: baseStyle,
    iconTheme: { primary: '#22c55e', secondary: WHITE },
  })
}

/** Notificación de error (ícono rojo X). */
export function toastError(message: string, duration = DURATION.long) {
  return toast.error(message, {
    duration,
    style: { ...baseStyle, borderLeft: `4px solid #ef4444` },
    iconTheme: { primary: '#ef4444', secondary: WHITE },
  })
}

/** Notificación informativa (ícono de marca). */
export function toastInfo(message: string, duration = DURATION.default) {
  return toast(message, {
    duration,
    style: { ...baseStyle, borderLeft: `4px solid ${BRAND}` },
    icon: '▸',
  })
}

/** Toast de carga manual. Devuelve el id para poder cerrarlo con toast.dismiss(id). */
export function toastLoading(message: string) {
  return toast.loading(message, {
    style: baseStyle,
    iconTheme: { primary: BRAND, secondary: WHITE },
  })
}

/**
 * Toast automático para promesas.
 * Muestra "cargando" mientras la promesa está pendiente,
 * luego cambia a éxito o error según el resultado.
 *
 * @example
 * await toastPromise(
 *   saveOrder(data),
 *   { loading: 'Guardando encomienda…', success: 'Encomienda creada', error: 'Error al guardar' }
 * )
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((err: unknown) => string)
  },
  duration = DURATION.default,
) {
  return toast.promise(promise, messages, {
    style: baseStyle,
    loading: { iconTheme: { primary: BRAND, secondary: WHITE } },
    success: { duration, iconTheme: { primary: '#22c55e', secondary: WHITE } },
    error: {
      duration: DURATION.long,
      style: { ...baseStyle, borderLeft: `4px solid #ef4444` },
      iconTheme: { primary: '#ef4444', secondary: WHITE },
    },
  })
}

/** Descarta un toast por id (útil con toastLoading). */
export const toastDismiss = toast.dismiss

// ── Mensajes reutilizables del dominio ─────────────────────────────────────
export const TOAST_MSGS = {
  // CRUD genérico
  created: (entity: string) => `${entity} creado/a correctamente.`,
  updated: (entity: string) => `${entity} actualizado/a correctamente.`,
  deleted: (entity: string) => `${entity} eliminado/a.`,
  saveError: (entity: string) => `No se pudo guardar ${entity}. Revisá los datos e intentá de nuevo.`,
  deleteError: (entity: string) => `No se pudo eliminar ${entity}.`,

  // Dominio Rebusque
  routeGenerated: 'Ruta generada correctamente.',
  routeGenerateError: 'No se pudo generar la ruta. Revisá los datos del planificador.',
  maintenanceScheduled: 'Mantención programada.',
  loginSuccess: 'Sesión iniciada.',
  loginError: 'Credenciales incorrectas.',
  sessionExpired: 'Tu sesión expiró. Iniciá sesión nuevamente.',
  networkError: 'Error de red. Verificá tu conexión.',
  copyToClipboard: 'Copiado al portapapeles.',
  noResults: 'No se encontraron resultados.',
} as const
