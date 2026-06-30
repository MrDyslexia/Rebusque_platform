import { Vehicle } from "@/types";

export const vehicles: Vehicle[] = [
  {
    id: "veh_001",
    code: "CAM-001",
    plate: "BB-CK-12",
    branchId: "brn_norte",
    type: "camion",
    status: "en_ruta",
    capacity: { weightKg: 3500, volumeM3: 18, maxPackages: 80 },
    currentLocation: [-70.583, -33.41],
    currentDriverId: "usr_010",
    currentRouteId: "rut_20260630_001",
    maintenanceHistory: [
      { date: "2026-05-15", description: "Cambio de aceite", cost: 120000, nextDate: "2026-08-15" },
    ],
    active: true,
  },
  {
    id: "veh_002",
    code: "CAM-002",
    plate: "BB-DL-23",
    branchId: "brn_norte",
    type: "furgon",
    status: "disponible",
    capacity: { weightKg: 1500, volumeM3: 12, maxPackages: 50 },
    maintenanceHistory: [
      { date: "2026-04-20", description: "Revisión técnica", cost: 85000, nextDate: "2026-10-20" },
    ],
    active: true,
  },
  {
    id: "veh_003",
    code: "CAM-003",
    plate: "CC-EM-34",
    branchId: "brn_sur",
    type: "camion",
    status: "en_ruta",
    currentLocation: [-70.605, -33.495],
    currentDriverId: "usr_012",
    currentRouteId: "rut_20260630_002",
    capacity: { weightKg: 5000, volumeM3: 22, maxPackages: 100 },
    maintenanceHistory: [
      { date: "2026-06-01", description: "Mantención preventiva", cost: 145000, nextDate: "2026-09-01" },
    ],
    active: true,
  },
  {
    id: "veh_004",
    code: "CAM-004",
    plate: "CC-FN-45",
    branchId: "brn_sur",
    type: "furgon",
    status: "mantenimiento",
    capacity: { weightKg: 1200, volumeM3: 9, maxPackages: 40 },
    maintenanceHistory: [
      { date: "2026-06-28", description: "Reparación frenos", cost: 220000, nextDate: "2026-07-05" },
    ],
    active: true,
  },
];
