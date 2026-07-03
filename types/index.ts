export type Role = "admin" | "secretary" | "driver" | "client" | "api";

export type OrderStatus =
  | "INGRESADO"
  | "ALMACENADO"
  | "ASIGNADO_A_RUTA"
  | "EN_RUTA"
  | "ENTREGADO"
  | "ENTREGA_FALLIDA"
  | "REINTENTO_1"
  | "REINTENTO_2"
  | "DEVUELTO_A_ORIGEN"
  | "CANCELADO"
  | "PERDIDO"
  | "EN_CUSTODIA";

export type ServiceType = "estandar" | "express" | "mismo_dia" | "programado";
export type OrderType = "propio" | "chilexpress" | "starken" | "mercado_libre";
export type VehicleType = "moto" | "furgon" | "camion";
export type VehicleStatus = "disponible" | "en_ruta" | "mantenimiento" | "fuera_de_servicio";
export type MaintenanceStatus = "programada" | "en_progreso" | "completada" | "cancelada";
export type MaintenanceType =
  | "preventiva"
  | "correctiva"
  | "revision_tecnica"
  | "cambio_aceite"
  | "frenos"
  | "neumaticos"
  | "bateria"
  | "electronica"
  | "carroceria"
  | "otro";
export type RouteStatus = "planificado" | "en_curso" | "completado" | "cancelado";
export type BillingStatus = "pendiente" | "facturado" | "pagado" | "anulado";

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  coordinates: [number, number];
  phone?: string;
  email?: string;
  operatingHours: Record<string, { open: string | null; close: string | null }>;
  active: boolean;
}

export interface User {
  id: string;
  rut: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  branchId?: string;
  shift?: { start: string; end: string; days: number[] };
  vehicleId?: string;
  active: boolean;
}

export interface Client {
  id: string;
  rut: string;
  name: string;
  email: string;
  phone: string;
  type: "persona" | "empresa" | "integracion";
  address: string;
  commune: string;
  notes?: string;
  createdAt: string;
  active: boolean;
}

export interface Maintenance {
  id: string;
  vehicleId: string;
  date: string;
  type: MaintenanceType;
  description: string;
  provider?: string;
  cost?: number;
  odometerKm?: number;
  nextDate?: string;
  nextOdometerKm?: number;
  status: MaintenanceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  code: string;
  plate: string;
  branchId: string;
  type: VehicleType;
  status: VehicleStatus;
  capacity: { weightKg: number; volumeM3: number; maxPackages?: number };
  currentLocation?: [number, number];
  currentDriverId?: string | null;
  currentRouteId?: string | null;
  maintenanceHistory: Maintenance[];
  active: boolean;
}

export interface Order {
  id: string;
  trackingNumber: string;
  status: OrderStatus;
  serviceType: ServiceType;
  type: OrderType;
  externalReference?: string;
  dimensions: { lengthCm: number; widthCm: number; heightCm: number; weightKg: number; volumetricWeight: number };
  content: { description: string; fragile: boolean; declaredValue?: number };
  insurance: { covered: boolean; amount?: number; premium?: number };
  origin: { branchId: string; address: string; coordinates?: [number, number] };
  destination: {
    recipientName: string;
    recipientRut?: string;
    recipientPhone: string;
    address: string;
    coordinates?: [number, number];
    instructions?: string;
    deliveryWindows?: { date: string; start: string; end: string }[];
  };
  sender: { clientId?: string; name: string; rut?: string; phone?: string; email?: string };
  routeAssignment?: {
    routeId: string;
    vehicleId: string;
    driverId: string;
    sequence: number;
    assignedAt: string;
    estimatedDeliveryAt?: string;
  };
  billing: {
    status: BillingStatus;
    dteType?: number;
    amount: number;
    tax: number;
    total: number;
    paidAt?: string;
  };
  history: { status: OrderStatus; at: string; by?: string; notes?: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface RouteWaypoint {
  sequence: number;
  type: "branch" | "pickup" | "delivery";
  coordinates: [number, number];
  orderId?: string;
}

export interface Route {
  id: string;
  code: string;
  branchId: string;
  date: string;
  status: RouteStatus;
  vehicleId: string;
  driverId: string;
  estimatedStartAt?: string;
  estimatedEndAt?: string;
  path?: { type: "LineString"; coordinates: [number, number][] };
  waypoints?: RouteWaypoint[];
  metrics?: {
    plannedDistanceKm: number;
    actualDistanceKm?: number;
    plannedTimeMin: number;
    actualTimeMin?: number;
    onTimeRate?: number;
  };
}

export interface Tariff {
  id: string;
  originZone: string;
  destinationZone: string;
  serviceType: ServiceType;
  vehicleType: VehicleType;
  baseAmount: number;
  weightTiers: { maxWeight: number; baseRate: number; perKgRate: number }[];
  volumeRateM3: number;
  sameDayMultiplier: number;
  fuelSurchargePercent: number;
  effectiveDate: string;
  expiresDate?: string;
  active: boolean;
}

export interface DashboardOverview {
  counts: { orders: number; routes: number; vehicles: number; users: number; branches: number };
  ordersByStatus: Record<string, number>;
  routesByStatus: Record<string, number>;
}
