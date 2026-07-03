import { Maintenance, MaintenanceStatus, MaintenanceType } from "@/types";

export const maintenanceTypeLabel: Record<MaintenanceType, string> = {
  preventiva: "Preventiva",
  correctiva: "Correctiva",
  revision_tecnica: "Revisión técnica",
  cambio_aceite: "Cambio de aceite",
  frenos: "Frenos",
  neumaticos: "Neumáticos",
  bateria: "Batería",
  electronica: "Electrónica",
  carroceria: "Carrocería",
  otro: "Otro",
};

export const maintenanceStatusLabel: Record<MaintenanceStatus, string> = {
  programada: "Programada",
  en_progreso: "En progreso",
  completada: "Completada",
  cancelada: "Cancelada",
};

export const maintenanceStatusVariant: Record<
  MaintenanceStatus,
  "default" | "secondary" | "success" | "warning" | "danger" | "outline"
> = {
  programada: "secondary",
  en_progreso: "warning",
  completada: "success",
  cancelada: "outline",
};

export const maintenanceTypeOptions: MaintenanceType[] = [
  "preventiva",
  "correctiva",
  "revision_tecnica",
  "cambio_aceite",
  "frenos",
  "neumaticos",
  "bateria",
  "electronica",
  "carroceria",
  "otro",
];

export const maintenanceStatusOptions: MaintenanceStatus[] = ["programada", "en_progreso", "completada", "cancelada"];

export function isOverdue(maintenance: Maintenance): boolean {
  if (maintenance.status === "completada" || maintenance.status === "cancelada") return false;
  if (!maintenance.nextDate) return false;
  return new Date(maintenance.nextDate) < new Date();
}

export function isDueSoon(maintenance: Maintenance, days = 7): boolean {
  if (maintenance.status === "completada" || maintenance.status === "cancelada") return false;
  if (!maintenance.nextDate) return false;
  const next = new Date(maintenance.nextDate);
  const now = new Date();
  const diff = next.getTime() - now.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

export function nextScheduledMaintenance(maintenanceHistory: Maintenance[]): Maintenance | undefined {
  const scheduled = maintenanceHistory.filter(
    (m) => m.status === "programada" || m.status === "en_progreso"
  );
  if (scheduled.length === 0) return undefined;
  return scheduled.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
}

export function maintenanceUrgency(maintenance: Maintenance): "overdue" | "soon" | "normal" | "done" {
  if (maintenance.status === "completada" || maintenance.status === "cancelada") return "done";
  if (isOverdue(maintenance)) return "overdue";
  if (isDueSoon(maintenance)) return "soon";
  return "normal";
}
